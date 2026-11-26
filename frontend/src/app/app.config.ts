import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, RedirectCommand, Router, withNavigationErrorHandler } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { providePrimeNG } from 'primeng/config';
import { MuseumPreset } from './shared/design-system/museum.preset';
import { routes } from './app.routes';
import { spanish } from './core/i18n/localization';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withNavigationErrorHandler(() => {
      // Muestra la pantalla de error sin perder la URL pedida, para que Reintentar la vuelva a cargar.
      const router = inject(Router);
      return new RedirectCommand(router.parseUrl('/error'), { skipLocationChange: true });
    })),
    provideTanStackQuery(
      new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }),
    ),
    providePrimeNG({
      translation: spanish,
      theme: {
        preset: MuseumPreset,
        // Mismo orden que src/styles.css: el museo (components) y Tailwind (utilities) ganan a PrimeNG.
        options: { darkModeSelector: false, cssLayer: { name: 'primeng', order: 'theme, base, primeng, components, utilities' } },
      },
    }),
  ],
};
