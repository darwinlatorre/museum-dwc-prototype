import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { providePrimeNG } from 'primeng/config';
import { MuseumPreset } from './shared/design-system/museum.preset';
import { routes } from './app.routes';
import { spanish } from './core/i18n/localization';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideTanStackQuery(
      new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
    ),
    providePrimeNG({
      translation: spanish,
      theme: { preset: MuseumPreset, options: { darkModeSelector: false } },
    }),
  ],
};
