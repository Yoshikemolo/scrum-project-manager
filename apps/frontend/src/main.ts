/**
 * Main entry point for the SCRUM Project Manager frontend application.
 * Configures and bootstraps the Angular application with standalone components.
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Bootstrap the Angular application
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('Error bootstrapping application:', err));
