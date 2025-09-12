/**
 * @fileoverview Loader Component
 * @module LoaderComponent
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

export type LoaderType = 'circular' | 'linear' | 'dots' | 'pulse' | 'custom' | 'skeleton' | 'inline';
export type LoaderColor = 'primary' | 'accent' | 'warn';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoaderComponent implements OnInit, OnDestroy {
  @Input() type: LoaderType = 'circular';
  @Input() message = '';
  @Input() hint = '';
  @Input() size = 64;
  @Input() strokeWidth = 4;
  @Input() color: LoaderColor = 'primary';
  @Input() fullscreen = true;
  @Input() showBackdrop = true;
  @Input() elevated = true;
  @Input() compact = false;
  @Input() showProgress = false;
  @Input() progress = 0;
  @Input() showActions = false;
  @Input() cancellable = true;
  @Input() showTimer = false;
  @Input() skeletonLines = [1, 2, 3, 4];
  
  @Output() cancel = new EventEmitter<void>();
  
  animationState = 'in';
  elapsedTime = 0;
  private timerInterval?: number;
  
  ngOnInit(): void {
    if (this.showTimer) {
      this.startTimer();
    }
  }
  
  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
  
  private startTimer(): void {
    this.timerInterval = window.setInterval(() => {
      this.elapsedTime++;
    }, 1000);
  }
  
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  onCancel(): void {
    this.cancel.emit();
  }
}