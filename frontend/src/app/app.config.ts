import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { routes } from './app.routes';
const Museum = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#edf6f2',
      100: '#d3e8de',
      200: '#a9d0bd',
      300: '#7ab497',
      400: '#509578',
      500: '#30785c',
      600: '#235f48',
      700: '#194c3a',
      800: '#163e31',
      900: '#143329',
      950: '#0b211a',
    },
  },
});
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideTanStackQuery(
      new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
    ),
    providePrimeNG({ theme: { preset: Museum, options: { darkModeSelector: false } } }),
  ],
};
