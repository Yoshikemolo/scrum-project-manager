/**
 * Global loader component.
 * Displays a full-screen loading overlay with customizable message.
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  template: `
    <div class="loader-overlay" @fadeIn>
      <div class="loader-container">
        <mat-progress-spinner
          mode="indeterminate"
          [diameter]="size"
          [strokeWidth]="strokeWidth"
          color="primary"
        ></mat-progress-spinner>
        
        <div class="loader-message" *ngIf="message">
          {{ message | translate }}
        </div>
        
        <div class="loader-dots" *ngIf="showDots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal);
      animation: fadeIn 0.2s ease-in;
    }
    
    .loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-xl);
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
    }
    
    .loader-message {
      font-size: 1.1rem;
      color: var(--text-color);
      text-align: center;
      max-width: 300px;
    }
    
    .loader-dots {
      display: flex;
      gap: var(--spacing-xs);
    }
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color);
      animation: bounce 1.4s infinite ease-in-out both;
      
      &:nth-child(1) {
        animation-delay: -0.32s;
      }
      
      &:nth-child(2) {
        animation-delay: -0.16s;
      }
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `]
})
export class LoaderComponent {
  @Input() message = '';
  @Input() size = 64;
  @Input() strokeWidth = 4;
  @Input() showDots = true;
}
