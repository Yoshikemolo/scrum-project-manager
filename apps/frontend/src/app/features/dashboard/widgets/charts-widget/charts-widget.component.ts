/**
 * Charts Widget Component
 * Provides data visualizations for various project metrics
 * 
 * @component ChartsWidgetComponent
 * @module DashboardModule
 * @description Displays interactive charts including burndown, velocity, task distribution, and productivity metrics.
 * Supports multiple chart types and real-time data updates.
 */
import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, signal, computed, effect, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardService, ChartData } from '../../services/dashboard.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Chart type enumeration
 */
export enum ChartTypeEnum {
  BURNDOWN = 'burndown',
  VELOCITY = 'velocity',
  TASKS = 'tasks',
  PRODUCTIVITY = 'productivity'
}

/**
 * Chart period enumeration
 */
export enum ChartPeriod {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

@Component({
  selector: 'app-charts-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './charts-widget.component.html',
  styleUrls: ['./charts-widget.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ transform: 'translateY(0)', opacity: 1 })
        )
      ])
    ])
  ]
})
export class ChartsWidgetComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;
  @Input() compact = false;
  @Input() defaultChart: ChartTypeEnum = ChartTypeEnum.BURNDOWN;
  @Input() showControls = true;
  
  private destroy$ = new Subject<void>();
  private chart?: Chart;
  
  // State management
  public isLoading = signal(true);
  public selectedChart = signal<ChartTypeEnum>(this.defaultChart);
  public selectedPeriod = signal<ChartPeriod>(ChartPeriod.MONTH);
  public chartData = signal<ChartData | null>(null);
  public error = signal<string | null>(null);
  
  // Chart options
  public chartTypes = Object.values(ChartTypeEnum);
  public chartPeriods = Object.values(ChartPeriod);
  
  // Computed properties
  public chartTitle = computed(() => {
    const type = this.selectedChart();
    const period = this.selectedPeriod();
    return this.i18n.translate(`charts.${type}.title`) + ' - ' + 
           this.i18n.translate(`charts.period.${period}`);
  });
  
  public chartDescription = computed(() => {
    const type = this.selectedChart();
    return this.i18n.translate(`charts.${type}.description`);
  });
  
  public hasData = computed(() => {
    const data = this.chartData();
    return data && data.datasets && data.datasets.length > 0;
  });
  
  constructor(
    private dashboardService: DashboardService,
    private i18n: I18nService,
    private themeService: ThemeService
  ) {
    // React to chart type changes
    effect(() => {
      const type = this.selectedChart();
      const period = this.selectedPeriod();
      if (type && period) {
        this.loadChartData(type);
      }
    });
    
    // React to theme changes
    effect(() => {
      const theme = this.themeService.currentTheme();
      if (this.chart) {
        this.updateChartTheme();
      }
    });
  }
  
  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.loadChartData(this.selectedChart());
  }
  
  /**
   * After view initialization
   */
  ngAfterViewInit(): void {
    // Initialize chart after view is ready
    setTimeout(() => {
      const data = this.chartData();
      if (data && this.chartCanvas) {
        this.initializeChart(data);
      }
    }, 100);
  }
  
  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.chart) {
      this.chart.destroy();
    }
  }
  
  /**
   * Load chart data from service
   * @param type - Chart type to load
   */
  private loadChartData(type: ChartTypeEnum): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.dashboardService.getChartData(type)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.chartData.set(data);
          this.isLoading.set(false);
          
          // Update or create chart
          if (this.chart) {
            this.updateChart(data);
          } else if (this.chartCanvas) {
            this.initializeChart(data);
          }
        },
        error: (error) => {
          console.error('Error loading chart data:', error);
          this.error.set(this.i18n.translate('charts.error.loading'));
          this.isLoading.set(false);
        }
      });
  }
  
  /**
   * Initialize chart with data
   * @param data - Chart data
   */
  private initializeChart(data: ChartData): void {
    if (!this.chartCanvas?.nativeElement) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const config = this.getChartConfiguration(data);
    this.chart = new Chart(ctx, config);
  }
  
  /**
   * Update existing chart with new data
   * @param data - New chart data
   */
  private updateChart(data: ChartData): void {
    if (!this.chart) return;
    
    this.chart.data = data;
    this.chart.update('active');
  }
  
  /**
   * Get chart configuration based on type
   * @param data - Chart data
   * @returns Chart configuration
   */
  private getChartConfiguration(data: ChartData): ChartConfiguration {
    const type = this.selectedChart();
    const isDarkMode = this.themeService.currentTheme() === 'dark';
    
    const baseConfig: ChartConfiguration = {
      type: this.getChartJsType(type),
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: isDarkMode ? '#ffffff' : '#000000',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: isDarkMode ? '#2c2c2c' : '#ffffff',
            titleColor: isDarkMode ? '#ffffff' : '#000000',
            bodyColor: isDarkMode ? '#ffffff' : '#000000',
            borderColor: isDarkMode ? '#444444' : '#e0e0e0',
            borderWidth: 1
          }
        },
        scales: this.getScalesConfig(type, isDarkMode)
      }
    };
    
    return baseConfig;
  }
  
  /**
   * Get Chart.js type from internal type
   * @param type - Internal chart type
   * @returns Chart.js type
   */
  private getChartJsType(type: ChartTypeEnum): ChartType {
    switch (type) {
      case ChartTypeEnum.TASKS:
        return 'doughnut';
      case ChartTypeEnum.PRODUCTIVITY:
        return 'bar';
      default:
        return 'line';
    }
  }
  
  /**
   * Get scales configuration for chart
   * @param type - Chart type
   * @param isDarkMode - Dark mode flag
   * @returns Scales configuration
   */
  private getScalesConfig(type: ChartTypeEnum, isDarkMode: boolean): any {
    if (type === ChartTypeEnum.TASKS) {
      return {}; // No scales for doughnut chart
    }
    
    return {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          display: true
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000'
        }
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          display: true
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000'
        },
        beginAtZero: true
      }
    };
  }
  
  /**
   * Update chart theme
   */
  private updateChartTheme(): void {
    if (!this.chart) return;
    
    const data = this.chartData();
    if (data) {
      const config = this.getChartConfiguration(data);
      this.chart.options = config.options;
      this.chart.update();
    }
  }
  
  /**
   * Change chart type
   * @param type - New chart type
   */
  public changeChartType(type: ChartTypeEnum): void {
    this.selectedChart.set(type);
  }
  
  /**
   * Change chart period
   * @param period - New period
   */
  public changePeriod(period: ChartPeriod): void {
    this.selectedPeriod.set(period);
  }
  
  /**
   * Export chart as image
   */
  public exportChart(): void {
    if (!this.chart) return;
    
    const url = this.chart.toBase64Image();
    const link = document.createElement('a');
    link.download = `chart-${this.selectedChart()}-${Date.now()}.png`;
    link.href = url;
    link.click();
  }
  
  /**
   * Refresh chart data
   */
  public refresh(): void {
    this.loadChartData(this.selectedChart());
  }
  
  /**
   * Get chart type label
   * @param type - Chart type
   * @returns Translated label
   */
  public getChartTypeLabel(type: ChartTypeEnum): string {
    return this.i18n.translate(`charts.${type}.label`);
  }
  
  /**
   * Get period label
   * @param period - Period
   * @returns Translated label
   */
  public getPeriodLabel(period: ChartPeriod): string {
    return this.i18n.translate(`charts.period.${period}`);
  }
}
