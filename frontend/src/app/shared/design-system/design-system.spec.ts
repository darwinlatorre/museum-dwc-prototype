import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MuseumPreset } from './museum.preset';

// Misma entrada y alcance que la aplicación, incluidos los overlays desacoplados.
@Component({ template: '', styleUrl: '../../../styles.css', encapsulation: ViewEncapsulation.None })
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

  it('comparte cabeceras nativas/PrimeNG y distingue acciones sin otra paleta', () => {
    expect(css).toContain('.museum-data-table');
    const stickyActions = css.match(/\.collections-workspace th:last-child,\s*\.collections-workspace td:last-child\s*\{([^}]*)\}/)?.[1];
    expect(stickyActions).toBeTruthy();
    expect(stickyActions).not.toMatch(/border-(left|inline-start)\s*:/);
    expect(css).toMatch(/museum-table-actions[^{}]*\{[^}]*background:\s*var\(--museum-primary-50\)/s);
    expect(css).toMatch(/museum-sort-heading[^{}]*button[^{}]*\{[^}]*min-height:\s*44px/s);
  });

  it('sizes whole columns without defeating sticky positioning or legacy mapping minimums', () => {
    expect(css).toMatch(/museum-resizable-root table\.museum-resizable-table\s*\{[^}]*table-layout:\s*fixed;[^}]*min-width:\s*0;/s);
    expect(css).toMatch(/museum-resizable-root \.p-datatable-table-container\s*\{[^}]*overflow:\s*auto/s);
    expect(css).toMatch(/museum-resize-handle\s*\{[^}]*min-height:\s*44px;[^}]*touch-action:\s*none/s);
    expect(css).toMatch(/museum-column-width\[hidden\]\s*\{[^}]*display:\s*none/s);
    const resizeRules = css.slice(css.indexOf('table.museum-resizable-root'), css.indexOf(".museum-sort-heading[aria-sort="));
    expect(resizeRules).not.toContain('!important');
    expect(resizeRules).not.toContain('position: relative');
    expect(css).toMatch(/\.mapping-table \.p-datatable-table\s*\{[^}]*min-width:\s*52rem/s);
  });

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
    expect(css).toMatch(/\.mapping-table[^{}]*source-header\s*\{[^}]*border-bottom:\s*1px solid[^}]*background:\s*var\(--museum-surface\) !important/s);
    expect(css).toMatch(/\.p-datatable \.source-header\s*\{[^}]*border-inline-end:\s*1px solid var\(--museum-line\)/);
    expect(css).toMatch(/focus-within[^{}]*source-header\s*\{[^}]*background:\s*var\(--museum-surface-selected\) !important/);
    expect(css).toMatch(/button:focus-visible[^{}]*\{[^}]*outline:\s*2px solid var\(--pine\)/);
    expect(css).not.toContain('#b07918');
  });

  it('usa tokens para cada color y neutros verdosos también en PrimeNG', () => {
    const rules = css.replace(/:root\s*\{[^}]*\}/g, '').replace(/url\("data:[^)]*\)/g, '');
    expect(rules.match(/#[0-9a-f]{3,8}\b/gi) ?? []).toEqual([]);
    expect(MuseumPreset).toMatchObject({ semantic: { colorScheme: { light: {
      surface: { 0: '#ffffff', 200: 'var(--museum-neutral-200)' },
      primary: { color: '{primary.700}', hoverColor: '{primary.800}' },
    } } } });
    expect(css).toMatch(/\.button-primary\s*\{[^}]*background:\s*var\(--pine\)/);
  });

  it('marca mensajes y estados con borde completo, nunca con una franja lateral', () => {
    expect(css).not.toMatch(/border-left:\s*[2-9]px/);
    expect(css).not.toMatch(/inset [2-9]px 0/);
    expect(css).toMatch(/\.sr-only\s*\{[^}]*clip-path:\s*inset\(50%\)/);
  });

  it('conserva tamaño estable de sincronización y reducción global de movimiento', () => {
    expect(css).toMatch(/\.catalog-sync-button\s*\{[^}]*width:\s*17rem;[^}]*height:\s*var\(--select-control-height\)/);
    expect(css).toMatch(/\.sync-indicator\s*\{[^}]*width:\s*1.2rem;[^}]*height:\s*1.2rem/);
    expect(css).toMatch(/\.catalog-sync-button:disabled\s*\{[^}]*opacity:\s*1;[^}]*cursor:\s*progress/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce[^]*animation:\s*none !important/);
  });

  it('incluye especializaciones móviles y una sola regla base de cada overlay', () => {
    expect(css).toMatch(/max-width:\s*800px/);
    // Distribución móvil en Tailwind: mismo corte inclusivo de 800px que el CSS nativo.
    expect(css).toMatch(/@media\s*\(width\s*<\s*801px\)\s*\{[^]*?\.max-tablet\\:flex-col\s*\{\s*flex-direction:\s*column/);
    expect(css).toMatch(/\.context-grid\s*\{\s*grid-template-columns:\s*1fr/);
    expect(css.match(/\.p-select-overlay\s*\{/g)).toHaveLength(1);
    expect(css.match(/\.p-select-option\s*\{/g)).toHaveLength(2); // base y panel DwC
  });

  it('ordena capas y genera utilidades Tailwind desde los tokens del museo', () => {
    expect(css).toMatch(/@layer theme,\s*base,\s*primeng,\s*components,\s*utilities;/);
    expect(css).toMatch(/\.gap-4\s*\{\s*gap:\s*calc\(var\(--museum-space-1\)\s*\*\s*4\)/);
    expect(css).not.toMatch(/--color-(red|blue|slate)-500/);
  });
});
