/**
 * Internationalization (i18n) Service
 * Manages translations, locale settings, and formatting preferences
 */
import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, forkJoin } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';

/**
 * Supported languages
 */
export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
  ZH = 'zh',
  JA = 'ja'
}

/**
 * Language metadata
 */
export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currencySymbol: string;
  decimalSeparator: string;
  thousandsSeparator: string;
}

/**
 * User locale preferences
 */
export interface LocalePreferences {
  language: Language;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  numberFormat: string;
  currencyCode: string;
  measurementUnit: 'metric' | 'imperial';
}

/**
 * Translation parameters
 */
export interface TranslationParams {
  [key: string]: string | number | boolean;
}

/**
 * Date/time format options
 */
export interface FormatOptions {
  style?: 'short' | 'medium' | 'long' | 'full';
  timezone?: string;
  relative?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  // Language configurations
  private readonly languages: Map<Language, LanguageInfo> = new Map([
    [Language.EN, {
      code: Language.EN,
      name: 'English',
      nativeName: 'English',
      direction: 'ltr',
      flag: '🇺🇸',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      numberFormat: '1,234.56',
      currencySymbol: '$',
      decimalSeparator: '.',
      thousandsSeparator: ','
    }],
    [Language.ES, {
      code: Language.ES,
      name: 'Spanish',
      nativeName: 'Español',
      direction: 'ltr',
      flag: '🇪🇸',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      numberFormat: '1.234,56',
      currencySymbol: '€',
      decimalSeparator: ',',
      thousandsSeparator: '.'
    }],
    [Language.FR, {
      code: Language.FR,
      name: 'French',
      nativeName: 'Français',
      direction: 'ltr',
      flag: '🇫🇷',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      numberFormat: '1 234,56',
      currencySymbol: '€',
      decimalSeparator: ',',
      thousandsSeparator: ' '
    }],
    [Language.DE, {
      code: Language.DE,
      name: 'German',
      nativeName: 'Deutsch',
      direction: 'ltr',
      flag: '🇩🇪',
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      numberFormat: '1.234,56',
      currencySymbol: '€',
      decimalSeparator: ',',
      thousandsSeparator: '.'
    }],
    [Language.IT, {
      code: Language.IT,
      name: 'Italian',
      nativeName: 'Italiano',
      direction: 'ltr',
      flag: '🇮🇹',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      numberFormat: '1.234,56',
      currencySymbol: '€',
      decimalSeparator: ',',
      thousandsSeparator: '.'
    }],
    [Language.PT, {
      code: Language.PT,
      name: 'Portuguese',
      nativeName: 'Português',
      direction: 'ltr',
      flag: '🇵🇹',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      numberFormat: '1.234,56',
      currencySymbol: '€',
      decimalSeparator: ',',
      thousandsSeparator: '.'
    }],
    [Language.ZH, {
      code: Language.ZH,
      name: 'Chinese',
      nativeName: '中文',
      direction: 'ltr',
      flag: '🇨🇳',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      numberFormat: '1,234.56',
      currencySymbol: '¥',
      decimalSeparator: '.',
      thousandsSeparator: ','
    }],
    [Language.JA, {
      code: Language.JA,
      name: 'Japanese',
      nativeName: '日本語',
      direction: 'ltr',
      flag: '🇯🇵',
      dateFormat: 'YYYY/MM/DD',
      timeFormat: '24h',
      numberFormat: '1,234.56',
      currencySymbol: '¥',
      decimalSeparator: '.',
      thousandsSeparator: ','
    }]
  ]);

  // State management
  private currentLanguage = signal<Language>(Language.EN);
  private translations = signal<Map<string, any>>(new Map());
  private localePreferences = signal<LocalePreferences>(this.getDefaultPreferences());
  private loadingTranslations = signal<boolean>(false);
  private translationCache = new Map<Language, Observable<any>>();

  // Observables for legacy support
  private currentLanguage$ = new BehaviorSubject<Language>(Language.EN);
  private translations$ = new BehaviorSubject<Map<string, any>>(new Map());

  // Computed values
  public readonly language = computed(() => this.currentLanguage());
  public readonly isLoading = computed(() => this.loadingTranslations());
  public readonly preferences = computed(() => this.localePreferences());
  public readonly languageInfo = computed(() => this.languages.get(this.currentLanguage()));
  public readonly direction = computed(() => this.languageInfo()?.direction || 'ltr');
  public readonly availableLanguages = computed(() => Array.from(this.languages.values()));

  // Formatters
  private dateFormatter?: Intl.DateTimeFormat;
  private timeFormatter?: Intl.DateTimeFormat;
  private numberFormatter?: Intl.NumberFormat;
  private currencyFormatter?: Intl.NumberFormat;
  private relativeTimeFormatter?: Intl.RelativeTimeFormat;

  constructor(private http: HttpClient) {
    this.initializeService();
    
    // Sync signals with observables for backward compatibility
    effect(() => {
      this.currentLanguage$.next(this.currentLanguage());
      this.translations$.next(this.translations());
    });
  }

  /**
   * Initialize the service with user preferences
   */
  private initializeService(): void {
    // Load saved preferences
    const savedPreferences = this.loadPreferences();
    if (savedPreferences) {
      this.localePreferences.set(savedPreferences);
      this.currentLanguage.set(savedPreferences.language);
    } else {
      // Detect browser language
      const browserLang = this.detectBrowserLanguage();
      this.currentLanguage.set(browserLang);
      this.localePreferences.update(prefs => ({ ...prefs, language: browserLang }));
    }

    // Load initial translations
    this.loadTranslations(this.currentLanguage());
    
    // Initialize formatters
    this.initializeFormatters();
  }

  /**
   * Change current language
   */
  public async setLanguage(language: Language): Promise<void> {
    if (language === this.currentLanguage()) return;

    this.loadingTranslations.set(true);
    
    try {
      await this.loadTranslations(language);
      this.currentLanguage.set(language);
      this.localePreferences.update(prefs => ({ ...prefs, language }));
      this.savePreferences();
      this.initializeFormatters();
      this.updateDocumentDirection();
    } finally {
      this.loadingTranslations.set(false);
    }
  }

  /**
   * Load translations for a language
   */
  private async loadTranslations(language: Language): Promise<void> {
    const cached = this.translationCache.get(language);
    
    if (cached) {
      const translations = await cached.toPromise();
      this.translations.set(new Map(Object.entries(translations)));
      return;
    }

    const urls = [
      `/assets/i18n/${language}.json`,
      `/assets/i18n/${language}-common.json`
    ];

    const requests = urls.map(url => 
      this.http.get<any>(url).pipe(
        catchError(() => of({}))
      )
    );

    const observable = forkJoin(requests).pipe(
      map(responses => Object.assign({}, ...responses)),
      shareReplay(1)
    );

    this.translationCache.set(language, observable);
    
    const translations = await observable.toPromise();
    this.translations.set(new Map(Object.entries(translations)));
  }

  /**
   * Translate a key with optional parameters
   */
  public translate(key: string, params?: TranslationParams): string {
    const translations = this.translations();
    let translation = this.getNestedTranslation(translations, key);

    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    // Replace parameters
    if (params) {
      Object.keys(params).forEach(param => {
        const regex = new RegExp(`{{\\s*${param}\\s*}}`, 'g');
        translation = translation.replace(regex, String(params[param]));
      });
    }

    return translation;
  }

  /**
   * Translate with plural support
   */
  public translatePlural(
    key: string,
    count: number,
    params?: TranslationParams
  ): string {
    const pluralKey = count === 0 ? `${key}.zero` :
                     count === 1 ? `${key}.one` :
                     count === 2 ? `${key}.two` :
                     count <= 10 ? `${key}.few` :
                     `${key}.many`;

    // Try specific plural form first, then fallback to general
    let translation = this.translate(pluralKey, { ...params, count });
    if (translation === pluralKey) {
      translation = this.translate(`${key}.other`, { ...params, count });
    }

    return translation;
  }

  /**
   * Format date according to locale preferences
   */
  public formatDate(date: Date | string | number, options?: FormatOptions): string {
    const dateObj = new Date(date);
    
    if (options?.relative) {
      return this.formatRelativeTime(dateObj);
    }

    const formatter = new Intl.DateTimeFormat(this.currentLanguage(), {
      dateStyle: options?.style || 'medium',
      timeZone: options?.timezone || this.localePreferences().timezone
    });

    return formatter.format(dateObj);
  }

  /**
   * Format time according to locale preferences
   */
  public formatTime(date: Date | string | number, options?: FormatOptions): string {
    const dateObj = new Date(date);
    const prefs = this.localePreferences();
    
    const formatter = new Intl.DateTimeFormat(this.currentLanguage(), {
      timeStyle: options?.style || 'short',
      hour12: prefs.timeFormat === '12h',
      timeZone: options?.timezone || prefs.timezone
    });

    return formatter.format(dateObj);
  }

  /**
   * Format date and time
   */
  public formatDateTime(date: Date | string | number, options?: FormatOptions): string {
    const dateObj = new Date(date);
    const prefs = this.localePreferences();
    
    const formatter = new Intl.DateTimeFormat(this.currentLanguage(), {
      dateStyle: options?.style || 'medium',
      timeStyle: options?.style || 'short',
      hour12: prefs.timeFormat === '12h',
      timeZone: options?.timezone || prefs.timezone
    });

    return formatter.format(dateObj);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  public formatRelativeTime(date: Date | string | number): string {
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (!this.relativeTimeFormatter) {
      this.relativeTimeFormatter = new Intl.RelativeTimeFormat(this.currentLanguage(), {
        numeric: 'auto'
      });
    }

    if (Math.abs(diffDays) >= 30) {
      return this.formatDate(dateObj);
    } else if (Math.abs(diffDays) >= 1) {
      return this.relativeTimeFormatter.format(-diffDays, 'day');
    } else if (Math.abs(diffHours) >= 1) {
      return this.relativeTimeFormatter.format(-diffHours, 'hour');
    } else if (Math.abs(diffMins) >= 1) {
      return this.relativeTimeFormatter.format(-diffMins, 'minute');
    } else {
      return this.translate('common.justNow');
    }
  }

  /**
   * Format number according to locale preferences
   */
  public formatNumber(value: number, decimals?: number): string {
    const formatter = new Intl.NumberFormat(this.currentLanguage(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals !== undefined ? decimals : 2
    });

    return formatter.format(value);
  }

  /**
   * Format currency
   */
  public formatCurrency(value: number, currencyCode?: string): string {
    const prefs = this.localePreferences();
    const formatter = new Intl.NumberFormat(this.currentLanguage(), {
      style: 'currency',
      currency: currencyCode || prefs.currencyCode || 'USD'
    });

    return formatter.format(value);
  }

  /**
   * Format percentage
   */
  public formatPercent(value: number, decimals = 0): string {
    const formatter = new Intl.NumberFormat(this.currentLanguage(), {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return formatter.format(value);
  }

  /**
   * Format file size
   */
  public formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${this.formatNumber(size, size < 10 ? 2 : 1)} ${units[unitIndex]}`;
  }

  /**
   * Format duration
   */
  public formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return this.translatePlural('common.duration.days', days, { count: days });
    } else if (hours > 0) {
      return this.translatePlural('common.duration.hours', hours, { count: hours });
    } else if (minutes > 0) {
      return this.translatePlural('common.duration.minutes', minutes, { count: minutes });
    } else {
      return this.translatePlural('common.duration.seconds', seconds, { count: seconds });
    }
  }

  /**
   * Update user preferences
   */
  public updatePreferences(preferences: Partial<LocalePreferences>): void {
    this.localePreferences.update(prefs => ({ ...prefs, ...preferences }));
    this.savePreferences();
    this.initializeFormatters();
  }

  /**
   * Get nested translation from map
   */
  private getNestedTranslation(translations: Map<string, any>, key: string): string | null {
    const keys = key.split('.');
    let current: any = translations;

    for (const k of keys) {
      if (current instanceof Map) {
        current = current.get(k);
      } else if (current && typeof current === 'object') {
        current = current[k];
      } else {
        return null;
      }

      if (current === undefined) {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Detect browser language
   */
  private detectBrowserLanguage(): Language {
    const browserLang = navigator.language.toLowerCase().split('-')[0];
    const supportedLang = Object.values(Language).find(lang => lang === browserLang);
    return supportedLang || Language.EN;
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): LocalePreferences {
    return {
      language: Language.EN,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      firstDayOfWeek: 0,
      numberFormat: '1,234.56',
      currencyCode: 'USD',
      measurementUnit: 'metric'
    };
  }

  /**
   * Initialize formatters
   */
  private initializeFormatters(): void {
    const lang = this.currentLanguage();
    const prefs = this.localePreferences();

    this.dateFormatter = new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
      timeZone: prefs.timezone
    });

    this.timeFormatter = new Intl.DateTimeFormat(lang, {
      timeStyle: 'short',
      hour12: prefs.timeFormat === '12h',
      timeZone: prefs.timezone
    });

    this.numberFormatter = new Intl.NumberFormat(lang);
    
    this.currencyFormatter = new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: prefs.currencyCode || 'USD'
    });

    this.relativeTimeFormatter = new Intl.RelativeTimeFormat(lang, {
      numeric: 'auto'
    });
  }

  /**
   * Update document direction for RTL languages
   */
  private updateDocumentDirection(): void {
    const direction = this.direction();
    document.documentElement.dir = direction;
    document.documentElement.lang = this.currentLanguage();
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    localStorage.setItem('locale-preferences', JSON.stringify(this.localePreferences()));
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): LocalePreferences | null {
    const saved = localStorage.getItem('locale-preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Observable getters for backward compatibility
   */
  public get language$(): Observable<Language> {
    return this.currentLanguage$.asObservable();
  }

  public get translations$(): Observable<Map<string, any>> {
    return this.translations$.asObservable();
  }
}
