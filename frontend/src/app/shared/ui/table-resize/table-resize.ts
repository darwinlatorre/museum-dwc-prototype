import { ComponentRef, Directive, ElementRef, OnDestroy, ViewContainerRef, effect, inject, input, untracked } from '@angular/core';
import { ColumnWidthControl, MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH, clampColumnWidth } from './column-width-control';

/** Techo del ajuste automático: una columna de texto largo no debe ocupar toda la hoja. */
export const AUTO_FIT_MAX_WIDTH = 480;
const MEASURED_ROWS = 60;
const MEASURE_RETRIES = 10;

interface RegisteredColumn {
  header: HTMLTableCellElement;
  key: string;
  initial: number;
  grow: boolean;
  control: ComponentRef<ColumnWidthControl>;
}

/**
 * One controller for native and projected PrimeNG tables. Each column keeps its own width:
 * explicit widths by key and optional content-sized defaults (measured once from visible text,
 * never by observing body mutations). Widths live only in this controller: no storage, API or Query.
 */
@Directive({ selector: '[museumResizableTable]', host: { class: 'museum-resizable-root' } })
export class ResizableTable implements OnDestroy {
  // Optional opaque view identity. Change only for a new dataset/collection, not a page/window.
  readonly resizeContext = input<unknown>(undefined);
  /** Size data columns (`growColumn`) from their widest visible text instead of equal defaults. */
  readonly resizeAutoFit = input(false);
  private readonly measured = new Map<string, number>();
  private measureFrame?: number;
  private measureAttempts = 0;
  private readonly columns = new Set<RegisteredColumn>();
  private readonly widths = new Map<string, number>();
  private group?: HTMLTableColElement;
  private table?: HTMLTableElement;
  private observer?: MutationObserver;
  private containerObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      this.resizeContext();
      untracked(() => {
        this.widths.clear();
        this.measured.clear();
        this.measureAttempts = 0;
        for (const column of this.columns) column.control.instance.cancelInteraction();
        this.layout();
      });
    });
  }
  register(column: RegisteredColumn) {
    this.columns.add(column);
    this.layout();
  }
  unregister(column: RegisteredColumn) {
    this.columns.delete(column);
    this.layout();
  }
  resize(column: RegisteredColumn, width?: number) {
    if (width === undefined) this.widths.delete(column.key);
    else this.widths.set(column.key, clampColumnWidth(width));
    this.layout();
  }
  /** Fit one column to its own content; without a measuring surface it restores the default. */
  fit(column: RegisteredColumn) {
    const width = this.measure(column);
    this.resize(column, width);
  }
  private context2d() {
    if (typeof OffscreenCanvas === 'undefined') return undefined;
    return new OffscreenCanvas(1, 1).getContext('2d') as OffscreenCanvasRenderingContext2D | null ?? undefined;
  }
  private measure(column: RegisteredColumn): number | undefined {
    const table = column.header.closest('table');
    const context = this.context2d();
    if (!table || !context) return undefined;
    const view = table.ownerDocument.defaultView;
    const widthOf = (element: Element, text: string) => {
      const style = view?.getComputedStyle(element);
      context.font = style ? `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}` : '14px sans-serif';
      return Math.max(0, ...text.split('\n').map(line => context.measureText(line.trim()).width));
    };
    const padding = (cell: Element) => {
      const style = view?.getComputedStyle(cell);
      return style ? (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0) : 16;
    };
    const label = [...column.header.childNodes]
      .filter(node => !(node instanceof Element && node.tagName === 'MUSEUM-COLUMN-WIDTH'))
      .map(node => node.textContent ?? '').join(' ').replace(/\s+/g, ' ');
    // Icono de orden, separación y asa de redimensionado.
    let widest = widthOf(column.header, label) + padding(column.header) + 44;
    let measuredRows = 0;
    for (const body of Array.from(table.tBodies)) {
      for (const row of Array.from(body.rows).slice(0, MEASURED_ROWS)) {
        const cell = row.cells[column.header.cellIndex];
        if (!cell) continue;
        const source = cell.querySelector('[data-fit-text]') ?? cell;
        widest = Math.max(widest, widthOf(source, source.textContent ?? '') + padding(cell) + 12);
        measuredRows++;
      }
    }
    if (!measuredRows) return undefined;
    return Math.min(AUTO_FIT_MAX_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.ceil(widest)));
  }
  /** Mide en el siguiente cuadro, cuando el cuerpo ya está pintado; reintenta si aún no hay filas. */
  private scheduleMeasure(columns: RegisteredColumn[]) {
    if (!this.resizeAutoFit() || this.measureFrame !== undefined || typeof requestAnimationFrame === 'undefined') return;
    const unmeasured = () => [...this.columns].filter(column => column.grow && !this.measured.has(column.key));
    if (!columns.some(column => column.grow && !this.measured.has(column.key)) || this.measureAttempts >= MEASURE_RETRIES) return;
    this.measureFrame = requestAnimationFrame(() => {
      this.measureFrame = undefined;
      this.measureAttempts++;
      // Columnas registradas después de programar el cuadro también se miden aquí.
      const pending = unmeasured();
      let changed = false;
      for (const column of pending) {
        const width = this.measure(column);
        if (width !== undefined) { this.measured.set(column.key, width); changed = true; }
      }
      if (changed) this.measureAttempts = 0;
      this.layout();
    });
  }
  private defaults(columns: RegisteredColumn[], available: number) {
    const widths = new Map(columns.map(column => [column.key, this.measured.get(column.key) ?? column.initial]));
    // Medidas de contenido: cada columna conserva su ancho propio, sin repartir el sobrante.
    if (this.resizeAutoFit() && columns.some(column => this.measured.has(column.key))) return widths;
    let extra = Math.max(0, available - columns.reduce((sum, column) => sum + widths.get(column.key)!, 0));
    let growing = columns.filter(column => column.grow);
    if (!growing.length) {
      const largest = Math.max(...columns.map(column => column.initial));
      growing = columns.filter(column => column.initial === largest);
    }
    while (extra > 0) {
      growing = growing.filter(column => widths.get(column.key)! < MAX_COLUMN_WIDTH);
      if (!growing.length) growing = columns.filter(column => widths.get(column.key)! < MAX_COLUMN_WIDTH);
      if (!growing.length) break;
      const share = Math.max(1, Math.floor(extra / growing.length));
      for (const column of growing) {
        const width = widths.get(column.key)!;
        const added = Math.min(share, extra, MAX_COLUMN_WIDTH - width);
        widths.set(column.key, width + added);
        extra -= added;
      }
    }
    return widths;
  }
  private layout() {
    const columns = [...this.columns].sort((a, b) => a.header.cellIndex - b.header.cellIndex);
    const table = columns[0]?.header.closest('table');
    if (!table) return;
    if (table !== this.table) {
      this.group?.remove();
      this.table = table;
      this.observer?.disconnect();
      // Watch leaf-header membership/order only, never body edits or style mutations.
      this.observer = new MutationObserver(() => this.layout());
      this.observer.observe(columns[0].header.parentElement!, { childList: true });
      this.containerObserver?.disconnect();
      if (typeof ResizeObserver !== 'undefined' && table.parentElement) {
        this.containerObserver = new ResizeObserver(() => this.layout());
        this.containerObserver.observe(table.parentElement);
      }
      table.classList.add('museum-resizable-table');
      this.group = table.ownerDocument.createElement('colgroup');
      table.insertBefore(this.group, table.firstChild);
    }
    const defaults = this.defaults(columns, table.parentElement?.clientWidth ?? 0);
    table.style.minWidth = '0';
    const cols = columns.map(column => {
      const width = this.widths.get(column.key) ?? defaults.get(column.key)!;
      column.control.setInput('width', width);
      // Inline header width also neutralizes legacy percentage widths in mapping.
      column.header.style.width = `${width}px`;
      const col = table.ownerDocument.createElement('col');
      col.style.width = `${width}px`;
      return col;
    });
    this.group!.replaceChildren(...cols);
    table.style.width = `${columns.reduce((total, column) => total + (this.widths.get(column.key) ?? defaults.get(column.key)!), 0)}px`;
    this.scheduleMeasure(columns);
  }
  ngOnDestroy() { if (this.measureFrame !== undefined) cancelAnimationFrame(this.measureFrame); this.observer?.disconnect(); this.containerObserver?.disconnect(); this.group?.remove(); this.columns.clear(); this.widths.clear(); }
}

/** Attach to every leaf header, including non-sortable physical-row/actions headers. */
@Directive({ selector: 'th[museumResizableColumn]', host: { class: 'museum-resizable-heading' } })
export class ResizableColumn implements OnDestroy {
  readonly museumResizableColumn = input.required<string>();
  readonly resizeLabel = input.required<string>();
  readonly initialColumnWidth = input(240);
  readonly growColumn = input(false);
  private readonly table = inject(ResizableTable);
  private readonly header = inject<ElementRef<HTMLTableCellElement>>(ElementRef).nativeElement;
  private readonly views = inject(ViewContainerRef);
  private column?: RegisteredColumn;

  constructor() {
    effect(onCleanup => {
      const key = this.museumResizableColumn();
      const label = this.resizeLabel();
      const initial = clampColumnWidth(this.initialColumnWidth());
      const grow = this.growColumn();
      const control = this.views.createComponent(ColumnWidthControl);
      control.setInput('label', label);
      control.setInput('width', initial);
      this.header.appendChild(control.location.nativeElement);
      const column = { header: this.header, key, initial, grow, control };
      this.column = column;
      control.instance.resized.subscribe(width => this.table.resize(column, width));
      control.instance.resetRequested.subscribe(() => this.table.resize(column));
      control.instance.fitRequested.subscribe(() => this.table.fit(column));
      this.table.register(column);
      onCleanup(() => {
        this.table.unregister(column);
        control.destroy();
        this.column = undefined;
      });
    });
  }
  ngOnDestroy() { if (this.column) this.table.unregister(this.column); }
}
