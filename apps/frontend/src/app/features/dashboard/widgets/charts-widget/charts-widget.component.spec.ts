/**
 * Charts Widget Component Tests
 * Unit tests for the charts widget component
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ChartsWidgetComponent, ChartTypeEnum, ChartPeriod } from './charts-widget.component';
import { DashboardService } from '../../services/dashboard.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ChartData } from '../../services/dashboard.service';

describe('ChartsWidgetComponent', () => {
  let component: ChartsWidgetComponent;
  let fixture: ComponentFixture<ChartsWidgetComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let i18nService: jasmine.SpyObj<I18nService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  
  const mockChartData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [12, 19, 3, 5, 2],
        backgroundColor: 'rgba(33, 150, 243, 0.6)',
        borderColor: 'rgba(33, 150, 243, 1)'
      }
    ]
  };
  
  beforeEach(async () => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getChartData']);
    const i18nServiceSpy = jasmine.createSpyObj('I18nService', ['translate']);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['currentTheme']);
    
    await TestBed.configureTestingModule({
      imports: [
        ChartsWidgetComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();
    
    dashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    i18nService = TestBed.inject(I18nService) as jasmine.SpyObj<I18nService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    
    // Setup default spy returns
    dashboardService.getChartData.and.returnValue(of(mockChartData));
    i18nService.translate.and.returnValue((key: string) => key);
    themeService.currentTheme.and.returnValue(signal('light'));
    
    fixture = TestBed.createComponent(ChartsWidgetComponent);
    component = fixture.componentInstance;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  describe('Initialization', () => {
    it('should load chart data on init', () => {
      fixture.detectChanges();
      
      expect(dashboardService.getChartData).toHaveBeenCalledWith(ChartTypeEnum.BURNDOWN);
      expect(component.isLoading()).toBe(false);
      expect(component.chartData()).toEqual(mockChartData);
    });
    
    it('should use default chart type from input', () => {
      component.defaultChart = ChartTypeEnum.VELOCITY;
      fixture.detectChanges();
      
      expect(component.selectedChart()).toBe(ChartTypeEnum.VELOCITY);
      expect(dashboardService.getChartData).toHaveBeenCalledWith(ChartTypeEnum.VELOCITY);
    });
    
    it('should handle loading error', () => {
      dashboardService.getChartData.and.returnValue(
        throwError(() => new Error('Loading failed'))
      );
      
      fixture.detectChanges();
      
      expect(component.isLoading()).toBe(false);
      expect(component.error()).toBeTruthy();
      expect(component.chartData()).toBeNull();
    });
  });
  
  describe('Chart Type Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should reload data when chart type changes', () => {
      dashboardService.getChartData.calls.reset();
      
      component.changeChartType(ChartTypeEnum.VELOCITY);
      fixture.detectChanges();
      
      expect(component.selectedChart()).toBe(ChartTypeEnum.VELOCITY);
      expect(dashboardService.getChartData).toHaveBeenCalledWith(ChartTypeEnum.VELOCITY);
    });
    
    it('should update chart title when type changes', () => {
      component.changeChartType(ChartTypeEnum.TASKS);
      fixture.detectChanges();
      
      expect(component.chartTitle()).toContain('charts.tasks.title');
    });
  });
  
  describe('Period Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should reload data when period changes', () => {
      dashboardService.getChartData.calls.reset();
      
      component.changePeriod(ChartPeriod.YEAR);
      fixture.detectChanges();
      
      expect(component.selectedPeriod()).toBe(ChartPeriod.YEAR);
      expect(dashboardService.getChartData).toHaveBeenCalled();
    });
    
    it('should update chart title with period', () => {
      component.changePeriod(ChartPeriod.WEEK);
      fixture.detectChanges();
      
      expect(component.chartTitle()).toContain('charts.period.week');
    });
  });
  
  describe('Data Handling', () => {
    it('should detect when data is available', () => {
      fixture.detectChanges();
      
      expect(component.hasData()).toBe(true);
    });
    
    it('should detect when no data is available', () => {
      dashboardService.getChartData.and.returnValue(of({ labels: [], datasets: [] }));
      fixture.detectChanges();
      
      expect(component.hasData()).toBe(false);
    });
  });
  
  describe('Refresh Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    
    it('should reload data on refresh', () => {
      dashboardService.getChartData.calls.reset();
      
      component.refresh();
      
      expect(dashboardService.getChartData).toHaveBeenCalledWith(component.selectedChart());
    });
    
    it('should clear error on refresh', () => {
      component.error.set('Some error');
      
      component.refresh();
      fixture.detectChanges();
      
      expect(component.error()).toBeNull();
    });
  });
  
  describe('Export Functionality', () => {
    it('should export chart when chart is available', () => {
      const mockChart = {
        toBase64Image: jasmine.createSpy('toBase64Image').and.returnValue('data:image/png;base64,...')
      };
      (component as any).chart = mockChart;
      
      const createElementSpy = spyOn(document, 'createElement').and.returnValue({
        click: jasmine.createSpy('click'),
        download: '',
        href: ''
      } as any);
      
      component.exportChart();
      
      expect(mockChart.toBase64Image).toHaveBeenCalled();
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });
    
    it('should not export when chart is not available', () => {
      (component as any).chart = undefined;
      
      const createElementSpy = spyOn(document, 'createElement');
      
      component.exportChart();
      
      expect(createElementSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('Compact Mode', () => {
    it('should apply compact styles when compact input is true', () => {
      component.compact = true;
      fixture.detectChanges();
      
      const element = fixture.nativeElement.querySelector('.charts-widget');
      expect(element.classList.contains('charts-widget--compact')).toBe(true);
    });
    
    it('should hide description in compact mode', () => {
      component.compact = true;
      fixture.detectChanges();
      
      const description = fixture.nativeElement.querySelector('.charts-widget__description');
      expect(description).toBeNull();
    });
  });
  
  describe('Controls Visibility', () => {
    it('should show controls when showControls is true', () => {
      component.showControls = true;
      fixture.detectChanges();
      
      const controls = fixture.nativeElement.querySelector('.charts-widget__controls');
      expect(controls).toBeTruthy();
    });
    
    it('should hide controls when showControls is false', () => {
      component.showControls = false;
      fixture.detectChanges();
      
      const controls = fixture.nativeElement.querySelector('.charts-widget__controls');
      expect(controls).toBeNull();
    });
  });
  
  describe('Theme Changes', () => {
    it('should update chart when theme changes', () => {
      fixture.detectChanges();
      
      const mockChart = {
        options: {},
        update: jasmine.createSpy('update')
      };
      (component as any).chart = mockChart;
      
      themeService.currentTheme.and.returnValue(signal('dark'));
      (component as any).updateChartTheme();
      
      expect(mockChart.update).toHaveBeenCalled();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      fixture.detectChanges();
      
      const selects = fixture.nativeElement.querySelectorAll('mat-select');
      selects.forEach((select: HTMLElement) => {
        expect(select.getAttribute('aria-label')).toBeTruthy();
      });
    });
    
    it('should have proper button labels', () => {
      fixture.detectChanges();
      
      const buttons = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
      buttons.forEach((button: HTMLElement) => {
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });
  
  describe('Cleanup', () => {
    it('should destroy chart on component destroy', () => {
      const mockChart = {
        destroy: jasmine.createSpy('destroy')
      };
      (component as any).chart = mockChart;
      
      fixture.destroy();
      
      expect(mockChart.destroy).toHaveBeenCalled();
    });
    
    it('should complete destroy subject on destroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      
      fixture.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
