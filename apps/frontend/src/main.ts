/**
 * Main entry point for the SCRUM Project Manager Angular application.
 * Bootstraps the application with necessary configurations and providers.
 * 
 * @module Main
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';
import { enableProdMode } from '@angular/core';

// Enable production mode when in production environment
if (environment.production) {
  enableProdMode();
}

/**
 * Bootstrap the Angular application with the root component and configuration.
 * Handles any bootstrap errors and logs them to the console.
 */
bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // Dispatch custom event to signal app is ready
    window.dispatchEvent(new Event('app-ready'));
    
    // Log successful bootstrap in development
    if (!environment.production) {
      console.log('✅ SCRUM Project Manager application bootstrapped successfully');
    }
    
    // Register service worker for PWA capabilities
    if ('serviceWorker' in navigator && environment.production) {
      navigator.serviceWorker
        .register('/ngsw-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  })
  .catch(err => {
    console.error('❌ Application bootstrap failed:', err);
    
    // Display error message to user
    const errorElement = document.createElement('div');
    errorElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px;
      background: #FEE2E2;
      border: 1px solid #FCA5A5;
      border-radius: 8px;
      color: #991B1B;
      font-family: 'Roboto', sans-serif;
      text-align: center;
      z-index: 100000;
    `;
    errorElement.innerHTML = `
      <h2 style="margin: 0 0 10px 0;">Application Error</h2>
      <p style="margin: 0;">Failed to start the application. Please refresh the page or contact support.</p>
    `;
    document.body.appendChild(errorElement);
  });

// Handle uncaught errors
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Send error to monitoring service in production
  if (environment.production) {
    // TODO: Integrate with error monitoring service (e.g., Sentry)
  }
});

// Performance monitoring
if ('PerformanceObserver' in window) {
  // Monitor Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime, 'ms');
  });
  
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  
  // Monitor First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      const eventEntry = entry as any;
      console.log('FID:', eventEntry.processingStart - eventEntry.startTime, 'ms');
    });
  });
  
  fidObserver.observe({ entryTypes: ['first-input'] });
}
