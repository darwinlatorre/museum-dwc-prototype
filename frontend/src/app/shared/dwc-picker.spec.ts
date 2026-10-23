import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DwcPicker } from './dwc-picker';

// Public contract shared by mapping and the signal-form rule editor.
describe('Selector de destino compartido', () => {
  beforeEach(() => vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false, media, addEventListener() {}, removeEventListener() {},
  })));
  afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); });

  it('conserva valores personalizados, limpieza y deshabilitación sin otro campo editable', async () => {
    const f = TestBed.createComponent(DwcPicker);
    f.componentRef.setInput('terms', [{ name: 'eventDate', uri: '', definition: '', category: '', status: 'recommended' }]);
    f.componentRef.setInput('value', 'customField');
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    const input = root.querySelector('input')!;
    const clear = root.querySelector('button')!;
    expect(input.value).toBe('customField');
    clear.click();
    await f.whenStable();
    expect(input.value).toBe('');
    expect(clear.disabled).toBe(true);
    input.value = 'customAgain';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await f.whenStable();
    expect(root.querySelectorAll('input')).toHaveLength(1);
    expect(document.querySelector('input[role=searchbox]')).toBeNull();
    f.componentRef.setInput('disabled', true);
    await f.whenStable();
    expect(input.disabled).toBe(true);
    expect(clear.disabled).toBe(true);
    clear.click();
    await f.whenStable();
    expect(input.value).toBe('customAgain');
  });
});
