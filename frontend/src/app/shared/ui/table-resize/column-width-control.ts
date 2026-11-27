import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';

export const MIN_COLUMN_WIDTH = 96;
export const MAX_COLUMN_WIDTH = 960;
export const clampColumnWidth = (width: number) => Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.round(width)));

/** Presentation only. Pointer listeners exist only for the lifetime of one gesture. */
@Component({
  selector: 'museum-column-width',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(click)': '$event.stopPropagation()',
    '(dblclick)': '$event.stopPropagation()',
    '(keydown)': '$event.stopPropagation()',
  },
  template: `
    <button #handle type="button" class="museum-resize-handle" role="slider"
      [attr.aria-label]="'Ancho de ' + label()" aria-orientation="horizontal"
      [attr.aria-valuemin]="minimum" [attr.aria-valuemax]="maximum"
      [attr.aria-valuenow]="width()" [attr.aria-valuetext]="width() + ' píxeles'"
      [attr.aria-expanded]="opened()" title="Ajustar ancho: arrastrar, usar flechas, doble clic para ajustar al contenido o abrir opciones"
      (pointerdown)="start($event)" (click)="toggle()" (dblclick)="fit()" (keydown)="key($event)"></button>
    <div #panel class="museum-column-width" [attr.popover]="nativePopover ? 'auto' : null"
      [hidden]="!opened()" (keydown.escape)="close()" (toggle)="popoverToggle($event)">
      <label>Ancho de {{ label() }} (píxeles)
        <input type="number" [min]="minimum" [max]="maximum" [value]="draft()"
          (input)="draft.set($any($event.target).value)" (keydown.enter)="apply()" />
      </label>
      <div class="museum-width-actions">
        <button type="button" class="museum-width-apply" (click)="apply()">Aplicar ancho</button>
        <button type="button" (click)="restore()">Restablecer ancho</button>
        <button type="button" (click)="close()">Cerrar</button>
      </div>
    </div>
  `,
})
export class ColumnWidthControl {
  readonly label = input.required<string>();
  readonly width = input.required<number>();
  readonly resized = output<number>();
  readonly resetRequested = output<void>();
  /** Doble clic: ajustar la columna a su contenido (si no se puede medir, vuelve al ancho por defecto). */
  readonly fitRequested = output<void>();
  readonly minimum = MIN_COLUMN_WIDTH;
  readonly maximum = MAX_COLUMN_WIDTH;
  readonly opened = signal(false);
  readonly draft = signal('');
  readonly handle = viewChild.required<ElementRef<HTMLButtonElement>>('handle');
  readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  readonly nativePopover = typeof HTMLElement.prototype.showPopover === 'function';
  private stopGesture?: () => void;
  private suppressClick = false;
  private clickTimer?: ReturnType<typeof setTimeout>;

  constructor() { inject(DestroyRef).onDestroy(() => this.cancelInteraction()); }

  cancelInteraction() {
    this.stopGesture?.();
    clearTimeout(this.clickTimer);
    this.suppressClick = false;
    if (this.opened()) {
      this.opened.set(false);
      if (this.nativePopover) this.panel().nativeElement.hidePopover();
    }
  }

  toggle() {
    if (this.suppressClick) { this.suppressClick = false; return; }
    if (this.opened()) { this.close(); return; }
    this.draft.set(String(this.width()));
    this.opened.set(true);
    const panel = this.panel().nativeElement;
    panel.hidden = false;
    if (this.nativePopover) panel.showPopover();
    panel.querySelector('input')?.focus({ preventScroll: true });
  }
  close() {
    this.opened.set(false);
    if (this.nativePopover) this.panel().nativeElement.hidePopover();
    this.handle().nativeElement.focus({ preventScroll: true });
  }
  popoverToggle(event: Event) {
    if ((event as ToggleEvent).newState === 'closed') this.opened.set(false);
  }
  apply() {
    const value = Number(this.draft());
    if (!this.draft().trim() || !Number.isFinite(value)) return;
    this.resized.emit(clampColumnWidth(value));
    this.close();
  }
  restore() { this.resetRequested.emit(); this.close(); }
  fit() {
    this.fitRequested.emit();
    if (this.opened()) this.close();
  }
  key(event: KeyboardEvent) {
    const width = event.key === 'ArrowLeft' ? this.width() - 16
      : event.key === 'ArrowRight' ? this.width() + 16
      : event.key === 'Home' ? this.minimum : event.key === 'End' ? this.maximum : null;
    if (width !== null) { event.preventDefault(); this.resized.emit(clampColumnWidth(width)); }
    if (event.key === 'Escape') { event.preventDefault(); this.close(); }
  }
  start(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0 || this.stopGesture) return;
    event.preventDefault();
    this.handle().nativeElement.focus({ preventScroll: true });
    const startX = event.clientX;
    const original = this.width();
    const document = this.handle().nativeElement.ownerDocument;
    let moved = false;
    const move = (next: PointerEvent) => {
      if (next.pointerId !== event.pointerId) return;
      moved ||= Math.abs(next.clientX - startX) > 2;
      if (moved) this.resized.emit(clampColumnWidth(original + next.clientX - startX));
    };
    const finish = (next: PointerEvent) => {
      if (next.pointerId !== event.pointerId) return;
      this.suppressClick = moved && next.type !== 'pointercancel';
      // The synthesized click follows pointerup in this turn; do not swallow a later deliberate click.
      clearTimeout(this.clickTimer);
      this.clickTimer = setTimeout(() => { this.suppressClick = false; }, 0);
      if (next.type === 'pointercancel') this.resized.emit(original);
      this.stopGesture?.();
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', finish);
    document.addEventListener('pointercancel', finish);
    this.stopGesture = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', finish);
      document.removeEventListener('pointercancel', finish);
      this.stopGesture = undefined;
    };
  }
}
