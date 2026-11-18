import { ComponentRef, Directive, ElementRef, OnDestroy, ViewContainerRef, effect, inject, input } from '@angular/core';
import { ColumnWidthControl, clampColumnWidth } from './column-width-control';

interface RegisteredColumn {
  header: HTMLTableCellElement;
  key: string;
  initial: number;
  control: ComponentRef<ColumnWidthControl>;
}

/** One controller for native and projected PrimeNG tables; never observes body cells. */
@Directive({ selector: '[museumResizableTable]', host: { class: 'museum-resizable-root' } })
export class ResizableTable implements OnDestroy {
  // Optional opaque view identity. Change only for a new dataset/collection, not a page/window.
  readonly resizeContext = input<unknown>(undefined);
  private readonly columns = new Set<RegisteredColumn>();
  private readonly widths = new Map<string, number>();
  private group?: HTMLTableColElement;
  private table?: HTMLTableElement;
  private observer?: MutationObserver;

  constructor() {
    effect(() => {
      this.resizeContext();
      this.widths.clear();
      for (const column of this.columns) column.control.instance.cancelInteraction();
      this.layout();
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
      table.classList.add('museum-resizable-table');
      this.group = table.ownerDocument.createElement('colgroup');
      table.insertBefore(this.group, table.firstChild);
    }
    const cols = columns.map(column => {
      const width = this.widths.get(column.key) ?? column.initial;
      column.control.setInput('width', width);
      // Inline header width also neutralizes legacy percentage widths in mapping.
      column.header.style.width = `${width}px`;
      const col = table.ownerDocument.createElement('col');
      col.style.width = `${width}px`;
      return col;
    });
    this.group!.replaceChildren(...cols);
    table.style.width = `${columns.reduce((total, column) => total + (this.widths.get(column.key) ?? column.initial), 0)}px`;
  }
  ngOnDestroy() { this.observer?.disconnect(); this.group?.remove(); this.columns.clear(); this.widths.clear(); }
}

/** Attach to every leaf header, including non-sortable physical-row/actions headers. */
@Directive({ selector: 'th[museumResizableColumn]', host: { class: 'museum-resizable-heading' } })
export class ResizableColumn implements OnDestroy {
  readonly museumResizableColumn = input.required<string>();
  readonly resizeLabel = input.required<string>();
  readonly initialColumnWidth = input(240);
  private readonly table = inject(ResizableTable);
  private readonly header = inject<ElementRef<HTMLTableCellElement>>(ElementRef).nativeElement;
  private readonly views = inject(ViewContainerRef);
  private column?: RegisteredColumn;

  constructor() {
    effect(onCleanup => {
      const key = this.museumResizableColumn();
      const label = this.resizeLabel();
      const initial = clampColumnWidth(this.initialColumnWidth());
      const control = this.views.createComponent(ColumnWidthControl);
      control.setInput('label', label);
      control.setInput('width', initial);
      this.header.appendChild(control.location.nativeElement);
      const column = { header: this.header, key, initial, control };
      this.column = column;
      control.instance.resized.subscribe(width => this.table.resize(column, width));
      control.instance.resetRequested.subscribe(() => this.table.resize(column));
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
