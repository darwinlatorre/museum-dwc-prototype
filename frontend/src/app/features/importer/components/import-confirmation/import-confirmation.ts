import { Component, computed, effect, inject, Injector, input, OnDestroy, output, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollectionsApi } from '../../../collections/data-access/collections-api';
import { CollectionApiError } from '../../../collections/models/collection';
import type { CollectionInfo, ImportReceipt, ImportRequest, Page, SourceRecord } from '../../../collections/models/collection';
import type { Context } from '../../models/context';
import type { DuplicateCounts } from '../../models/worker-protocol';
import type { Issue } from '../../models/analysis-result';
import { assertImportLimits } from '../../engine/import-limits';

@Component({
  selector: 'app-import-confirmation',
  imports: [RouterLink],
  templateUrl: './import-confirmation.html',
})
export class ImportConfirmation implements OnDestroy {
  active = input(false);
  ready = input.required<boolean>();
  analysisRevision = input.required<number>();
  rowCount = input.required<number>();
  headers = input.required<string[]>();
  mapping = input.required<Record<string, string>>();
  context = input.required<Context>();
  configurationRevision = input.required<number>();
  catalogVersion = input.required<number | null>();
  issues = input.required<Issue[]>();
  duplicates = input.required<DuplicateCounts>();
  prepare = input.required<() => Promise<SourceRecord[]>>();
  locked = output<boolean>();
  refreshMetadata = output<void>();
  cancelPreparation = output<void>();
  name = signal('');
  destination = signal('new');
  transferConsent = signal(false);
  warningsConsent = signal(false);
  page = signal<Page<CollectionInfo> | undefined>(undefined);
  loading = signal(false);
  listError = signal('');
  status = signal<'idle' | 'preparing' | 'sending' | 'failed' | 'unknown' | 'success'>('idle');
  message = signal('');
  receipt = signal<ImportReceipt | undefined>(undefined);
  serverIssues = signal<Issue[]>([]);
  needsRefresh = signal(false);
  readonly errors = computed(() => this.issues().filter(issue => issue.severity === 'ERROR').length);
  readonly warnings = computed(() => this.issues().filter(issue => issue.severity === 'WARNING').length);
  readonly duplicateBlocked = computed(() => this.duplicates().equalRows.groups > 0 || this.duplicates().occurrenceIds.groups > 0);
  readonly frozen = computed(() => ['preparing', 'sending', 'unknown', 'success'].includes(this.status()));
  readonly existing = computed(() => this.page()?.items.find(item => item.id === this.destination()));
  readonly canConfirm = computed(() => this.ready() && !this.frozen() && !this.needsRefresh() && !this.errors() && !this.duplicateBlocked()
    && this.rowCount() > 0 && this.transferConsent() && (!this.warnings() || this.warningsConsent())
    && (this.destination() === 'new' ? this.name().trim().length > 0 && this.name().length <= 200 : this.existing()?.context === this.context()));
  private injector = inject(Injector);
  private request?: ImportRequest;
  private controller?: AbortController;
  private listController?: AbortController;
  private operation = 0;
  private listOperation = 0;
  constructor() {
    effect(() => this.locked.emit(['preparing', 'sending', 'unknown'].includes(this.status())));
    let lastRevision: number | undefined;
    effect(() => {
      const revision = this.analysisRevision();
      const ready = this.ready();
      untracked(() => {
        if (revision !== lastRevision && !['preparing', 'sending', 'unknown'].includes(this.status())) {
          this.request = undefined; this.receipt.set(undefined); this.status.set('idle');
          this.transferConsent.set(false); this.warningsConsent.set(false);
        }
        if (ready && !this.frozen()) this.needsRefresh.set(false);
      });
      lastRevision = revision;
    });
    effect(() => {
      this.name(); this.destination(); this.transferConsent(); this.warningsConsent();
      untracked(() => {
        // Uncertain requests retain their exact payload/key even if metadata refreshes.
        if (!this.frozen()) { this.request = undefined; this.status.set('idle'); this.message.set(''); this.serverIssues.set([]); }
      });
    });
  }
  async loadCollections(page = 0) {
    if (this.frozen()) return;
    this.listController?.abort();
    const operation = ++this.listOperation;
    this.listController = new AbortController();
    this.loading.set(true); this.listError.set('');
    try {
      const result = await this.injector.get(CollectionsApi).list(page, 50, this.listController.signal);
      if (operation !== this.listOperation) return;
      this.page.set(result);
      this.destination.set('new');
    } catch (error) {
      if (operation === this.listOperation) this.listError.set(error instanceof Error ? error.message : 'No se pudieron cargar las colecciones.');
    } finally { if (operation === this.listOperation) this.loading.set(false); }
  }
  text(event: Event) { return (event.target as HTMLInputElement).value; }
  checked(event: Event) { return (event.target as HTMLInputElement).checked; }
  async confirm() {
    if (!this.canConfirm()) return;
    const operation = ++this.operation;
    const revision = this.analysisRevision();
    this.status.set('preparing'); this.message.set('');
    // Capture every confirmation component before awaiting the worker.
    const collection = this.existing();
    const body = {
      collectionId: collection?.id ?? null, name: collection ? null : this.name(), context: this.context(),
      expectedRevision: collection?.revision ?? null, configurationRevision: this.configurationRevision(),
      catalogVersion: this.catalogVersion()!, warningsConfirmed: this.warningsConsent(),
      idempotencyKey: crypto.randomUUID(), headers: [...this.headers()], mapping: { ...this.mapping() },
    };
    try {
      const rows = await this.prepare()();
      if (operation !== this.operation) return;
      if (!this.ready() || revision !== this.analysisRevision()) throw new Error('El análisis cambió; vuelva a analizar y confirmar.');
      const request = { ...body, rows };
      assertImportLimits(request);
      this.request = request;
      await this.send();
    } catch (error) {
      if (operation === this.operation) { this.status.set('failed'); this.message.set(error instanceof Error ? error.message : 'No se pudo preparar la importación.'); }
    }
  }
  retry() {
    if (this.status() !== 'unknown' || !this.request) return;
    void this.send();
  }
  private async send() {
    if (!this.request || this.status() === 'sending') return;
    this.status.set('sending'); this.message.set('');
    this.controller = new AbortController();
    const operation = this.operation;
    try {
      const receipt = await this.injector.get(CollectionsApi).import(this.request, this.controller.signal);
      if (operation !== this.operation) return;
      this.receipt.set(receipt); this.status.set('success');
    } catch (error) {
      if (operation !== this.operation) return;
      if (!(error instanceof CollectionApiError) || error.unknownOutcome) {
        this.status.set('unknown');
        this.message.set('Resultado desconocido: la respuesta se perdió o el servidor no confirmó el resultado. Puede que los registros ya estén guardados. Reintente la misma confirmación, sin crear otra importación.');
      } else {
        this.status.set('failed'); this.message.set(`${error.message} No se guardó ninguna fila de esta solicitud.`);
        this.serverIssues.set(error.problem.issues ?? []);
        this.needsRefresh.set(['CONFIGURATION_CHANGED', 'CATALOG_CHANGED', 'REVISION_CONFLICT', 'AUTHORITY_UNAVAILABLE'].includes(error.problem.code ?? ''));
        this.request = undefined;
      }
    }
  }
  refresh() { this.needsRefresh.set(true); this.refreshMetadata.emit(); }
  cancel() {
    if (this.status() !== 'preparing') return;
    this.operation++; this.status.set('idle'); this.cancelPreparation.emit();
  }
  ngOnDestroy() {
    this.operation++; this.listOperation++;
    this.controller?.abort(); this.listController?.abort();
    this.locked.emit(false);
  }
}
