import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ResizableColumn, ResizableTable } from './table-resize';
import { TableHeader } from '../table-header/table-header';

@Component({
  imports: [ResizableTable, ResizableColumn, TableHeader],
  template: `
    @if (mounted()) {
      <div><table museumResizableTable [resizeContext]="context()"><thead><tr>
        <th museumResizableColumn="row" resizeLabel="Fila" [initialColumnWidth]="128">Fila</th>
        @for (key of keys(); track key) {
          <th [museumResizableColumn]="key" [resizeLabel]="key" [initialColumnWidth]="240"
            museumSortHeader [label]="key" (sortRequested)="sorts = sorts + 1"></th>
        }
        <th museumResizableColumn="actions" resizeLabel="Acciones">Acciones</th>
      </tr></thead><tbody><tr><td>2</td><td> 001 a </td><td>valor</td><td>Editar</td></tr></tbody></table></div>
    }
    <table museumResizableTable><thead><tr><th museumResizableColumn="a" resizeLabel="Otra">Otra</th></tr></thead></table>
  `,
})
class Host {
  readonly keys = signal(['a', 'b']);
  readonly mounted = signal(true);
  readonly context = signal(1);
  sorts = 0;
}

describe('Shared table column resizing', () => {
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const handles = () => [...root.querySelectorAll<HTMLButtonElement>('.museum-resize-handle')];
    const widths = () => [...root.querySelectorAll<HTMLTableColElement>('table:first-child col')].map(col => col.style.width);
    return { fixture, root, handles, widths };
  }
  function pointer(target: EventTarget, type: string, x: number, id = 1, pointerType = 'mouse') {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, { clientX: x, pointerId: id, pointerType, isPrimary: true, button: 0 });
    target.dispatchEvent(event);
  }

  it('uses the separator as an empty accessible resize target without a visible arrow', async () => {
    const { handles } = await setup();
    for (const handle of handles()) {
      expect(handle.textContent?.trim()).toBe('');
      expect(handle.getAttribute('aria-label')).toMatch(/^Ancho de /);
      expect(handle.getAttribute('role')).toBe('slider');
    }
  });
  it('fills the available table width initially while explicit resizing keeps exact pixels', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.firstElementChild?.tagName === 'TABLE' ? 1200 : 0;
    });
    const p = await setup();
    const table = p.root.querySelector<HTMLTableElement>('table')!;
    expect(table.style.width).toBe('1200px');
    const initial = Number(p.handles()[1].getAttribute('aria-valuenow'));
    p.handles()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await p.fixture.whenStable();
    expect(p.widths()[1]).toBe(`${initial + 16}px`);
    expect(table.style.width).toBe('1216px');
  });
  it('closes stale numeric drafts when a new view context arrives', async () => {
    const p = await setup();
    p.handles()[1].click(); await p.fixture.whenStable();
    const panel = p.root.querySelector<HTMLElement>('.museum-column-width:not([hidden])')!;
    expect(panel).not.toBeNull();
    p.fixture.componentInstance.context.set(2); await p.fixture.whenStable();
    expect(panel.hidden).toBe(true);
    expect(p.widths()[1]).toBe('240px');
  });
  it('offers non-sortable row/actions widths, bounded keyboard pixels and preserves sort button', async () => {
    const { fixture, root, handles, widths } = await setup();
    handles()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    handles()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    handles()[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(widths().slice(0, 4)).toEqual(['144px', '960px', '240px', '96px']);
    expect(handles()[0].getAttribute('aria-valuenow')).toBe('144');
    expect(handles()[0].getAttribute('aria-valuetext')).toBe('144 píxeles');
    expect(fixture.componentInstance.sorts).toBe(0);
    root.querySelector<HTMLButtonElement>('[aria-label="Ordenar por a"]')!.click();
    expect(fixture.componentInstance.sorts).toBe(1);
    expect(root.querySelector('tbody')?.textContent).toContain(' 001 a ');
  });

  it('provides click-only numeric choice, reset and Escape focus return without sorting', async () => {
    const { fixture, root, handles, widths } = await setup();
    handles()[1].click();
    await fixture.whenStable();
    const panel = handles()[1].parentElement!.querySelector<HTMLElement>('.museum-column-width')!;
    const input = panel.querySelector('input')!;
    expect(panel.hidden).toBe(false);
    expect(document.activeElement).toBe(input);
    input.value = '400';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    panel.querySelector<HTMLButtonElement>('.museum-width-apply')!.click();
    await fixture.whenStable();
    expect(widths()[1]).toBe('400px');
    expect(document.activeElement).toBe(handles()[1]);
    handles()[1].click();
    await fixture.whenStable();
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(handles()[1]);
    handles()[1].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await fixture.whenStable();
    expect(widths()[1]).toBe('240px');
    expect(fixture.componentInstance.sorts).toBe(0);
    expect(root.querySelector<HTMLTableElement>('table')!.style.width).toBe('848px');
  });

  it.each(['mouse', 'touch'])('drags %s with whole-column layout and cancels only the active pointer', async pointerType => {
    const { fixture, handles, widths } = await setup();
    pointer(handles()[1], 'pointerdown', 100, 1, pointerType);
    pointer(document, 'pointermove', 160, 2, pointerType);
    expect(widths()[1]).toBe('240px');
    pointer(document, 'pointermove', 160, 1, pointerType);
    await fixture.whenStable();
    expect(widths()[1]).toBe('300px');
    pointer(document, 'pointercancel', 160, 1, pointerType);
    await fixture.whenStable();
    expect(widths()[1]).toBe('240px');
    pointer(document, 'pointermove', 800, 1, pointerType);
    expect(widths()[1]).toBe('240px');
    expect(fixture.componentInstance.sorts).toBe(0);
  });

  it('ignores post-drag click and double-click resets without sorting', async () => {
    const { fixture, handles, widths } = await setup();
    pointer(handles()[1], 'pointerdown', 100);
    pointer(document, 'pointermove', 5000);
    pointer(document, 'pointerup', 5000);
    handles()[1].click();
    await fixture.whenStable();
    expect(handles()[1].getAttribute('aria-expanded')).toBe('false');
    expect(widths()[1]).toBe('960px');
    handles()[1].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await fixture.whenStable();
    expect(widths()[1]).toBe('240px');
    expect(fixture.componentInstance.sorts).toBe(0);
  });

  it('retains keyed widths through conditional windows and reordering; context resets and tables stay isolated', async () => {
    const { fixture, root, handles, widths } = await setup();
    handles()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    fixture.componentInstance.keys.set(['b']);
    await fixture.whenStable();
    fixture.componentInstance.keys.set(['b', 'a']);
    await fixture.whenStable();
    expect(widths().slice(0, 4)).toEqual(['128px', '240px', '256px', '240px']);
    fixture.componentInstance.keys.set(['a', 'b']);
    await fixture.whenStable();
    expect(widths()[1]).toBe('256px');
    expect(root.querySelectorAll<HTMLTableElement>('table')[1].style.width).toBe('240px');
    fixture.componentInstance.context.set(2);
    await fixture.whenStable();
    expect(widths()[1]).toBe('240px');
  });

  it('removes gesture listeners when a conditional header unmounts', async () => {
    const { fixture, handles } = await setup();
    const remove = vi.spyOn(document, 'removeEventListener');
    pointer(handles()[1], 'pointerdown', 100);
    fixture.componentInstance.keys.set(['b']);
    await fixture.whenStable();
    for (const type of ['pointermove', 'pointerup', 'pointercancel']) {
      expect(remove.mock.calls.some(call => call[0] === type)).toBe(true);
    }
    pointer(document, 'pointermove', 500);
    fixture.destroy();
  });

  it('stops a stale drag on dataset change and does not observe body text edits', async () => {
    const { fixture, root, handles, widths } = await setup();
    pointer(handles()[1], 'pointerdown', 100);
    pointer(document, 'pointermove', 160);
    await fixture.whenStable();
    expect(widths()[1]).toBe('300px');
    fixture.componentInstance.context.set(2);
    await fixture.whenStable();
    pointer(document, 'pointermove', 800);
    expect(widths()[1]).toBe('240px');
    const col = root.querySelector('col');
    root.querySelector('tbody td')!.textContent = ' body keystroke ';
    await fixture.whenStable();
    await Promise.resolve();
    expect(root.querySelector('col')).toBe(col);
  });

  it('rejects empty numeric choices and clamps click-only out-of-range values', async () => {
    const { fixture, handles, widths } = await setup();
    handles()[1].click();
    await fixture.whenStable();
    const panel = handles()[1].parentElement!.querySelector<HTMLElement>('.museum-column-width')!;
    const input = panel.querySelector('input')!;
    const apply = panel.querySelector<HTMLButtonElement>('.museum-width-apply')!;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    apply.click();
    await fixture.whenStable();
    expect(widths()[1]).toBe('240px');
    expect(panel.hidden).toBe(false);
    input.value = '1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    apply.click();
    await fixture.whenStable();
    expect(widths()[1]).toBe('96px');
  });

});

@Component({
  imports: [ResizableTable, ResizableColumn],
  template: `
    @if (mounted()) {
      <div><table museumResizableTable [resizeContext]="context()" [resizeAutoFit]="true"><thead><tr>
        <th museumResizableColumn="row" resizeLabel="Fila" [initialColumnWidth]="128">Fila</th>
        <th museumResizableColumn="short" resizeLabel="type" [initialColumnWidth]="192" [growColumn]="true">type</th>
        <th museumResizableColumn="long" resizeLabel="occurrenceID" [initialColumnWidth]="192" [growColumn]="true">occurrenceID</th>
      </tr></thead><tbody>
        <tr><td>2</td><td><span data-fit-text>Obj</span><span class="copy">Obj</span></td><td><span data-fit-text>UNICAUCA-ENT-EN028-000123</span></td></tr>
        <tr><td>3</td><td><span data-fit-text>PhysicalObject</span></td><td><span data-fit-text>A</span></td></tr>
      </tbody></table></div>
    }
  `,
})
class FitHost {
  readonly mounted = signal(true);
  readonly context = signal<string>('c1');
}

describe('Independent content-sized columns', () => {
  // 7px per character keeps measurement deterministic without a canvas implementation.
  class FakeCanvas { getContext() { return { font: '', measureText: (text: string) => ({ width: text.length * 7 }) }; } }
  beforeEach(() => { localStorage.clear(); vi.stubGlobal('OffscreenCanvas', FakeCanvas); });
  afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); localStorage.clear(); });
  const frame = () => new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
  async function setup() {
    const fixture = TestBed.createComponent(FitHost);
    await fixture.whenStable(); await frame(); await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const widths = () => [...root.querySelectorAll<HTMLTableColElement>('col')].map(col => parseInt(col.style.width, 10));
    const handles = () => [...root.querySelectorAll<HTMLButtonElement>('.museum-resize-handle')];
    return { fixture, root, widths, handles };
  }

  it('sizes every data column from its own widest visible text, leaving fixed columns alone', async () => {
    const { widths } = await setup();
    const [row, short, long] = widths();
    expect(row).toBe(128);
    expect(short).toBeLessThan(long);
    // Longest value "UNICAUCA-ENT-EN028-000123" (25 chars) drives its column; hidden copies are ignored.
    expect(long).toBeGreaterThanOrEqual(25 * 7);
    expect(short).toBeGreaterThanOrEqual('PhysicalObject'.length * 7);
    expect(short).toBeLessThan(25 * 7);
  });

  it('double-click fits only that column to its content', async () => {
    const { fixture, widths, handles } = await setup();
    const before = widths();
    handles()[2].focus();
    for (let i = 0; i < 5; i++) handles()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(widths()[2]).toBe(before[2] + 80);
    handles()[2].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await fixture.whenStable();
    expect(widths()).toEqual(before);
  });

  it('keeps widths only in memory: a new context measures again and nothing is stored', async () => {
    const { fixture, widths, handles } = await setup();
    handles()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await fixture.whenStable();
    expect(widths()[1]).toBe(960);
    fixture.componentInstance.context.set('c2'); await fixture.whenStable(); await frame(); await fixture.whenStable();
    expect(widths()[1]).toBeLessThan(960);
    expect(localStorage.length).toBe(0);
  });
});
