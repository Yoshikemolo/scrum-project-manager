/**
 * Main Dashboard Component
 * Displays widgets and provides overview of project status
 */
import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Widgets
import { StatsWidgetComponent } from './widgets/stats-widget/stats-widget.component';
import { SprintProgressWidgetComponent } from './widgets/sprint-progress-widget/sprint-progress-widget.component';
import { TasksWidgetComponent } from './widgets/tasks-widget/tasks-widget.component';
import { TeamActivityWidgetComponent } from './widgets/team-activity-widget/team-activity-widget.component';
import { ChartsWidgetComponent } from './widgets/charts-widget/charts-widget.component';
import { CalendarWidgetComponent } from './widgets/calendar-widget/calendar-widget.component';
import { RecentActivityWidgetComponent } from './widgets/recent-activity-widget/recent-activity-widget.component';
import { WeatherWidgetComponent } from './widgets/weather-widget/weather-widget.component';

// Services
import { DashboardService } from './services/dashboard.service';
import { ThemeService } from '../../core/services/theme.service';
import { I18nService } from '../../core/services/i18n.service';
import { ShortcutService } from '../../core/services/shortcut.service';

/**
 * Widget configuration
 */
export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  icon: string;
  component: any;
  size: 'small' | 'medium' | 'large' | 'full';
  position: number;
  visible: boolean;
  refreshInterval?: number;
  settings?: any;
}

/**
 * Dashboard layout
 */
export type DashboardLayout = 'grid' | 'list' | 'compact' | 'custom';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    // Widgets
    StatsWidgetComponent,
    SprintProgressWidgetComponent,
    TasksWidgetComponent,
    TeamActivityWidgetComponent,
    ChartsWidgetComponent,
    CalendarWidgetComponent,
    RecentActivityWidgetComponent,
    WeatherWidgetComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
    trigger('widgetAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'scale(1)' })
        )
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.6, 1)', 
          style({ opacity: 0, transform: 'scale(0.95)' })
        )
      ])
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' })
            )
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State
  public isLoading = signal(true);
  public isEditMode = signal(false);
  public layout = signal<DashboardLayout>('grid');
  public refreshing = signal<Set<string>>(new Set());
  public expandedWidget = signal<string | null>(null);
  public searchQuery = signal('');
  
  // Widget configurations
  public widgets = signal<WidgetConfig[]>([
    {
      id: 'stats',
      type: 'stats',
      title: 'Key Metrics',
      icon: 'analytics',
      component: StatsWidgetComponent,
      size: 'full',
      position: 0,
      visible: true,
      refreshInterval: 60000
    },
    {
      id: 'sprint-progress',
      type: 'sprint-progress',
      title: 'Sprint Progress',
      icon: 'timer',
      component: SprintProgressWidgetComponent,
      size: 'medium',
      position: 1,
      visible: true,
      refreshInterval: 30000
    },
    {
      id: 'tasks',
      type: 'tasks',
      title: 'My Tasks',
      icon: 'task_alt',
      component: TasksWidgetComponent,
      size: 'medium',
      position: 2,
      visible: true,
      refreshInterval: 30000
    },
    {
      id: 'team-activity',
      type: 'team-activity',
      title: 'Team Activity',
      icon: 'groups',
      component: TeamActivityWidgetComponent,
      size: 'medium',
      position: 3,
      visible: true,
      refreshInterval: 60000
    },
    {
      id: 'charts',
      type: 'charts',
      title: 'Analytics',
      icon: 'bar_chart',
      component: ChartsWidgetComponent,
      size: 'large',
      position: 4,
      visible: true,
      refreshInterval: 120000
    },
    {
      id: 'calendar',
      type: 'calendar',
      title: 'Calendar',
      icon: 'calendar_month',
      component: CalendarWidgetComponent,
      size: 'medium',
      position: 5,
      visible: true
    },
    {
      id: 'recent-activity',
      type: 'recent-activity',
      title: 'Recent Activity',
      icon: 'history',
      component: RecentActivityWidgetComponent,
      size: 'medium',
      position: 6,
      visible: true,
      refreshInterval: 45000
    },
    {
      id: 'weather',
      type: 'weather',
      title: 'Weather',
      icon: 'wb_sunny',
      component: WeatherWidgetComponent,
      size: 'small',
      position: 7,
      visible: true,
      refreshInterval: 600000
    }
  ]);
  
  // Computed values
  public visibleWidgets = computed(() => 
    this.widgets()
      .filter(w => w.visible)
      .sort((a, b) => a.position - b.position)
  );
  
  public filteredWidgets = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.visibleWidgets();
    
    return this.visibleWidgets().filter(widget => 
      widget.title.toLowerCase().includes(query) ||
      widget.type.toLowerCase().includes(query)
    );
  });
  
  public gridClasses = computed(() => ({
    'dashboard__grid': true,
    'dashboard__grid--edit': this.isEditMode(),
    [`dashboard__grid--${this.layout()}`]: true
  }));
  
  // User preferences
  private userPreferences = {
    layout: 'grid' as DashboardLayout,
    widgets: [] as string[],
    theme: 'auto'
  };
  
  constructor(
    private dashboardService: DashboardService,
    private themeService: ThemeService,
    private i18n: I18nService,
    private shortcuts: ShortcutService
  ) {
    // Auto-save widget configuration
    effect(() => {
      if (!this.isEditMode()) {
        this.saveWidgetConfiguration();
      }
    });
  }
  
  ngOnInit(): void {
    this.loadUserPreferences();
    this.loadDashboardData();
    this.setupKeyboardShortcuts();
    this.setupAutoRefresh();
    
    // Simulate loading
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load dashboard data
   */
  private loadDashboardData(): void {
    this.dashboardService.loadDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Dashboard data loaded', data);
        },
        error: (error) => {
          console.error('Error loading dashboard data', error);
        }
      });
  }
  
  /**
   * Load user preferences
   */
  private loadUserPreferences(): void {
    const saved = localStorage.getItem('dashboard-preferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        this.userPreferences = preferences;
        this.layout.set(preferences.layout);
        
        // Restore widget visibility
        if (preferences.widgets && preferences.widgets.length > 0) {
          this.widgets.update(widgets => 
            widgets.map(w => ({
              ...w,
              visible: preferences.widgets.includes(w.id)
            }))
          );
        }
      } catch (error) {
        console.error('Error loading preferences', error);
      }
    }
  }
  
  /**
   * Save widget configuration
   */
  private saveWidgetConfiguration(): void {
    const preferences = {
      layout: this.layout(),
      widgets: this.visibleWidgets().map(w => w.id),
      theme: this.themeService.currentTheme()
    };
    localStorage.setItem('dashboard-preferences', JSON.stringify(preferences));
  }
  
  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    // Refresh dashboard
    this.shortcuts.register({
      keys: 'ctrl+r',
      description: 'Refresh dashboard',
      handler: () => this.refreshAll()
    });
    
    // Toggle edit mode
    this.shortcuts.register({
      keys: 'ctrl+e',
      description: 'Toggle edit mode',
      handler: () => this.toggleEditMode()
    });
    
    // Change layout
    this.shortcuts.register({
      keys: 'ctrl+l',
      description: 'Cycle layout',
      handler: () => this.cycleLayout()
    });
    
    // Search widgets
    this.shortcuts.register({
      keys: 'ctrl+f',
      description: 'Search widgets',
      handler: () => this.focusSearch()
    });
  }
  
  /**
   * Setup auto-refresh for widgets
   */
  private setupAutoRefresh(): void {
    this.widgets().forEach(widget => {
      if (widget.refreshInterval) {
        setInterval(() => {
          if (widget.visible && !this.refreshing().has(widget.id)) {
            this.refreshWidget(widget);
          }
        }, widget.refreshInterval);
      }
    });
  }
  
  /**
   * Toggle edit mode
   */
  public toggleEditMode(): void {
    this.isEditMode.set(!this.isEditMode());
  }
  
  /**
   * Change layout
   */
  public changeLayout(layout: DashboardLayout): void {
    this.layout.set(layout);
    this.saveWidgetConfiguration();
  }
  
  /**
   * Cycle through layouts
   */
  public cycleLayout(): void {
    const layouts: DashboardLayout[] = ['grid', 'list', 'compact', 'custom'];
    const currentIndex = layouts.indexOf(this.layout());
    const nextIndex = (currentIndex + 1) % layouts.length;
    this.changeLayout(layouts[nextIndex]);
  }
  
  /**
   * Refresh all widgets
   */
  public refreshAll(): void {
    this.visibleWidgets().forEach(widget => {
      this.refreshWidget(widget);
    });
  }
  
  /**
   * Refresh single widget
   */
  public refreshWidget(widget: WidgetConfig): void {
    this.refreshing.update(set => {
      const newSet = new Set(set);
      newSet.add(widget.id);
      return newSet;
    });
    
    // Simulate refresh
    setTimeout(() => {
      this.refreshing.update(set => {
        const newSet = new Set(set);
        newSet.delete(widget.id);
        return newSet;
      });
    }, 1000);
  }
  
  /**
   * Toggle widget visibility
   */
  public toggleWidget(widget: WidgetConfig): void {
    this.widgets.update(widgets => 
      widgets.map(w => 
        w.id === widget.id ? { ...w, visible: !w.visible } : w
      )
    );
  }
  
  /**
   * Expand widget to fullscreen
   */
  public expandWidget(widget: WidgetConfig): void {
    this.expandedWidget.set(widget.id === this.expandedWidget() ? null : widget.id);
  }
  
  /**
   * Configure widget
   */
  public configureWidget(widget: WidgetConfig): void {
    // Open widget configuration dialog
    console.log('Configure widget', widget);
  }
  
  /**
   * Remove widget
   */
  public removeWidget(widget: WidgetConfig): void {
    this.widgets.update(widgets => 
      widgets.map(w => 
        w.id === widget.id ? { ...w, visible: false } : w
      )
    );
  }
  
  /**
   * Handle widget drag and drop
   */
  public onWidgetDrop(event: CdkDragDrop<WidgetConfig[]>): void {
    const widgets = [...this.widgets()];
    moveItemInArray(widgets, event.previousIndex, event.currentIndex);
    
    // Update positions
    widgets.forEach((widget, index) => {
      widget.position = index;
    });
    
    this.widgets.set(widgets);
  }
  
  /**
   * Add new widget
   */
  public addWidget(): void {
    // Open widget gallery
    console.log('Add new widget');
  }
  
  /**
   * Reset to default layout
   */
  public resetLayout(): void {
    if (confirm(this.i18n.translate('dashboard.resetConfirm'))) {
      localStorage.removeItem('dashboard-preferences');
      window.location.reload();
    }
  }
  
  /**
   * Export dashboard configuration
   */
  public exportConfiguration(): void {
    const config = {
      layout: this.layout(),
      widgets: this.widgets(),
      preferences: this.userPreferences
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-config.json';
    link.click();
    URL.revokeObjectURL(url);
  }
  
  /**
   * Import dashboard configuration
   */
  public importConfiguration(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const config = JSON.parse(e.target.result);
            this.layout.set(config.layout);
            this.widgets.set(config.widgets);
            this.userPreferences = config.preferences;
            this.saveWidgetConfiguration();
          } catch (error) {
            console.error('Error importing configuration', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }
  
  /**
   * Focus search input
   */
  private focusSearch(): void {
    const searchInput = document.querySelector('.dashboard__search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }
  
  /**
   * Get widget size classes
   */
  public getWidgetSizeClass(widget: WidgetConfig): string {
    const expanded = this.expandedWidget() === widget.id;
    if (expanded) return 'dashboard__widget--fullscreen';
    
    return `dashboard__widget--${widget.size}`;
  }
  
  /**
   * Track by function for performance
   */
  public trackByWidgetId(index: number, widget: WidgetConfig): string {
    return widget.id;
  }
}
