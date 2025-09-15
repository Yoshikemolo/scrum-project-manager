import { Component, OnInit, signal, computed, inject, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';
import { debounceTime, distinctUntilChanged, switchMap, map, filter } from 'rxjs';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'user' | 'document' | 'sprint';
  title: string;
  description?: string;
  icon: string;
  route: string;
  metadata?: any;
  relevance: number;
  highlights?: string[];
}

interface SearchCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  count: number;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('staggerResults', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-10px)' }),
          stagger('30ms', [
            animate('200ms ease-out', 
              style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class SearchComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private store = inject(Store);
  private translate = inject(TranslateService);

  // Search state
  searchControl = new FormControl('');
  isSearching = signal(false);
  searchResults = signal<SearchResult[]>([]);
  recentSearches = signal<string[]>([]);
  popularSearches = signal<string[]>([]);
  selectedCategory = signal<string | null>(null);
  selectedIndex = signal(-1);
  showAdvanced = signal(false);

  // Categories
  categories = signal<SearchCategory[]>([
    { id: 'all', label: 'search.all', icon: 'search', color: 'primary', count: 0 },
    { id: 'projects', label: 'search.projects', icon: 'folder', color: 'accent', count: 0 },
    { id: 'tasks', label: 'search.tasks', icon: 'task_alt', color: 'warn', count: 0 },
    { id: 'users', label: 'search.users', icon: 'group', color: 'success', count: 0 },
    { id: 'documents', label: 'search.documents', icon: 'description', color: 'info', count: 0 },
    { id: 'sprints', label: 'search.sprints', icon: 'speed', color: 'warning', count: 0 }
  ]);

  // Advanced filters
  advancedFilters = signal({
    dateRange: { start: null, end: null },
    assignee: null,
    priority: null,
    status: null,
    tags: []
  });

  // Computed values
  filteredResults = computed(() => {
    const results = this.searchResults();
    const category = this.selectedCategory();
    
    if (!category || category === 'all') {
      return results;
    }
    
    return results.filter(r => r.type === category);
  });

  hasResults = computed(() => this.searchResults().length > 0);
  
  noResultsMessage = computed(() => {
    const query = this.searchControl.value;
    if (!query) return '';
    return this.translate.instant('search.no_results', { query });
  });

  // Search suggestions
  suggestions = signal<string[]>([
    'sprint planning',
    'user authentication',
    'database migration',
    'api documentation',
    'security audit',
    'performance optimization',
    'bug fixes',
    'feature requests'
  ]);

  // Keyboard shortcuts info
  shortcuts = signal([
    { key: '↑↓', description: 'search.shortcuts.navigate' },
    { key: 'Enter', description: 'search.shortcuts.select' },
    { key: 'Esc', description: 'search.shortcuts.close' },
    { key: 'Tab', description: 'search.shortcuts.category' },
    { key: 'Ctrl+A', description: 'search.shortcuts.advanced' }
  ]);

  ngOnInit(): void {
    this.setupSearch();
    this.loadRecentSearches();
    this.loadPopularSearches();
    this.setupKeyboardNavigation();
    
    // Focus search input
    setTimeout(() => this.searchInput.nativeElement.focus(), 100);
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        filter(query => query !== null),
        map(query => query.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => this.performSearch(query))
      )
      .subscribe(results => {
        this.searchResults.set(results);
        this.updateCategoryCounts(results);
        this.isSearching.set(false);
      });
  }

  private async performSearch(query: string): Promise<SearchResult[]> {
    if (!query) {
      return [];
    }

    this.isSearching.set(true);
    this.selectedIndex.set(-1);

    // Simulate API search with different data types
    return new Promise(resolve => {
      setTimeout(() => {
        const results = this.generateMockResults(query);
        resolve(results);
      }, 300);
    });
  }

  private generateMockResults(query: string): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Mock data generation based on query
    const mockData = [
      // Projects
      { type: 'project', title: 'E-commerce Platform', description: 'Next-gen shopping experience', icon: 'folder' },
      { type: 'project', title: 'Mobile Banking App', description: 'Secure financial transactions', icon: 'folder' },
      { type: 'project', title: 'CRM System', description: 'Customer relationship management', icon: 'folder' },
      
      // Tasks
      { type: 'task', title: 'Implement OAuth 2.0', description: 'Add social login functionality', icon: 'task_alt' },
      { type: 'task', title: 'Database Optimization', description: 'Improve query performance', icon: 'task_alt' },
      { type: 'task', title: 'UI/UX Redesign', description: 'Modern interface update', icon: 'task_alt' },
      
      // Users
      { type: 'user', title: 'John Doe', description: 'Senior Developer', icon: 'person' },
      { type: 'user', title: 'Jane Smith', description: 'Project Manager', icon: 'person' },
      { type: 'user', title: 'Mike Johnson', description: 'UX Designer', icon: 'person' },
      
      // Documents
      { type: 'document', title: 'API Documentation', description: 'REST API endpoints guide', icon: 'description' },
      { type: 'document', title: 'Security Guidelines', description: 'Best practices for security', icon: 'description' },
      
      // Sprints
      { type: 'sprint', title: 'Sprint 15', description: 'Current sprint - 5 days remaining', icon: 'speed' },
      { type: 'sprint', title: 'Sprint 14', description: 'Completed - 98% velocity', icon: 'speed' }
    ];

    // Filter and score results
    mockData.forEach(item => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const descMatch = item.description.toLowerCase().includes(lowerQuery);
      
      if (titleMatch || descMatch) {
        const relevance = titleMatch ? 100 : 50;
        const highlights = this.highlightMatches(item.title + ' ' + item.description, query);
        
        results.push({
          id: Math.random().toString(36).substr(2, 9),
          type: item.type as any,
          title: item.title,
          description: item.description,
          icon: item.icon,
          route: this.getRouteForType(item.type),
          relevance,
          highlights,
          metadata: {
            lastModified: new Date(Date.now() - Math.random() * 86400000 * 30),
            author: ['John Doe', 'Jane Smith'][Math.floor(Math.random() * 2)]
          }
        });
      }
    });

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  private highlightMatches(text: string, query: string): string[] {
    const highlights: string[] = [];
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(' ');

    words.forEach(word => {
      const index = lowerText.indexOf(word);
      if (index !== -1) {
        const start = Math.max(0, index - 20);
        const end = Math.min(text.length, index + word.length + 20);
        const highlight = text.substring(start, end);
        highlights.push(highlight);
      }
    });

    return highlights;
  }

  private getRouteForType(type: string): string {
    const routes: { [key: string]: string } = {
      project: '/projects',
      task: '/tasks',
      user: '/team',
      document: '/documents',
      sprint: '/sprints'
    };
    return routes[type] || '/';
  }

  private updateCategoryCounts(results: SearchResult[]): void {
    const categories = [...this.categories()];
    const counts: { [key: string]: number } = {
      all: results.length,
      projects: 0,
      tasks: 0,
      users: 0,
      documents: 0,
      sprints: 0
    };

    results.forEach(result => {
      counts[result.type + 's']++;
    });

    categories.forEach(cat => {
      cat.count = counts[cat.id] || 0;
    });

    this.categories.set(categories);
  }

  private loadRecentSearches(): void {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      this.recentSearches.set(JSON.parse(recent).slice(0, 5));
    }
  }

  private loadPopularSearches(): void {
    // Load from backend or use predefined
    this.popularSearches.set([
      'dashboard',
      'my tasks',
      'sprint review',
      'bug reports',
      'team members'
    ]);
  }

  private saveRecentSearch(query: string): void {
    if (!query) return;
    
    const recent = [...this.recentSearches()];
    const index = recent.indexOf(query);
    
    if (index > -1) {
      recent.splice(index, 1);
    }
    
    recent.unshift(query);
    const updated = recent.slice(0, 10);
    
    this.recentSearches.set(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }

  private setupKeyboardNavigation(): void {
    this.searchInput.nativeElement.addEventListener('keydown', (event) => {
      const results = this.filteredResults();
      const currentIndex = this.selectedIndex();

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.selectedIndex.set(Math.min(currentIndex + 1, results.length - 1));
          this.scrollToSelected();
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          this.selectedIndex.set(Math.max(currentIndex - 1, -1));
          this.scrollToSelected();
          break;
          
        case 'Enter':
          event.preventDefault();
          if (currentIndex >= 0 && currentIndex < results.length) {
            this.selectResult(results[currentIndex]);
          } else if (this.searchControl.value) {
            this.performGlobalSearch();
          }
          break;
          
        case 'Escape':
          event.preventDefault();
          this.close.emit();
          break;
          
        case 'Tab':
          event.preventDefault();
          this.nextCategory();
          break;
      }

      // Ctrl/Cmd + A for advanced filters
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        this.toggleAdvanced();
      }
    });
  }

  private scrollToSelected(): void {
    const index = this.selectedIndex();
    if (index >= 0) {
      const element = document.querySelector(`.search-result:nth-child(${index + 1})`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  selectResult(result: SearchResult): void {
    this.saveRecentSearch(this.searchControl.value || '');
    this.router.navigate([result.route, result.id]);
    this.close.emit();
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId === this.selectedCategory() ? null : categoryId);
    this.selectedIndex.set(-1);
  }

  nextCategory(): void {
    const categories = this.categories();
    const current = this.selectedCategory();
    const currentIndex = categories.findIndex(c => c.id === current);
    const nextIndex = (currentIndex + 1) % categories.length;
    this.selectCategory(categories[nextIndex].id);
  }

  performQuickSearch(query: string): void {
    this.searchControl.setValue(query);
  }

  performGlobalSearch(): void {
    const query = this.searchControl.value;
    if (query) {
      this.saveRecentSearch(query);
      this.router.navigate(['/search'], { queryParams: { q: query } });
      this.close.emit();
    }
  }

  toggleAdvanced(): void {
    this.showAdvanced.update(show => !show);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchResults.set([]);
    this.selectedIndex.set(-1);
    this.selectedCategory.set(null);
    this.searchInput.nativeElement.focus();
  }

  clearRecentSearches(): void {
    this.recentSearches.set([]);
    localStorage.removeItem('recentSearches');
  }

  applyAdvancedFilter(filterType: string, value: any): void {
    const filters = { ...this.advancedFilters() };
    // Apply filter logic
    this.advancedFilters.set(filters);
    // Re-run search with filters
    this.performSearch(this.searchControl.value || '');
  }

  getIconForType(type: string): string {
    const icons: { [key: string]: string } = {
      project: 'folder',
      task: 'task_alt',
      user: 'person',
      document: 'description',
      sprint: 'speed'
    };
    return icons[type] || 'search';
  }

  getColorForType(type: string): string {
    const colors: { [key: string]: string } = {
      project: 'primary',
      task: 'accent',
      user: 'warn',
      document: 'success',
      sprint: 'info'
    };
    return colors[type] || 'primary';
  }

  formatDate(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }
}