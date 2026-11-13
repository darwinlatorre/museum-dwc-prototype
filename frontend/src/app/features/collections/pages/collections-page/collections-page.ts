import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, Injector, OnDestroy, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ROUTER_OUTLET_DATA, RouterLink } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { DwcPicker } from '../../../../shared/ui/dwc-picker/dwc-picker';
import { label as contextLabel } from '../../../../core/i18n/localization';
import { CollectionsApi } from '../../data-access/collections-api';
import { CollectionNavigation } from '../../guards/unsaved-collection';
import { CollectionApiError } from '../../models/collection';
import type { CollectionInfo, CollectionRecord, Page, TrashFilter } from '../../models/collection';
import type { CollectionsMetadata } from '../../models/collections-metadata';
import type { Issue } from '../../../importer/models/analysis-result';

type Editor = { kind: 'add' | 'edit'; record?: CollectionRecord; headers: string[]; mapping: Record<string, string>;
  revision: number; configurationRevision: number; catalogVersion: number };
type Confirmation = { kind: 'trash' | 'restore'; record: CollectionRecord };

@Component({
  selector: 'app-collections-page', imports: [RouterLink, ReactiveFormsModule, DwcPicker],
  templateUrl: './collections-page.html',
  host: { '(window:beforeunload)': 'beforeUnload($event)' },
})
export class CollectionsPage implements OnDestroy {
  private readonly api = inject(CollectionsApi);
  private readonly client = inject(QueryClient);
  private readonly route = inject(ActivatedRoute);
  private readonly navigation = inject(CollectionNavigation);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly metadata = inject(ROUTER_OUTLET_DATA) as Signal<CollectionsMetadata>;
  readonly id = signal<string | null>(null);
  readonly collection = signal<CollectionInfo | undefined>(undefined);
  readonly list = signal<Page<CollectionInfo> | undefined>(undefined);
  readonly records = signal<Page<CollectionRecord> | undefined>(undefined);
  readonly page = signal(0);
  readonly size = signal(25);
  readonly filter = signal<TrashFilter>('ACTIVE');
  readonly loading = signal(false);
  readonly recordLoading = signal(false);
  readonly message = signal('');
  readonly readError = signal('');
  readonly issues = signal<Issue[]>([]);
  readonly editor = signal<Editor | undefined>(undefined);
  readonly confirmation = signal<Confirmation | undefined>(undefined);
  readonly search = signal('');
  readonly field = signal('');
  readonly warnings = signal(false);
  readonly blocked = signal(false);
  readonly uncertain = signal(false);
  readonly reconciled = signal(false);
  readonly busy = signal(false);
  readonly schemas = signal<CollectionRecord[]>([]);
  readonly values = new FormArray<FormControl<string>>([]);
  readonly contextLabel = contextLabel;
  readonly columns = computed(() => [...new Set((this.records()?.items ?? []).flatMap(record => this.fields(record)))]);
  readonly columnPage = signal(0);
  readonly visibleColumns = computed(() => this.columns().slice(this.columnPage() * 25, (this.columnPage() + 1) * 25));
  private readonly cellValues = computed(() => new Map((this.records()?.items ?? []).map(record =>
    [record.id, new Map(this.fields(record).map((field, index) => [field, record.values[index]]))])));
  readonly total = computed(() => (this.id() ? this.records() : this.list())?.totalElements ?? 0);
  readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.size())));
  readonly metadataChanged = computed(() => {
    const editor = this.editor();
    return !!editor && (editor.configurationRevision !== this.metadata().configuration()?.revision
      || editor.catalogVersion !== this.metadata().snapshot()?.snapshotVersion);
  });
  readonly canWrite = computed(() => !this.metadataChanged() && !this.busy() && !this.loading() && !this.recordLoading() && !this.blocked() && !this.uncertain()
    && this.metadata()?.available() && (!this.issues().some(issue => issue.severity === 'ERROR'))
    && (!this.issues().some(issue => issue.severity === 'WARNING') || this.warnings()));
  private session = new AbortController();
  private pageController?: AbortController;
  private recordController?: AbortController;
  private pageOperation = 0;
  private recordOperation = 0;
  private origin?: HTMLElement;
  private dirty = false;
  private destroyed = false;
  constructor() {
    this.navigation.current = this;
    this.values.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.dirty = true; this.issues.set([]); this.warnings.set(false);
    });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.session.abort(); this.session = new AbortController();
      this.cancelReads(); this.id.set(params.get('id')); this.page.set(0); this.filter.set('ACTIVE');
      this.collection.set(undefined); this.records.set(undefined); this.list.set(undefined); this.clearEditor();
      this.uncertain.set(this.navigation.uncertainCollections.has(this.id() ?? '')); this.reconciled.set(false); this.confirmation.set(undefined);
      this.message.set(this.uncertain() ? 'Resultado desconocido pendiente de reconciliación con el servidor.' : '');
      void this.load();
    });
    inject(DestroyRef).onDestroy(() => { this.destroyed = true; });
  }
  fields(record: Pick<CollectionRecord, 'headers' | 'mapping'>) {
    return record.headers.map(header => Object.hasOwn(record.mapping, header) && record.mapping[header] ? record.mapping[header] : header);
  }
  cell(record: CollectionRecord, column: string) {
    return this.cellValues().get(record.id)?.get(column) ?? '—';
  }
  text(event: Event) { return (event.target as HTMLInputElement).value; }
  private cancelReads() {
    this.pageController?.abort(); this.recordController?.abort(); this.pageOperation++; this.recordOperation++;
    this.recordLoading.set(false);
  }
  async load() {
    const id = this.id(), session = this.session;
    this.loading.set(true); this.readError.set('');
    try {
      if (id) {
        const collection = await this.api.detail(id, session.signal);
        if (session !== this.session || session.signal.aborted) return;
        this.collection.set(collection);
      }
      await this.loadPage();
    } catch (error) { if (!session.signal.aborted) this.readError.set(this.errorText(error)); }
    finally { if (session === this.session) this.loading.set(false); }
  }
  async loadPage() {
    this.pageController?.abort(); const controller = this.pageController = new AbortController();
    const operation = ++this.pageOperation, id = this.id();
    this.loading.set(true); this.readError.set('');
    try {
      if (id) {
        const result = await this.api.records(id, this.page(), this.size(), this.filter(), controller.signal);
        if (operation === this.pageOperation) { this.records.set(result); this.columnPage.set(0); }
      } else {
        const result = await this.client.fetchQuery({ queryKey: ['collections', this.page(), this.size()], retry: false, staleTime: 0,
          queryFn: () => this.api.list(this.page(), this.size(), controller.signal) });
        if (operation === this.pageOperation) this.list.set(result);
      }
    } catch (error) { if (operation === this.pageOperation && !controller.signal.aborted) this.readError.set(this.errorText(error)); }
    finally { if (operation === this.pageOperation) this.loading.set(false); }
  }
  changeColumns(direction: number) {
    this.columnPage.update(page => Math.max(0, Math.min(Math.ceil(this.columns().length / 25) - 1, page + direction)));
  }
  changePage(page: number) {
    if (this.busy() || (!this.uncertain() && !this.discard())) return;
    this.page.set(page); this.records.set(undefined); this.list.set(undefined); void this.loadPage();
  }
  changeSize(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (!this.uncertain() && !this.discard()) { select.value = String(this.size()); return; }
    this.size.set(Number(select.value)); this.page.set(0); this.records.set(undefined); this.list.set(undefined); void this.loadPage();
  }
  changeFilter(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (!this.uncertain() && !this.discard()) { select.value = this.filter(); return; }
    this.filter.set(select.value as TrashFilter); this.page.set(0); this.records.set(undefined); void this.loadPage();
  }
  async edit(record: CollectionRecord, event: Event) {
    if (!this.discard()) return;
    this.origin = event.currentTarget as HTMLElement;
    this.recordController?.abort(); const controller = this.recordController = new AbortController(), operation = ++this.recordOperation;
    this.recordLoading.set(true); this.message.set('');
    try {
      const current = await this.api.record(this.id()!, record.id, controller.signal);
      if (operation !== this.recordOperation) return;
      this.startEditor('edit', current.headers, current.mapping, current);
    } catch (error) { if (!controller.signal.aborted) this.message.set(this.errorText(error)); }
    finally { if (operation === this.recordOperation) this.recordLoading.set(false); }
  }
  add(event: Event) {
    if (!this.discard() || !this.collection() || !this.metadata()?.available() || this.uncertain()) return;
    this.origin = event.currentTarget as HTMLElement;
    this.schemas.set(this.records()?.items ?? []);
    this.startEditor('add', this.required(), {});
  }
  private required() {
    return this.metadata().configuration()?.contexts.find(context => context.context === this.collection()?.context)?.requiredFields ?? [];
  }
  private startEditor(kind: 'add' | 'edit', headers: string[], mapping: Record<string, string>, record?: CollectionRecord) {
    const configuration = this.metadata().configuration(), snapshot = this.metadata().snapshot();
    if (!configuration || !snapshot || !this.collection()) { this.message.set('Actualice los metadatos antes de editar.'); return; }
    this.clearEditor();
    this.editor.set({ kind, record, headers: [...headers], mapping: { ...mapping }, revision: this.collection()!.revision,
      configurationRevision: configuration.revision, catalogVersion: snapshot.snapshotVersion });
    (record?.values ?? headers.map(() => '')).forEach(value => this.values.push(new FormControl(value, { nonNullable: true }), { emitEvent: false }));
    this.dirty = kind === 'add'; this.focusEditor();
  }
  chooseSchema(event: Event) {
    const selected = this.schemas().find(record => record.id === this.text(event));
    if (!selected || !this.editor() || !window.confirm('¿Sustituir los campos y valores del nuevo borrador por este esquema vacío?')) return;
    // A manual record has no imported source: use the selected effective fields as its concrete headers.
    this.startEditor('add', [...new Set([...this.fields(selected), ...this.required()])], {});
  }
  async trashSchemas() {
    const session = this.session;
    this.recordLoading.set(true);
    try {
      const page = await this.api.records(this.id()!, 0, 25, 'TRASHED', session.signal);
      if (session !== this.session) return;
      this.schemas.set(page.items); this.message.set('Esquemas de los primeros 25 registros en papelera. Para otros, cierre el editor y pagine en Papelera o Todos.');
    } catch (error) { if (!session.signal.aborted) this.message.set(this.errorText(error)); }
    finally { if (session === this.session) this.recordLoading.set(false); }
  }
  addField() {
    const editor = this.editor(), field = this.field();
    if (!editor || editor.kind !== 'add' || !field || this.fields(editor).includes(field) || editor.headers.includes(field) || this.busy() || this.uncertain()) return;
    this.editor.set({ ...editor, headers: [...editor.headers, field] });
    this.values.push(new FormControl('', { nonNullable: true })); this.field.set(''); this.dirty = true;
  }
  fieldVisible(index: number) {
    const editor = this.editor(); return !!editor && (editor.headers[index] + ' ' + this.fields(editor)[index]).toLowerCase().includes(this.search().toLowerCase());
  }
  private consent() {
    const editor = this.editor();
    return { expectedRevision: editor?.revision ?? this.collection()!.revision,
      configurationRevision: editor?.configurationRevision ?? this.metadata().configuration()!.revision,
      catalogVersion: editor?.catalogVersion ?? this.metadata().snapshot()!.snapshotVersion, warningsConfirmed: this.warnings() };
  }
  async save() {
    const editor = this.editor();
    if (!editor || !this.canWrite() || editor.record?.trashed) return;
    const values = this.values.getRawValue();
    await this.mutate(() => editor.kind === 'edit'
      ? this.api.edit(this.id()!, editor.record!.id, { ...this.consent(), values }, this.session.signal)
      : this.api.add(this.id()!, { ...this.consent(), headers: editor.headers, mapping: editor.mapping,
        row: { sourceRow: 1, values, originalValues: [...values] } }, this.session.signal));
  }
  confirmAction(kind: 'trash' | 'restore', record: CollectionRecord, event: Event) {
    if (!this.discard() || this.uncertain() || this.busy()) return;
    this.origin = event.currentTarget as HTMLElement; this.issues.set([]); this.warnings.set(false); this.message.set('');
    this.confirmation.set({ kind, record });
    afterNextRender(() => {
      const dialog = this.element.nativeElement.querySelector<HTMLDialogElement>('dialog');
      if (dialog?.showModal) dialog.showModal();
      else dialog?.setAttribute('open', '');
      dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    }, { injector: this.injector });
  }
  closeConfirmation() {
    if (this.busy() || this.uncertain()) return;
    this.confirmation.set(undefined); this.issues.set([]);
    // El diálogo modal aún vuelve inerte el fondo hasta que Angular lo retira.
    afterNextRender(() => this.origin?.focus(), { injector: this.injector });
  }
  async applyAction() {
    const action = this.confirmation();
    if (!action || !this.canWrite()) return;
    await this.mutate(() => action.kind === 'trash'
      ? this.api.trash(this.id()!, action.record.id, this.collection()!.revision, this.session.signal)
      : this.api.restore(this.id()!, action.record.id, this.consent(), this.session.signal));
  }
  private async mutate(send: () => Promise<CollectionInfo>) {
    // Invalidate older reads before accepting the authoritative mutation response.
    this.cancelReads(); this.busy.set(true); this.message.set('');
    try {
      const result = await send();
      if (this.destroyed) return;
      this.collection.set(result); this.client.setQueryData(['collections', result.id], result);
      void this.client.invalidateQueries({ queryKey: ['collections'], refetchType: 'none' });
      this.clearEditor(); this.confirmation.set(undefined); this.message.set('Cambios guardados.');
      await this.loadPage();
      afterNextRender(() => {
        const target = this.origin?.isConnected ? this.origin : this.element.nativeElement.querySelector<HTMLElement>('#collections-title');
        target?.focus();
      }, { injector: this.injector });
    } catch (error) {
      if (this.destroyed) return;
      if (!(error instanceof CollectionApiError) || error.unknownOutcome) {
        this.confirmation.set(undefined);
        this.navigation.uncertainCollections.add(this.id()!);
        this.uncertain.set(true); this.reconciled.set(false);
        this.message.set('Resultado desconocido: puede que el servidor haya guardado la operación. No se repetirá. Actualice y compruebe los registros antes de escribir de nuevo.');
      } else {
        this.message.set(`${error.message} No se guardaron cambios de esta solicitud.`); this.issues.set(error.problem.issues ?? []);
        this.blocked.set(['REVISION_CONFLICT', 'CONFIGURATION_CHANGED', 'CATALOG_CHANGED', 'AUTHORITY_UNAVAILABLE', 'RECORD_TRASHED', 'RECORD_ACTIVE'].includes(error.problem.code ?? ''));
      }
    } finally { this.busy.set(false); }
  }
  async refreshDraft() {
    if (this.busy()) return;
    const session = this.session, editor = this.editor();
    this.loading.set(true); this.readError.set('');
    try {
      const info = await this.api.detail(this.id()!, session.signal);
      if (session !== this.session) return;
      if (!await this.metadata().refresh()) throw new Error('No se pudieron actualizar los metadatos. El borrador se conserva.');
      if (session !== this.session) return;
      const action = this.confirmation();
      const recordId = editor?.record?.id ?? action?.record.id;
      const record = recordId ? await this.api.record(info.id, recordId, session.signal) : undefined;
      if (session !== this.session) return;
      this.collection.set(info);
      if (editor) this.editor.set({ ...editor, record: record ?? editor.record, revision: info.revision,
        configurationRevision: this.metadata().configuration()!.revision, catalogVersion: this.metadata().snapshot()!.snapshotVersion });
      if (action && record && (action.kind === 'restore' ? !record.trashed : record.trashed)) {
        this.confirmation.set(undefined); this.origin?.focus();
      }
      this.blocked.set(!!editor && !!record?.trashed); this.issues.set([]); this.warnings.set(false);
      await this.loadPage();
      if (this.readError()) throw new Error(this.readError());
      this.reconciled.set(this.uncertain());
      this.message.set(this.uncertain() ? 'Compruebe el resultado en los registros del servidor. No vuelva a enviar el borrador incierto.' : 'Borrador conservado con revisiones actuales. Guardar solicita una nueva validación del servidor.');
    } catch (error) { if (!session.signal.aborted) { this.readError.set(this.errorText(error)); this.blocked.set(true); } }
    finally { if (session === this.session) this.loading.set(false); }
  }
  acknowledgeReconciliation() {
    if (!this.reconciled()) return;
    this.navigation.uncertainCollections.delete(this.id()!);
    this.uncertain.set(false); this.reconciled.set(false); this.blocked.set(false); this.confirmation.set(undefined); this.clearEditor();
    this.message.set('Reconciliación confirmada. El borrador incierto no se reenviará.'); this.origin?.focus();
  }
  private clearEditor() {
    this.editor.set(undefined); this.values.clear({ emitEvent: false }); this.dirty = false; this.search.set(''); this.field.set('');
    this.issues.set([]); this.warnings.set(false); this.blocked.set(false);
  }
  canLeave() {
    if (this.busy()) return false;
    return !(this.dirty || this.field() || this.uncertain()) || window.confirm(this.uncertain()
      ? 'El resultado es desconocido. ¿Salir y reconciliar con el servidor antes de otra escritura?' : 'Hay cambios sin guardar. ¿Descartar el borrador?');
  }
  private discard() {
    if (this.busy() || this.uncertain() || !this.canLeave()) return false;
    this.clearEditor(); return true;
  }
  cancelEditor() { if (this.discard()) this.origin?.focus(); }
  escape(event: Event) { event.preventDefault(); this.cancelEditor(); }
  beforeUnload(event: BeforeUnloadEvent) {
    if (this.dirty || this.field() || this.busy() || this.uncertain()) { event.preventDefault(); event.returnValue = ''; }
  }
  private focusEditor() {
    afterNextRender(() => this.element.nativeElement.querySelector<HTMLElement>('#record-editor-title')?.focus(), { injector: this.injector });
  }
  private errorText(error: unknown) { return error instanceof Error ? error.message : 'No se pudo completar la lectura.'; }
  ngOnDestroy() {
    this.session.abort(); this.cancelReads();
    if (this.navigation.current === this) this.navigation.current = undefined;
  }
}
