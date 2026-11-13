import { afterRenderEffect, Component, computed, effect, ElementRef, inject, input, OnDestroy, output, signal, untracked } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import type { Change, Normalization } from '../../models/normalization';
import type { Context } from '../../models/context';
import { type Dataset, LIMITS } from '../../models/dataset';
import type { Issue } from '../../models/analysis-result';
import type { ValidationConfiguration } from '../../../record-sources/models/validation-configuration';
import type { Term } from '../../../catalog/models/catalog-term';
import type { DuplicateCounts, WorkerRequest, WorkerResponse } from '../../models/worker-protocol';
import type { SourceRecord } from '../../../collections/models/collection';
import { ImportConfirmation } from '../../components/import-confirmation/import-confirmation';
import { NormalizationPreviewState } from './normalization-preview-state';
import { NormalizationPreview } from '../../components/normalization-preview/normalization-preview';
import { missingCells, missingFields } from '../../engine/required-fields';
import { ColumnMapping } from '../../components/column-mapping/column-mapping';
import { RecordContext } from '../../components/record-context/record-context';
import { csvReport, jsonReport } from '../../engine/export';
import { label } from '../../../../core/i18n/localization';

@Component({
  selector: 'app-import',
  imports: [FormField, TableModule, ButtonModule, ColumnMapping, RecordContext, NormalizationPreview, ImportConfirmation],
  templateUrl: './import-workbench.html',
  host: { '(window:resize)': 'scrollActiveStep()' },
})
export class ImportWorkbench implements OnDestroy {
  label = label;
  active = input(true);
  normalizationVisible = output<boolean>();
  private messageId = 0;
  readonly previewState = new NormalizationPreviewState(() => new Worker(
    new URL('../../engine/normalization-preview.worker', import.meta.url), { type: 'module' },
  ), () => ++this.messageId);
  configuration = input.required<ValidationConfiguration>();
  configurationAvailable = input(true);
  terms = input.required<Term[]>();
  catalogVersion = input<number | null>(null);
  catalogAvailable = input(true);
  refreshMetadata = output<void>();
  importLocked = signal(false);
  analysisRevision = signal(0);
  duplicates = signal<DuplicateCounts>({ equalRows: { groups: 0, affectedRows: 0 }, occurrenceIds: { groups: 0, affectedRows: 0 } });
  readonly importReady = computed(() => this.issues() !== undefined && !this.busy() && this.configurationAvailable() && this.catalogAvailable() && this.catalogVersion() !== null);
  private preparation?: { id: number; offset: number; rows: SourceRecord[]; resolve: (rows: SourceRecord[]) => void; reject: (reason: Error) => void };
  readonly prepareImport = (): Promise<SourceRecord[]> => {
    if (!this.importReady() || !this.worker) return Promise.reject(new Error('Vuelva a analizar los datos antes de importar.'));
    return new Promise((resolve, reject) => {
      this.preparation = { id: ++this.messageId, offset: 0, rows: [], resolve, reject };
      this.requestPreparation();
    });
  };
  private requestPreparation() {
    const pending = this.preparation;
    if (!pending || !this.worker) return;
    this.worker.postMessage({ kind: 'prepare', id: pending.id, session: this.session, generation: this.generation, offset: pending.offset } satisfies WorkerRequest);
  }
  stages = [
    'Seleccionar archivo',
    'Contexto',
    'Mapear columnas',
    'Diagnóstico',
    'Normalizar',
    'Finalizar',
  ];
  step = signal(0);
  file = signal<File | undefined>(undefined);
  sheets = signal<string[]>([]);
  sheet = signal({ name: '' });
  sheetForm = form(this.sheet);
  data = signal<Dataset | undefined>(undefined);
  mapping = signal<Record<string, string>>({});
  formats = signal<Pick<Normalization, 'dateOrder' | 'decimalMode'>>({ dateOrder: 'safe', decimalMode: 'safe' });
  readonly options = computed<Normalization>(() => ({
    dateOrder: this.formats().dateOrder, decimalMode: this.formats().decimalMode,
    trim: true, emptyMarkers: true, dates: true, coordinates: true, numbers: true, duplicates: true,
  }));
  context = signal<Context | undefined>(undefined);
  setContext(context: Context) {
    this.context.set(context);
  }
  busy = signal(false);
  error = signal('');
  issues = signal<Issue[] | undefined>(undefined);
  changes = signal<Change[]>([]);
  private diagnosticOptions = signal<Normalization>({ trim: false, emptyMarkers: false });
  filter = signal({ text: '', severity: '', context: '' });
  filterForm = form(this.filter);
  filtered = computed(() =>
    (this.issues() ?? []).filter(
      (i) =>
        (!this.filter().severity || i.severity === this.filter().severity) &&
        (!this.filter().context || i.context === this.filter().context) &&
        `${i.field} ${i.row ?? ''} ${i.description} ${label(i.context)} ${i.configurationRevision}`
          .toLowerCase()
          .includes(this.filter().text.toLowerCase()),
    ),
  );
  issueContexts = computed(() => [...new Set((this.issues() ?? []).map(i => i.context))]);
  errors = computed(() => (this.issues() ?? []).filter((i) => i.severity === 'ERROR').length);
  warnings = computed(() => (this.issues() ?? []).filter((i) => i.severity === 'WARNING').length);
  mappedHeaders = computed(() => this.data()?.headers.map((h) => this.mapping()[h] || h) ?? []);
  mappingValid = computed(() => new Set(this.mappedHeaders()).size === this.mappedHeaders().length);
  missingSummary = computed(() => {
    const data = this.data();
    const context = this.context();
    return data && context ? missingFields(data, this.mapping(), this.configuration(), context, this.diagnosticOptions()) : [];
  });
  missingField = signal<string | undefined>(undefined);
  missingDetail = computed(() => {
    const data = this.data();
    const field = this.missingField();
    return data && field && this.issues() !== undefined &&
      this.missingSummary().some(item => item.field === field && !item.columnAbsent)
      ? missingCells(data, this.mapping(), field, this.diagnosticOptions()) : [];
  });
  showAllIssues = signal(false);
  detailHasChanges = computed(() => this.missingDetail().some(cell => cell.before !== cell.after));
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private detailOpener?: HTMLButtonElement;
  private focusDetail = signal(false);
  openMissing(field: string, event: Event) {
    if (this.missingField() === field) {
      this.closeDetail();
      return;
    }
    this.detailOpener = event.currentTarget as HTMLButtonElement;
    this.showAllIssues.set(false);
    this.missingField.set(field);
    this.focusDetail.set(true);
  }
  openAllIssues(event: Event) {
    this.detailOpener = event.currentTarget as HTMLButtonElement;
    this.missingField.set(undefined);
    this.showAllIssues.set(true);
    this.focusDetail.set(true);
  }
  closeDetail() {
    this.missingField.set(undefined);
    this.showAllIssues.set(false);
    this.focusDetail.set(false);
    this.detailOpener?.focus({ preventScroll: true });
  }
  private resultStep = 3;
  canVisit(index: number) {
    if (this.importLocked() && index !== 5) return false;
    if (index < 0 || index >= this.stages.length) return false;
    if (index === 0) return true;
    if (!this.data()) return false;
    if (index === 1) return true;
    if (!this.context() || !this.configurationAvailable()) return false;
    if (index === 2) return true;
    if (!this.mappingValid()) return false;
    return this.issues() !== undefined;
  }
  visit(index: number) {
    if (this.canVisit(index)) {
      this.step.set(index);
      if (index === 4) this.previewState.start(this.options());
    }
  }
  private worker?: Worker;
  private generation = 0;
  private session = 0;
  private validationId = 0;
  constructor() {
    effect(() => {
      const options = this.options();
      untracked(() => this.previewState.update(options));
    });
    effect(() => {
      this.options();
      this.context();
      this.configuration();
      this.configurationAvailable();
      this.terms();
      this.catalogVersion();
      this.catalogAvailable();
      this.invalidate();
    });
    effect(() => {
      const data = this.data();
      const mapping = this.mapping();
      untracked(() => this.previewState.reset(data, mapping));
      this.missingField.set(undefined);
      this.showAllIssues.set(false);
    });
    effect(() => this.normalizationVisible.emit(this.step() === 4));
    afterRenderEffect(() => this.scrollActiveStep());
    afterRenderEffect(() => {
      const focus = this.focusDetail();
      const field = this.missingField();
      const all = this.showAllIssues();
      if (focus && this.step() === 3 && (field || all)) {
        this.host.nativeElement.querySelector<HTMLElement>(all ? '#all-issues-title' : '#missing-cell-title')
          ?.focus({ preventScroll: true });
      }
    });
  }
  protected scrollActiveStep() {
    const index = this.step();
    const strip = this.host.nativeElement.querySelector<HTMLElement>('.steps');
    const active = strip?.children[index] as HTMLElement | undefined;
    if (strip && active) {
      const bounds = strip.getBoundingClientRect();
      const item = active.getBoundingClientRect();
      const delta = item.left < bounds.left ? item.left - bounds.left
        : item.right > bounds.right ? item.right - bounds.right : 0;
      // Move only the horizontal strip, never the document or its vertical position.
      strip.scrollTo?.({ left: strip.scrollLeft + delta, behavior: 'instant' });
    }
  }
  ngOnDestroy() {
    this.previewState.destroy();
    this.worker?.terminate();
    this.preparation?.reject(new Error('Preparación cancelada.'));
  }
  invalidate() {
    this.generation++;
    this.analysisRevision.update(value => value + 1);
    this.preparation?.reject(new Error('La sesión de análisis ya no está vigente.'));
    this.preparation = undefined;
    this.worker?.terminate();
    this.worker = undefined;
    this.busy.set(false);
    this.issues.set(undefined);
    this.changes.set([]);
    this.missingField.set(undefined);
    this.showAllIssues.set(false);
    this.focusDetail.set(false);
    this.detailOpener = undefined;
  }
  cancel() {
    this.invalidate();
    this.error.set('Procesamiento cancelado. No se enviaron datos al servidor.');
  }
  private dispatch(request: WorkerRequest) {
    const reuse = request.kind === 'validate' && !!this.worker;
    if (!reuse) this.worker?.terminate();
    this.error.set('');
    this.busy.set(true);
    const worker = reuse ? this.worker! : new Worker(new URL('../../engine/analysis.worker', import.meta.url), { type: 'module' });
    this.worker = worker;
    if (request.kind === 'validate') {
      if (!reuse) this.session++;
      this.generation++;
      request = { ...request, session: this.session, generation: this.generation, ...(reuse ? { data: undefined } : {}) };
      this.validationId = request.id;
      this.issues.set(undefined);
      this.analysisRevision.update(value => value + 1);
    }
    const generation = this.generation;
    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (worker !== this.worker || generation !== this.generation) return;
      const pending = this.preparation;
      if (pending && data.id === pending.id) {
        if (!('session' in data) || data.session !== this.session || data.generation !== this.generation) return;
        if (data.kind === 'error') { pending.reject(new Error(data.message)); this.preparation = undefined; }
        else if (data.kind === 'prepared' && data.offset === pending.offset && data.rows.length > 0 && data.rows.length <= 256) {
          pending.rows.push(...data.rows);
          pending.offset += data.rows.length;
          if (data.done) { this.preparation = undefined; pending.resolve(pending.rows); }
          else { pending.id = ++this.messageId; this.requestPreparation(); }
        }
        return;
      }
      if (data.id !== request.id || (data.kind === 'result' && (data.session !== this.session || data.generation !== this.generation || data.id !== this.validationId))) return;
      this.busy.set(false);
      if (data.kind !== 'result') { worker.terminate(); this.worker = undefined; }
      if (data.kind === 'error') this.error.set(data.message);
      else if (data.kind === 'sheets') {
        this.sheets.set(data.sheets);
        this.sheet.set({ name: data.sheets[0] ?? '' });
      } else if (data.kind === 'parsed') {
        this.data.set(data.data);
        this.step.set(1);
      } else if (data.kind === 'result') {
        this.duplicates.set(data.duplicates);
        this.issues.set(data.issues);
        this.changes.set(data.changes);
        this.step.set(this.resultStep);
      }
    };
    worker.onerror = () => {
      if (worker === this.worker && generation === this.generation) {
        this.busy.set(false);
        this.preparation?.reject(new Error('No se pudo preparar la importación. Los originales se conservan.'));
        this.preparation = undefined;
        this.issues.set(undefined);
        this.error.set(
          'El proceso local no pudo analizar este archivo. Pruebe con un CSV más pequeño.',
        );
        worker.terminate();
        this.worker = undefined;
      }
    };
    worker.postMessage(request);
  }
  chooseFile(event: Event) {
    this.previewState.reset(undefined, {});
    this.invalidate();
    this.data.set(undefined);
    this.sheets.set([]);
    this.mapping.set({});
    this.step.set(0);
    this.error.set('');
    const file = (event.target as HTMLInputElement).files?.[0];
    this.file.set(file);
    if (!file) return;
    if (file.size > LIMITS.bytes) {
      this.error.set('Se superó el límite del archivo (10 MiB).');
      return;
    }
    // Defer until reactive invalidation of previous inputs is complete.
    queueMicrotask(() => this.dispatch({ id: ++this.messageId, kind: 'parse', file }));
  }
  loadSheet() {
    const file = this.file();
    if (file) {
      this.previewState.reset(undefined, {});
      this.data.set(undefined);
      this.invalidate();
      this.dispatch({ id: ++this.messageId, kind: 'parse', file, sheet: this.sheet().name });
    }
  }
  map(header: string, value: string) {
    this.invalidate();
    this.mapping.update((m) => ({ ...m, [header]: value }));
  }
  checked(event: Event) {
    return (event.target as HTMLInputElement).checked;
  }
  validate(normalizing = false) {
    const data = this.data();
    const context = this.context();
    if (!data || !context || !this.configurationAvailable() || !this.mappingValid() || (normalizing && !this.previewState.ready())) return;
    this.missingField.set(undefined);
    this.showAllIssues.set(false);
    this.focusDetail.set(false);
    this.resultStep = normalizing ? 4 : 3;
    this.diagnosticOptions.set(normalizing ? { ...this.options() } : { trim: false, emptyMarkers: false });
    this.dispatch({
      id: ++this.messageId,
      kind: 'validate',
      session: this.session,
      generation: this.generation,
      data,
      mapping: this.mapping(),
      configuration: this.configuration(),
      terms: this.terms(),
      context,
      options: this.diagnosticOptions(),
    });
  }
  download(kind: 'json' | 'csv') {
    const issues = this.issues();
    if (!issues) return;
    const blob = new Blob([kind === 'json' ? jsonReport(issues) : csvReport(issues)], {
      type: kind === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostico-museo.${kind}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
