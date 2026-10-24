import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/** La escala vive en _tokens.scss; no duplicar colores en TypeScript. */
export const MuseumPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: 'var(--museum-primary-50)',
      100: 'var(--museum-primary-100)',
      200: 'var(--museum-primary-200)',
      300: 'var(--museum-primary-300)',
      400: 'var(--museum-primary-400)',
      500: 'var(--museum-primary-500)',
      600: 'var(--museum-primary-600)',
      700: 'var(--museum-primary-700)',
      800: 'var(--museum-primary-800)',
      900: 'var(--museum-primary-900)',
      950: 'var(--museum-primary-950)',
    },
  },
});
