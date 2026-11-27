import { definePreset } from '@primeuix/themes';
import base from '@primeuix/themes/aura/base';
import auraCss from '@primeuix/themes/aura/css';
import type { ExtendedCSS } from '@primeuix/themes/types';
import datatable from '@primeuix/themes/aura/datatable';
import paginator from '@primeuix/themes/aura/paginator';
import select from '@primeuix/themes/aura/select';

/**
 * Aura reducido a los componentes PrimeNG que usa la app (p-table con su paginador y p-select).
 * `@primeuix/themes/aura` arrastra los tokens de ~93 componentes (~100 kB en main).
 * Al incorporar otro componente PrimeNG, añadir aquí su export `@primeuix/themes/aura/<componente>`.
 */
// aura/css se publica como export por defecto (string) aunque su .d.ts declare un export nombrado.
const css = auraCss as unknown as ExtendedCSS;
const Aura = { ...base, components: { datatable, paginator, select }, css };

const scale = (name: 'primary' | 'neutral') => Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => [shade, `var(--museum-${name}-${shade})`]),
);

/** Las escalas viven en tokens.css; no duplicar colores en TypeScript. */
export const MuseumPreset = definePreset(Aura, {
  semantic: {
    primary: scale('primary'),
    colorScheme: {
      light: {
        // Aura usa slate y primary.500; el museo usa neutros verdosos y pino (700) como acción.
        surface: { 0: '#ffffff', ...scale('neutral') },
        primary: { color: '{primary.700}', contrastColor: '#ffffff', hoverColor: '{primary.800}', activeColor: '{primary.900}' },
        highlight: { background: '{primary.50}', focusBackground: '{primary.100}', color: '{primary.700}', focusColor: '{primary.800}' },
      },
    },
  },
});
