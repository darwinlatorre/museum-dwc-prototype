import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MuseumPreset } from './museum.preset';

// Misma entrada y alcance que la aplicación, incluidos los overlays desacoplados.
@Component({ template: '', styleUrl: '../../../styles.scss', encapsulation: ViewEncapsulation.None })
class DesignSystemStyles {}

describe('Sistema de diseño del museo', () => {
  let css: string;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(DesignSystemStyles);
    await fixture.whenStable();
    // Aislar una copia compilada: el runner también puede cargar estilos globales.
    css = [...document.querySelectorAll('style')]
      .map(style => style.textContent ?? '')
      .find(text => text.includes('--museum-primary-950:')) ?? '';
  });
  afterEach(() => TestBed.resetTestingModule());

  it('conecta toda la escala primaria del preset con la única paleta CSS', () => {
    const primary = {
      50: 'var(--museum-primary-50)', 100: 'var(--museum-primary-100)',
      200: 'var(--museum-primary-200)', 300: 'var(--museum-primary-300)',
      400: 'var(--museum-primary-400)', 500: 'var(--museum-primary-500)',
      600: 'var(--museum-primary-600)', 700: 'var(--museum-primary-700)',
      800: 'var(--museum-primary-800)', 900: 'var(--museum-primary-900)',
      950: 'var(--museum-primary-950)',
    };
    expect(MuseumPreset).toMatchObject({ semantic: { primary } });
    for (const shade of Object.keys(primary)) {
      expect(css.match(new RegExp(`--museum-primary-${shade}:`, 'g'))).toHaveLength(1);
    }
    expect(css).toMatch(/--museum-primary-600:\s*#235f48/);
    expect(css).toMatch(/--museum-primary-700:\s*#194c3a/);
    expect(css).toMatch(/--pine:\s*var\(--museum-primary-700\)/);
    expect(css).toMatch(/--mapping-control-height:\s*var\(--select-control-height\)/);
  });

  it('conserva los contratos de controles, paginadores y overlays globales', () => {
    expect(css).toMatch(/select,\s*\.p-select,\s*\.p-select\.p-component\s*\{[^}]*height:\s*var\(--select-control-height\)/);
    expect(css).toMatch(/select:disabled,\s*\.p-select\.p-disabled\s*\{[^}]*cursor:\s*not-allowed/);
    expect(css).toMatch(/\.p-paginator \.p-select\s*\{[^}]*min-width:\s*5rem/);
    expect(css).toMatch(/\.p-select-overlay\s*\{[^}]*max-width:\s*calc\(100vw - 2rem\)/);
    expect(css).toMatch(/\.dwc-picker \.p-select-label\s*\{[^}]*box-shadow:\s*none !important/);
  });

  it('mantiene selección sólida, filas uniformes y foco verde sin ámbar', () => {
    expect(css).toMatch(/aria-pressed=["']?true["']?\]:hover\s*\{[^}]*background:\s*var\(--pine\);[^}]*color:\s*white;[^}]*box-shadow:\s*none/s);
    expect(css).toMatch(/\.mapping-table[^{}]*source-header\s*\{[^}]*border-bottom:\s*1px solid[^}]*background:\s*#fff !important/s);
    expect(css).toMatch(/\.p-datatable \.source-header\s*\{[^}]*border-left:\s*1px solid var\(--pine\)/);
    expect(css).toMatch(/focus-within[^{}]*source-header\s*\{[^}]*background:\s*#e2eee6 !important/);
    expect(css).toMatch(/button:focus-visible[^{}]*\{[^}]*outline:\s*2px solid var\(--pine\)/);
    expect(css).not.toContain('#b07918');
  });

  it('conserva tamaño estable de sincronización y reducción global de movimiento', () => {
    expect(css).toMatch(/\.catalog-sync-button\s*\{[^}]*width:\s*17rem;[^}]*height:\s*var\(--select-control-height\)/);
    expect(css).toMatch(/\.sync-indicator\s*\{[^}]*width:\s*1.2rem;[^}]*height:\s*1.2rem/);
    expect(css).toMatch(/\.catalog-sync-button:disabled\s*\{[^}]*opacity:\s*1;[^}]*cursor:\s*progress/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce[^]*animation:\s*none !important/);
  });

  it('incluye especializaciones móviles y una sola regla base de cada overlay', () => {
    expect(css).toMatch(/max-width:\s*800px/);
    expect(css).toMatch(/\.rule-grid\s*\{\s*grid-template-columns:\s*1fr/);
    expect(css).toMatch(/\.context-grid\s*\{\s*grid-template-columns:\s*1fr/);
    expect(css.match(/\.p-select-overlay\s*\{/g)).toHaveLength(1);
    expect(css.match(/\.p-select-option\s*\{/g)).toHaveLength(2); // base y panel DwC
  });
});
