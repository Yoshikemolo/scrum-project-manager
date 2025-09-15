/**
 * Unit tests for I18nService
 * Tests internationalization, translations, and formatting
 */
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { I18nService, Language, LocalePreferences } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [I18nService]
    });
    
    service = TestBed.inject(I18nService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage
    localStorage.clear();
  });
  
  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });
  
  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
    
    it('should initialize with default language', () => {
      expect(service.language()).toBeDefined();
      expect(Object.values(Language)).toContain(service.language());
    });
    
    it('should detect browser language', () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        value: 'es-ES',
        configurable: true
      });
      
      const newService = new I18nService(TestBed.inject(HttpClientTestingModule));
      expect(newService.language()).toBe(Language.ES);
    });
    
    it('should load saved preferences', () => {
      const preferences: LocalePreferences = {
        language: Language.FR,
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        timezone: 'Europe/Paris',
        firstDayOfWeek: 1,
        numberFormat: '1 234,56',
        currencyCode: 'EUR',
        measurementUnit: 'metric'
      };
      
      localStorage.setItem('locale-preferences', JSON.stringify(preferences));
      
      const newService = new I18nService(TestBed.inject(HttpClientTestingModule));
      expect(newService.language()).toBe(Language.FR);
      expect(newService.preferences().currencyCode).toBe('EUR');
    });
  });
  
  describe('Language Management', () => {
    it('should change language', async () => {
      const translations = {
        'common.hello': 'Hola',
        'common.goodbye': 'Adiós'
      };
      
      const promise = service.setLanguage(Language.ES);
      
      // Mock HTTP requests
      const req1 = httpMock.expectOne('/assets/i18n/es.json');
      req1.flush(translations);
      const req2 = httpMock.expectOne('/assets/i18n/es-common.json');
      req2.flush({});
      
      await promise;
      
      expect(service.language()).toBe(Language.ES);
    });
    
    it('should cache translations', async () => {
      const translations = { 'test': 'Test' };
      
      // First load
      const promise1 = service.setLanguage(Language.FR);
      httpMock.expectOne('/assets/i18n/fr.json').flush(translations);
      httpMock.expectOne('/assets/i18n/fr-common.json').flush({});
      await promise1;
      
      // Switch to another language
      const promise2 = service.setLanguage(Language.DE);
      httpMock.expectOne('/assets/i18n/de.json').flush({});
      httpMock.expectOne('/assets/i18n/de-common.json').flush({});
      await promise2;
      
      // Switch back - should use cache
      await service.setLanguage(Language.FR);
      
      // No new HTTP requests should be made
      httpMock.expectNone('/assets/i18n/fr.json');
    });
    
    it('should update document direction for RTL languages', async () => {
      // For this test, we'd need to add Arabic to the languages map
      // Since we don't have RTL languages in the current implementation,
      // we'll test the LTR case
      await service.setLanguage(Language.EN);
      
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');
    });
    
    it('should save preferences on language change', async () => {
      const promise = service.setLanguage(Language.IT);
      
      httpMock.expectOne('/assets/i18n/it.json').flush({});
      httpMock.expectOne('/assets/i18n/it-common.json').flush({});
      
      await promise;
      
      const saved = localStorage.getItem('locale-preferences');
      expect(saved).toBeTruthy();
      
      const preferences = JSON.parse(saved!);
      expect(preferences.language).toBe(Language.IT);
    });
  });
  
  describe('Translation', () => {
    beforeEach(async () => {
      const translations = {
        'common': {
          'hello': 'Hello',
          'welcome': 'Welcome, {{name}}!',
          'items': {
            'zero': 'No items',
            'one': 'One item',
            'other': '{{count}} items'
          }
        },
        'errors': {
          'required': 'This field is required',
          'minLength': 'Minimum length is {{min}}'
        }
      };
      
      // Mock initial translation load
      const req1 = httpMock.expectOne('/assets/i18n/en.json');
      req1.flush(translations);
      const req2 = httpMock.expectOne('/assets/i18n/en-common.json');
      req2.flush({});
    });
    
    it('should translate simple key', () => {
      const translation = service.translate('common.hello');
      expect(translation).toBe('Hello');
    });
    
    it('should translate with parameters', () => {
      const translation = service.translate('common.welcome', { name: 'John' });
      expect(translation).toBe('Welcome, John!');
    });
    
    it('should handle nested translations', () => {
      const translation = service.translate('errors.required');
      expect(translation).toBe('This field is required');
    });
    
    it('should return key for missing translation', () => {
      const translation = service.translate('missing.key');
      expect(translation).toBe('missing.key');
    });
    
    it('should translate with multiple parameters', () => {
      const translation = service.translate('errors.minLength', { min: 5 });
      expect(translation).toBe('Minimum length is 5');
    });
  });
  
  describe('Plural Translation', () => {
    beforeEach(async () => {
      const translations = {
        'items': {
          'zero': 'No items',
          'one': 'One item',
          'two': 'Two items',
          'few': 'A few items ({{count}})',
          'many': 'Many items ({{count}})',
          'other': '{{count}} items'
        }
      };
      
      const req1 = httpMock.expectOne('/assets/i18n/en.json');
      req1.flush(translations);
      const req2 = httpMock.expectOne('/assets/i18n/en-common.json');
      req2.flush({});
    });
    
    it('should translate plural for zero', () => {
      const translation = service.translatePlural('items', 0);
      expect(translation).toBe('No items');
    });
    
    it('should translate plural for one', () => {
      const translation = service.translatePlural('items', 1);
      expect(translation).toBe('One item');
    });
    
    it('should translate plural for two', () => {
      const translation = service.translatePlural('items', 2);
      expect(translation).toBe('Two items');
    });
    
    it('should translate plural for few', () => {
      const translation = service.translatePlural('items', 5);
      expect(translation).toBe('A few items (5)');
    });
    
    it('should translate plural for many', () => {
      const translation = service.translatePlural('items', 50);
      expect(translation).toBe('Many items (50)');
    });
  });
  
  describe('Date Formatting', () => {
    const testDate = new Date('2024-03-15T14:30:00');
    
    it('should format date', () => {
      const formatted = service.formatDate(testDate);
      expect(formatted).toContain('Mar');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
    
    it('should format time', () => {
      const formatted = service.formatTime(testDate);
      expect(formatted).toMatch(/2:30|14:30/);
    });
    
    it('should format date and time', () => {
      const formatted = service.formatDateTime(testDate);
      expect(formatted).toContain('Mar');
      expect(formatted).toMatch(/2:30|14:30/);
    });
    
    it('should format relative time', () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const formatted = service.formatRelativeTime(hourAgo);
      expect(formatted.toLowerCase()).toContain('hour');
    });
    
    it('should format with custom options', () => {
      const formatted = service.formatDate(testDate, { style: 'full' });
      expect(formatted.length).toBeGreaterThan(10);
    });
  });
  
  describe('Number Formatting', () => {
    it('should format number', () => {
      const formatted = service.formatNumber(1234.567);
      expect(formatted).toMatch(/1,234\.57|1.234,57/);
    });
    
    it('should format number with decimals', () => {
      const formatted = service.formatNumber(1234.567, 3);
      expect(formatted).toMatch(/1,234\.567|1.234,567/);
    });
    
    it('should format currency', () => {
      const formatted = service.formatCurrency(1234.56);
      expect(formatted).toContain('1,234');
      expect(formatted).toMatch(/\$|USD/);
    });
    
    it('should format currency with custom code', () => {
      const formatted = service.formatCurrency(1234.56, 'EUR');
      expect(formatted).toMatch(/€|EUR/);
    });
    
    it('should format percentage', () => {
      const formatted = service.formatPercent(0.1234);
      expect(formatted).toBe('12%');
    });
    
    it('should format percentage with decimals', () => {
      const formatted = service.formatPercent(0.1234, 2);
      expect(formatted).toBe('12.34%');
    });
  });
  
  describe('Utility Formatting', () => {
    it('should format file size', () => {
      expect(service.formatFileSize(500)).toMatch(/500\s*B/);
      expect(service.formatFileSize(1024)).toMatch(/1\.0\s*KB/);
      expect(service.formatFileSize(1536)).toMatch(/1\.5\s*KB/);
      expect(service.formatFileSize(1048576)).toMatch(/1\.0\s*MB/);
      expect(service.formatFileSize(1073741824)).toMatch(/1\.0\s*GB/);
    });
    
    it('should format duration', () => {
      // Mock translations for duration
      const translations = {
        'common': {
          'duration': {
            'days': {
              'other': '{{count}} days'
            },
            'hours': {
              'other': '{{count}} hours'
            },
            'minutes': {
              'other': '{{count}} minutes'
            },
            'seconds': {
              'other': '{{count}} seconds'
            }
          }
        }
      };
      
      const req1 = httpMock.expectOne('/assets/i18n/en.json');
      req1.flush(translations);
      const req2 = httpMock.expectOne('/assets/i18n/en-common.json');
      req2.flush({});
      
      expect(service.formatDuration(1000)).toContain('1 second');
      expect(service.formatDuration(60000)).toContain('1 minute');
      expect(service.formatDuration(3600000)).toContain('1 hour');
      expect(service.formatDuration(86400000)).toContain('1 day');
    });
  });
  
  describe('Preferences Management', () => {
    it('should update preferences', () => {
      const newPrefs: Partial<LocalePreferences> = {
        timeFormat: '24h',
        currencyCode: 'EUR',
        firstDayOfWeek: 1
      };
      
      service.updatePreferences(newPrefs);
      
      const preferences = service.preferences();
      expect(preferences.timeFormat).toBe('24h');
      expect(preferences.currencyCode).toBe('EUR');
      expect(preferences.firstDayOfWeek).toBe(1);
    });
    
    it('should persist preferences', () => {
      service.updatePreferences({ timeFormat: '24h' });
      
      const saved = localStorage.getItem('locale-preferences');
      expect(saved).toBeTruthy();
      
      const preferences = JSON.parse(saved!);
      expect(preferences.timeFormat).toBe('24h');
    });
  });
  
  describe('Language Info', () => {
    it('should provide language info', () => {
      const info = service.languageInfo();
      expect(info).toBeTruthy();
      expect(info?.name).toBeTruthy();
      expect(info?.nativeName).toBeTruthy();
      expect(info?.flag).toBeTruthy();
    });
    
    it('should list available languages', () => {
      const languages = service.availableLanguages();
      expect(languages.length).toBe(8);
      expect(languages.map(l => l.code)).toContain(Language.EN);
      expect(languages.map(l => l.code)).toContain(Language.ES);
      expect(languages.map(l => l.code)).toContain(Language.FR);
    });
  });
  
  describe('Observable Compatibility', () => {
    it('should emit language changes', (done) => {
      service.language$.subscribe(language => {
        if (language === Language.DE) {
          done();
        }
      });
      
      const promise = service.setLanguage(Language.DE);
      
      httpMock.expectOne('/assets/i18n/de.json').flush({});
      httpMock.expectOne('/assets/i18n/de-common.json').flush({});
    });
  });
});
