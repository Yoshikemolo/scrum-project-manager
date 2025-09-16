/**
 * Team Activity Widget Component
 * Displays team member status and activity
 */
import { Component, OnInit, OnDestroy, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardService, TeamActivity } from '../../services/dashboard.service';

/**
 * Member status type
 */
type MemberStatus = 'online' | 'away' | 'busy' | 'offline';

@Component({
  selector: 'app-team-activity-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './team-activity-widget.component.html',
  styleUrls: ['./team-activity-widget.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(100, [
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 1, transform: 'translateX(0)' })
            )
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class TeamActivityWidgetComponent implements OnInit, OnDestroy {
  @Input() compact = false;
  @Input() showOffline = true;
  
  private destroy$ = new Subject<void>();
  
  // State
  public isLoading = signal(true);
  public teamMembers = signal<TeamActivity[]>([]);
  public selectedView = signal<'grid' | 'list'>('grid');
  public filterStatus = signal<MemberStatus | 'all'>('all');
  
  // Computed values
  public onlineMembers = computed(() => 
    this.teamMembers().filter(m => m.status === 'online')
  );
  
  public awayMembers = computed(() => 
    this.teamMembers().filter(m => m.status === 'away')
  );
  
  public busyMembers = computed(() => 
    this.teamMembers().filter(m => m.status === 'busy')
  );
  
  public offlineMembers = computed(() => 
    this.teamMembers().filter(m => m.status === 'offline')
  );
  
  public filteredMembers = computed(() => {
    const members = this.teamMembers();
    const filter = this.filterStatus();
    
    if (filter === 'all') {
      return this.showOffline ? members : members.filter(m => m.status !== 'offline');
    }
    
    return members.filter(m => m.status === filter);
  });
  
  public averageProductivity = computed(() => {
    const members = this.onlineMembers();
    if (members.length === 0) return 0;
    
    const total = members.reduce((sum, m) => sum + m.productivity, 0);
    return Math.round(total / members.length);
  });
  
  public totalTasksCompleted = computed(() => {
    return this.teamMembers().reduce((sum, m) => sum + m.tasksCompleted, 0);
  });
  
  public totalTasksInProgress = computed(() => {
    return this.teamMembers().reduce((sum, m) => sum + m.tasksInProgress, 0);
  });
  
  constructor(private dashboardService: DashboardService) {}
  
  ngOnInit(): void {
    this.loadTeamActivity();
    this.subscribeToUpdates();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load team activity
   */
  private loadTeamActivity(): void {
    this.isLoading.set(true);
    
    this.dashboardService.loadTeamActivity()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (members) => {
          this.teamMembers.set(members);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading team activity:', error);
          this.isLoading.set(false);
        }
      });
  }
  
  /**
   * Subscribe to real-time updates
   */
  private subscribeToUpdates(): void {
    this.dashboardService.teamActivity$
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => {
        this.teamMembers.set(members);
      });
  }
  
  /**
   * Get status color
   */
  public getStatusColor(status: MemberStatus): string {
    switch (status) {
      case 'online':
        return '#4caf50';
      case 'away':
        return '#ff9800';
      case 'busy':
        return '#f44336';
      case 'offline':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  }
  
  /**
   * Get status icon
   */
  public getStatusIcon(status: MemberStatus): string {
    switch (status) {
      case 'online':
        return 'circle';
      case 'away':
        return 'schedule';
      case 'busy':
        return 'do_not_disturb';
      case 'offline':
        return 'radio_button_unchecked';
      default:
        return 'radio_button_unchecked';
    }
  }
  
  /**
   * Get productivity color
   */
  public getProductivityColor(productivity: number): string {
    if (productivity >= 80) return 'primary';
    if (productivity >= 60) return 'accent';
    if (productivity >= 40) return 'warn';
    return 'warn';
  }
  
  /**
   * Format last activity time
   */
  public formatLastActivity(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  /**
   * Change view mode
   */
  public changeView(view: 'grid' | 'list'): void {
    this.selectedView.set(view);
  }
  
  /**
   * Filter by status
   */
  public filterByStatus(status: MemberStatus | 'all'): void {
    this.filterStatus.set(status);
  }
  
  /**
   * Open member profile
   */
  public openMemberProfile(member: TeamActivity): void {
    console.log('Open profile:', member.memberId);
  }
  
  /**
   * Send message to member
   */
  public sendMessage(member: TeamActivity): void {
    console.log('Send message to:', member.name);
  }
  
  /**
   * Start video call
   */
  public startVideoCall(member: TeamActivity): void {
    console.log('Start video call with:', member.name);
  }
  
  /**
   * Refresh data
   */
  public refresh(): void {
    this.loadTeamActivity();
  }
  
  /**
   * Track by function
   */
  public trackByMemberId(index: number, member: TeamActivity): string {
    return member.memberId;
  }
}
