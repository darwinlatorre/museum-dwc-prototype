import { computed, signal } from '@angular/core';
import type { Dataset } from '../../models/dataset';
import type { Normalization } from '../../models/normalization';
import { isPreviewResponse } from '../../models/normalization-preview';
import type { PreviewMetadata, PreviewRequest, PreviewRow, PreviewWindow } from '../../models/normalization-preview';

/** Local worker lifetime; never a Query cache. Analysis has its own generation. */
export class NormalizationPreviewState {
  readonly metadata = signal<PreviewMetadata | undefined>(undefined);
  readonly rows = signal<PreviewRow[]>([]);
  readonly status = signal<'idle' | 'calculating' | 'ready' | 'cancelled' | 'error'>('idle');
  readonly error = signal('');
  readonly paging = signal(false);
  readonly hideEmpty = signal(false);
  // Requested selection and confirmed window are deliberately separate while paging.
  readonly rowFilter = signal<'all' | 'changed'>('changed');
  readonly window = signal<PreviewWindow>({ offset: 0, limit: 10, columnIndices: [], rowFilter: 'changed' });
  readonly viewTotal = computed(() => this.window().rowFilter === 'changed'
    ? this.metadata()?.changedRows ?? 0 : this.metadata()?.totalRows ?? 0);
  readonly revision = signal(0);
  readonly visibleColumns = computed(() => {
    const metadata = this.metadata();
    const hidden = new Set(this.hideEmpty() ? metadata?.emptyColumnIndices : []);
    return metadata?.columns.filter(column => !hidden.has(column.columnIndex)) ?? [];
  });
  readonly columns = computed(() => {
    const selected = new Set(this.window().columnIndices);
    return this.metadata()?.columns.filter(column => selected.has(column.columnIndex)) ?? [];
  });
  readonly ready = computed(() => this.status() === 'ready' && !this.paging());
  private worker?: Worker;
  private original?: Dataset;
  private mapping: Record<string, string> = {};
  private options: Normalization = { trim: false, emptyMarkers: false };
  private session = 0;
  private generation = 0;
  private calculationId = 0;
  private pageId = 0;
  private columnOffset = 0;
  private confirmed = false;
  private requestedWindow: PreviewWindow = { offset: 0, limit: 10, columnIndices: [], rowFilter: 'changed' };
  constructor(private readonly createWorker: () => Worker, private readonly nextId: () => number) {}

  reset(original: Dataset | undefined, mapping: Record<string, string>) {
    this.worker?.terminate();
    this.worker = undefined;
    this.session++;
    this.confirmed = false;
    this.original = original;
    this.mapping = mapping;
    this.metadata.set(undefined);
    this.rows.set([]);
    this.status.set('idle');
    this.paging.set(false);
    this.error.set('');
    this.columnOffset = 0;
    this.rowFilter.set('changed');
    this.requestedWindow = { offset: 0, limit: 10, columnIndices: [], rowFilter: 'changed' };
    this.window.set(this.requestedWindow);
    this.revision.update(value => value + 1);
  }
  start(options: Normalization) {
    this.options = { ...options };
    if (!this.original || this.status() !== 'idle') return;
    this.calculate();
  }
  update(options: Normalization) {
    this.options = { ...options };
    if (this.worker && this.status() !== 'error' && this.status() !== 'cancelled') this.calculate();
  }
  retry() {
    if (!this.original) return;
    // An unsuccessful init does not acknowledge ownership of the new source.
    if (!this.confirmed || this.status() === 'error') {
      this.worker?.terminate();
      this.worker = undefined;
      this.session++;
      this.confirmed = false;
    }
    this.calculate();
  }
  cancel() {
    if (!this.worker) return;
    this.calculationId = this.nextId();
    this.pageId = 0;
    try { this.worker.postMessage({ kind: 'preview-cancel', id: this.calculationId, session: this.session, generation: this.generation } satisfies PreviewRequest); }
    catch { this.fail('No se pudo cancelar la vista local. Los originales se conservan.'); return; }
    this.status.set('cancelled');
    this.paging.set(false);
    this.revision.update(value => value + 1);
  }
  private calculate() {
    if (!this.original) return;
    const init = !this.worker;
    if (init) {
      try {
        const worker = this.createWorker();
        this.worker = worker;
        worker.onmessage = ({ data }: MessageEvent<unknown>) => {
          if (worker !== this.worker || !isPreviewResponse(data) || data.session !== this.session || data.generation !== this.generation) return;
          if (data.kind === 'preview-ready' && data.id === this.calculationId && this.status() === 'calculating'
            && data.window.rowFilter === this.requestedWindow.rowFilter) {
            this.confirmed = true;
            this.metadata.set(data.metadata);
            this.rows.set(data.rows);
            this.window.set(data.window);
            this.status.set('ready');
            // Visibility uses ALL metadata, not the first fifty columns.
            this.columnOffset = 0;
            const indices = this.selectedIndices();
            if (indices.join() !== data.window.columnIndices.join()) this.page({ columnIndices: indices });
          } else if (data.kind === 'preview-page' && data.id === this.pageId && this.status() === 'ready' && this.paging()
            && data.window.rowFilter === this.requestedWindow.rowFilter) {
            this.rows.set(data.rows);
            this.window.set(data.window);
            this.paging.set(false);
          } else if (data.kind === 'preview-error' && (data.id === this.calculationId || data.id === this.pageId)) {
            this.fail(data.message);
          }
        };
        worker.onerror = () => {
          if (worker === this.worker) this.fail('No se pudo calcular la vista previa local. Los originales se conservan.');
        };
      } catch {
        this.fail('No se pudo iniciar la vista previa local. Los originales se conservan.');
        return;
      }
    }
    this.generation++;
    this.calculationId = this.nextId();
    this.pageId = 0;
    this.paging.set(false);
    this.error.set('');
    this.status.set('calculating');
    this.revision.update(value => value + 1);
    const window: PreviewWindow = { offset: 0, limit: this.window().limit, columnIndices: this.original.headers.map((_, i) => i).slice(0, 50), rowFilter: this.rowFilter() };
    this.requestedWindow = window;
    const token = { id: this.calculationId, session: this.session, generation: this.generation };
    const request: PreviewRequest = init
      ? { ...token, kind: 'preview-init', original: this.original, mapping: this.mapping, options: this.options, window }
      : { ...token, kind: 'preview-update', options: this.options, window };
    try { this.worker!.postMessage(request); }
    catch { this.fail('No se pudo enviar el cálculo al worker local. Los originales se conservan.'); }
  }
  private fail(message: string) {
    this.status.set('error');
    this.error.set(message);
    this.paging.set(false);
    this.revision.update(value => value + 1);
  }
  private selectedIndices() {
    return this.visibleColumns().slice(this.columnOffset, this.columnOffset + 50).map(column => column.columnIndex);
  }
  setHideEmpty(value: boolean) {
    this.hideEmpty.set(value);
    this.columnOffset = 0;
    this.page({ columnIndices: this.selectedIndices() });
  }
  moveColumns(direction: number) {
    this.columnOffset = Math.max(0, Math.min(this.columnOffset + direction * 50, Math.floor(Math.max(0, this.visibleColumns().length - 1) / 50) * 50));
    this.page({ columnIndices: this.selectedIndices() });
  }
  canMoveColumns(direction: number) {
    return direction < 0 ? this.columnOffset > 0 : this.columnOffset + 50 < this.visibleColumns().length;
  }
  setRowFilter(rowFilter: 'all' | 'changed') {
    if (this.status() !== 'ready' || rowFilter === this.rowFilter()) return;
    this.rowFilter.set(rowFilter);
    this.page({ rowFilter, offset: 0 });
  }
  page(change: Partial<PreviewWindow>) {
    if (this.status() !== 'ready' || !this.worker) return;
    const window = { ...this.requestedWindow, ...change };
    this.requestedWindow = window;
    this.pageId = this.nextId();
    this.paging.set(true);
    this.revision.update(value => value + 1);
    try { this.worker.postMessage({ kind: 'preview-page', id: this.pageId, session: this.session, generation: this.generation, window } satisfies PreviewRequest); }
    catch { this.fail('No se pudo cargar la ventana local. Los originales se conservan.'); }
  }
  destroy() { this.worker?.terminate(); this.worker = undefined; }
}
