/**
 * Application configuration for bootstrapping Angular.
 * Configures providers, services, and global settings.
 */

import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';

// Material & CDK
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// NgRx
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';

// Apollo GraphQL
import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Translations
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

// Toastr
import { ToastrModule } from 'ngx-toastr';

// Routes
import { routes } from './app.routes';

// Store
import { reducers, metaReducers } from './store';
import { effects } from './store/effects';

// Interceptors
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loaderInterceptor } from './core/interceptors/loader.interceptor';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';

// Environment
import { environment } from '../environments/environment';

/**
 * Factory function for TranslateLoader
 */
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

/**
 * Apollo GraphQL factory
 */
export function createApollo(httpLink: HttpLink): any {
  // Auth link to add token to requests
  const auth = setContext((operation, context) => {
    const token = localStorage.getItem(environment.auth.tokenKey);
    
    if (!token) {
      return {};
    }
    
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  });
  
  // Error link for handling GraphQL errors
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.error(
          `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
      });
    }
    
    if (networkError) {
      console.error(`Network error: ${networkError}`);
    }
  });
  
  // Create Apollo link chain
  const link = ApolloLink.from([
    errorLink,
    auth,
    httpLink.create({ uri: environment.graphqlUrl })
  ]);
  
  // Create cache with type policies
  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          projects: {
            merge(existing = [], incoming: any[]) {
              return incoming;
            }
          },
          tasks: {
            merge(existing = [], incoming: any[]) {
              return incoming;
            }
          }
        }
      },
      Project: {
        keyFields: ['id']
      },
      Task: {
        keyFields: ['id']
      },
      User: {
        keyFields: ['id']
      }
    }
  });
  
  return {
    link,
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all'
      },
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all'
      },
      mutate: {
        errorPolicy: 'all'
      }
    }
  };
}

/**
 * Application configuration
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Router
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      })
    ),
    
    // HTTP Client with interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([
        authInterceptor,
        errorInterceptor,
        loaderInterceptor,
        cacheInterceptor
      ])
    ),
    
    // Animations
    provideAnimations(),
    provideAnimationsAsync(),
    
    // NgRx Store
    provideStore(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictActionTypeUniqueness: true
      }
    }),
    
    // NgRx Effects
    provideEffects(effects),
    
    // NgRx Router Store
    provideRouterStore(),
    
    // NgRx DevTools (only in development)
    isDevMode() ? provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75
    }) : [],
    
    // Apollo GraphQL
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink]
    },
    
    // Service Worker
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production && environment.features.enableServiceWorker,
      registrationStrategy: 'registerWhenStable:30000'
    }),
    
    // Import modules with providers
    importProvidersFrom(
      ApolloModule,
      
      // Translations
      TranslateModule.forRoot({
        defaultLanguage: environment.i18n.defaultLanguage,
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      }),
      
      // Toastr notifications
      ToastrModule.forRoot({
        timeOut: environment.notifications.timeout,
        positionClass: `toast-${environment.notifications.position}`,
        preventDuplicates: environment.notifications.preventDuplicates,
        progressBar: environment.notifications.progressBar,
        closeButton: environment.notifications.closeButton,
        enableHtml: true,
        maxOpened: 5,
        autoDismiss: true,
        newestOnTop: true
      })
    )
  ]
};
