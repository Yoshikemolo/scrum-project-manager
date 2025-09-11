/**
 * Theme service for managing application themes and user preferences.
 * Handles theme switching, persistence, and system theme detection.
 */

import { Injectable, inject, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

import { LocalStorageService } from './local-storage.service';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeColors {
  primary: string;
  accent: string;
  warn: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly localStorage = inject(LocalStorageService);
  
  private readonly THEME_KEY = 'theme';
  private readonly CUSTOM_THEME_KEY = 'custom_theme';
  
  // Theme state
  private readonly _currentTheme = signal<Theme>('system');
  private readonly _isDarkTheme = new BehaviorSubject<boolean>(false);
  private readonly _customColors = signal<Partial<ThemeColors>>({});
  
  // Public observables
  readonly currentTheme = this._currentTheme.asReadonly();
  readonly isDarkTheme$ = this._isDarkTheme.asObservable();
  readonly customColors = this._customColors.asReadonly();
  
  // System theme media query
  private readonly systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  constructor() {
    this.initializeTheme();
    this.setupSystemThemeListener();
    this.setupThemeEffect();
  }
  
  /**
   * Initialize theme from storage or system preference
   */
  private initializeTheme(): void {
    const savedTheme = this.localStorage.getItem<Theme>(this.THEME_KEY);
    const savedCustomColors = this.localStorage.getItem<Partial<ThemeColors>>(this.CUSTOM_THEME_KEY);
    
    if (savedTheme) {
      this._currentTheme.set(savedTheme);
    }
    
    if (savedCustomColors) {
      this._customColors.set(savedCustomColors);
    }
    
    this.applyTheme();
  }
  
  /**
   * Setup system theme change listener
   */
  private setupSystemThemeListener(): void {
    fromEvent<MediaQueryListEvent>(this.systemThemeQuery, 'change')
      .pipe(
        map(event => event.matches),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (this._currentTheme() === 'system') {
          this.applyTheme();
        }
      });
  }
  
  /**
   * Setup effect to apply theme when it changes
   */
  private setupThemeEffect(): void {
    effect(() => {
      const theme = this._currentTheme();
      this.localStorage.setItem(this.THEME_KEY, theme);
      this.applyTheme();
    });
    
    effect(() => {
      const colors = this._customColors();
      if (Object.keys(colors).length > 0) {
        this.localStorage.setItem(this.CUSTOM_THEME_KEY, colors);
        this.applyCustomColors(colors);
      }
    });
  }
  
  /**
   * Set application theme
   */
  setTheme(theme: Theme): void {
    this._currentTheme.set(theme);
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const currentTheme = this._currentTheme();
    
    if (currentTheme === 'system') {
      const isDark = this.systemThemeQuery.matches;
      this.setTheme(isDark ? 'light' : 'dark');
    } else {
      this.setTheme(currentTheme === 'light' ? 'dark' : 'light');
    }
  }
  
  /**
   * Set custom theme colors
   */
  setCustomColors(colors: Partial<ThemeColors>): void {
    this._customColors.set({ ...this._customColors(), ...colors });
  }
  
  /**
   * Reset to default theme colors
   */
  resetColors(): void {
    this._customColors.set({});
    this.localStorage.removeItem(this.CUSTOM_THEME_KEY);
    this.removeCustomColors();
  }
  
  /**
   * Apply theme to document
   */
  private applyTheme(): void {
    const theme = this._currentTheme();
    const isDark = theme === 'dark' || 
                  (theme === 'system' && this.systemThemeQuery.matches);
    
    const body = this.document.body;
    
    // Remove existing theme classes
    body.classList.remove('light-theme', 'dark-theme');
    
    // Add new theme class
    body.classList.add(isDark ? 'dark-theme' : 'light-theme');
    
    // Update meta theme-color
    const metaThemeColor = this.document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1976d2' : '#3f51b5');
    }
    
    // Update isDarkTheme subject
    this._isDarkTheme.next(isDark);
    
    // Apply CSS variables
    this.updateCSSVariables(isDark);
  }
  
  /**
   * Update CSS variables for theme
   */
  private updateCSSVariables(isDark: boolean): void {
    const root = this.document.documentElement;
    
    if (isDark) {
      root.style.setProperty('--background-color', '#121212');
      root.style.setProperty('--surface-color', '#1e1e1e');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--text-secondary-color', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.12)');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.5)');
    } else {
      root.style.setProperty('--background-color', '#fafafa');
      root.style.setProperty('--surface-color', '#ffffff');
      root.style.setProperty('--text-color', 'rgba(0, 0, 0, 0.87)');
      root.style.setProperty('--text-secondary-color', 'rgba(0, 0, 0, 0.6)');
      root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.12)');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.2)');
    }
  }
  
  /**
   * Apply custom colors to CSS variables
   */
  private applyCustomColors(colors: Partial<ThemeColors>): void {
    const root = this.document.documentElement;
    
    Object.entries(colors).forEach(([key, value]) => {
      const cssVariable = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-color`;
      root.style.setProperty(cssVariable, value);
    });
  }
  
  /**
   * Remove custom colors from CSS variables
   */
  private removeCustomColors(): void {
    const root = this.document.documentElement;
    const customColors: (keyof ThemeColors)[] = [
      'primary', 'accent', 'warn', 'background',
      'surface', 'text', 'textSecondary', 'border', 'shadow'
    ];
    
    customColors.forEach(key => {
      const cssVariable = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-color`;
      root.style.removeProperty(cssVariable);
    });
  }
  
  /**
   * Get current theme colors
   */
  getThemeColors(): ThemeColors {
    const isDark = this._isDarkTheme.getValue();
    const custom = this._customColors();
    
    const defaultColors: ThemeColors = isDark ? {
      primary: '#3f51b5',
      accent: '#ff4081',
      warn: '#f44336',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(255, 255, 255, 0.12)',
      shadow: 'rgba(0, 0, 0, 0.5)'
    } : {
      primary: '#3f51b5',
      accent: '#ff4081',
      warn: '#f44336',
      background: '#fafafa',
      surface: '#ffffff',
      text: 'rgba(0, 0, 0, 0.87)',
      textSecondary: 'rgba(0, 0, 0, 0.6)',
      border: 'rgba(0, 0, 0, 0.12)',
      shadow: 'rgba(0, 0, 0, 0.2)'
    };
    
    return { ...defaultColors, ...custom };
  }
  
  /**
   * Prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /**
   * Get system theme preference
   */
  getSystemTheme(): 'light' | 'dark' {
    return this.systemThemeQuery.matches ? 'dark' : 'light';
  }
}
