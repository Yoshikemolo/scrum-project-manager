/**
 * Footer component for the application.
 * Displays copyright, version info, and useful links.
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule
  ],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <!-- Left Section -->
        <div class="footer-left">
          <span class="copyright">
            © {{ currentYear }} {{ 'footer.copyright' | translate }}
          </span>
          <span class="separator">•</span>
          <span class="version">
            v{{ appVersion }}
          </span>
          <span class="separator">•</span>
          <span class="company">
            <a href="https://ximplicity.es" target="_blank" rel="noopener">
              Ximplicity Software Solutions
            </a>
          </span>
        </div>
        
        <!-- Center Section -->
        <div class="footer-center">
          <a
            *ngFor="let link of footerLinks"
            [routerLink]="link.route"
            class="footer-link"
          >
            {{ link.label | translate }}
          </a>
        </div>
        
        <!-- Right Section -->
        <div class="footer-right">
          <!-- Status Indicator -->
          <div class="status-indicator" [matTooltip]="'footer.systemStatus' | translate">
            <span class="status-dot" [class.online]="isOnline()" [class.offline]="!isOnline()"></span>
            <span class="status-text">
              {{ (isOnline() ? 'footer.online' : 'footer.offline') | translate }}
            </span>
          </div>
          
          <span class="separator">•</span>
          
          <!-- Social Links -->
          <div class="social-links">
            <a
              *ngFor="let social of socialLinks"
              [href]="social.url"
              target="_blank"
              rel="noopener"
              [matTooltip]="social.label"
              class="social-link"
            >
              <mat-icon [svgIcon]="social.icon" *ngIf="social.icon.includes('custom')"></mat-icon>
              <mat-icon *ngIf="!social.icon.includes('custom')">{{ social.icon }}</mat-icon>
            </a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--surface-color);
      border-top: 1px solid var(--border-color);
      padding: var(--spacing-md) var(--spacing-lg);
      margin-top: auto;
    }
    
    .footer-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--spacing-md);
      max-width: 1440px;
      margin: 0 auto;
    }
    
    .footer-left,
    .footer-center,
    .footer-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    
    .footer-center {
      flex: 1;
      justify-content: center;
      
      @media (max-width: 768px) {
        width: 100%;
        order: 3;
        margin-top: var(--spacing-sm);
      }
    }
    
    .copyright,
    .version,
    .company {
      font-size: 0.875rem;
      color: var(--text-secondary-color);
    }
    
    .company a {
      color: var(--primary-color);
      text-decoration: none;
      transition: opacity var(--transition-fast);
      
      &:hover {
        opacity: 0.8;
        text-decoration: underline;
      }
    }
    
    .separator {
      color: var(--text-secondary-color);
      opacity: 0.3;
    }
    
    .footer-link {
      color: var(--text-secondary-color);
      text-decoration: none;
      font-size: 0.875rem;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
      
      &:hover {
        color: var(--primary-color);
        background: rgba(var(--primary-color), 0.08);
      }
      
      &.active {
        color: var(--primary-color);
      }
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: 0.875rem;
      color: var(--text-secondary-color);
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
      
      &.online {
        background: #4caf50;
      }
      
      &.offline {
        background: #f44336;
        animation: none;
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    .social-links {
      display: flex;
      gap: var(--spacing-xs);
    }
    
    .social-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: var(--text-secondary-color);
      transition: all var(--transition-fast);
      
      &:hover {
        background: rgba(var(--primary-color), 0.08);
        color: var(--primary-color);
        transform: translateY(-2px);
      }
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    
    @media (max-width: 768px) {
      .footer {
        padding: var(--spacing-sm) var(--spacing-md);
      }
      
      .footer-container {
        justify-content: center;
        text-align: center;
      }
      
      .footer-left,
      .footer-right {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  appVersion = environment.appVersion;
  isOnline = signal(navigator.onLine);
  
  footerLinks = [
    { label: 'footer.documentation', route: '/docs' },
    { label: 'footer.support', route: '/support' },
    { label: 'footer.privacy', route: '/privacy' },
    { label: 'footer.terms', route: '/terms' },
    { label: 'footer.about', route: '/about' }
  ];
  
  socialLinks = [
    {
      label: 'GitHub',
      icon: 'code',
      url: 'https://github.com/Yoshikemolo/scrum-project-manager'
    },
    {
      label: 'LinkedIn',
      icon: 'business',
      url: 'https://linkedin.com/company/ximplicity'
    },
    {
      label: 'Twitter',
      icon: 'tag',
      url: 'https://twitter.com/ximplicity'
    }
  ];
  
  constructor() {
    this.setupOnlineListener();
  }
  
  /**
   * Setup online/offline status listener
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
    });
    
    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }
}
