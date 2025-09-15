# Dashboard Module Documentation

## Overview

The Dashboard module provides a comprehensive, customizable interface for users to monitor project metrics, track progress, and access key information at a glance. Built with Angular 20 standalone components and featuring a widget-based architecture.

## Architecture

### Module Structure

```
app/features/dashboard/
├── dashboard.component.ts       # Main dashboard container
├── dashboard.component.html     # Dashboard template
├── dashboard.component.scss     # Dashboard styles
├── dashboard.routes.ts          # Routing configuration
├── services/
│   └── dashboard.service.ts     # Data management service
├── widgets/                     # Widget components
│   ├── stats-widget/
│   ├── sprint-progress-widget/
│   ├── tasks-widget/
│   ├── team-activity-widget/
│   ├── charts-widget/
│   ├── calendar-widget/
│   ├── recent-activity-widget/
│   └── weather-widget/
├── models/                      # TypeScript interfaces
├── store/                       # NgRx state management
└── pages/                       # Sub-pages
    ├── analytics/
    └── reports/
```

## Core Components

### DashboardComponent

The main container component that manages widget layout and orchestration.

#### Features

- **Widget Management**: Add, remove, configure widgets
- **Layout Modes**: Grid, list, compact, custom views
- **Drag & Drop**: Reorder widgets with mouse or touch
- **Search**: Filter widgets by name or type
- **Edit Mode**: Customize dashboard layout
- **Import/Export**: Save and load configurations
- **Responsive**: Adapts to all screen sizes
- **Keyboard Shortcuts**: Quick actions support

#### Configuration

```typescript
interface WidgetConfig {
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
```

### DashboardService

Manages dashboard data and real-time updates.

#### Methods

- `loadDashboardData()`: Fetch all dashboard data
- `loadStats()`: Load key metrics
- `loadSprintProgress()`: Get sprint information
- `loadTasks()`: Fetch user tasks
- `loadTeamActivity()`: Get team status
- `loadActivityFeed()`: Load recent activities
- `getChartData()`: Generate chart datasets

#### Real-time Updates

The service listens for WebSocket events:
- `dashboard:stats:update`
- `task:update`
- `activity:new`
- `team:status:update`

## Widgets

### Stats Widget

Displays key performance indicators and metrics.

**Data Points:**
- Total/Active Projects
- Total/Completed Tasks
- Sprint Velocity
- Team Productivity Score

### Sprint Progress Widget

Shows current sprint status with burndown chart.

**Features:**
- Sprint timeline
- Points completed/remaining
- Burndown visualization
- Days remaining indicator

### Tasks Widget

Lists user's assigned tasks with quick actions.

**Features:**
- Task filtering by status
- Priority indicators
- Due date warnings
- Quick status updates

### Team Activity Widget

Displays team member status and activity.

**Information:**
- Online/offline status
- Current task assignment
- Productivity metrics
- Last activity time

### Charts Widget

Provides data visualizations for various metrics.

**Chart Types:**
- Burndown charts
- Velocity trends
- Task distribution
- Productivity analysis

### Calendar Widget

Shows upcoming events and deadlines.

**Event Types:**
- Sprint milestones
- Task deadlines
- Team meetings
- Release dates

### Recent Activity Widget

Displays a feed of recent project activities.

**Activity Types:**
- Task updates
- Comments
- Sprint changes
- Team actions

### Weather Widget

Optional widget showing weather information.

## Layout System

### Grid Layout

Default responsive grid with automatic sizing.

```scss
.dashboard__grid--grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}
```

### Size Classes

- **Small**: 1x1 grid cells
- **Medium**: 1x2 grid cells
- **Large**: 2x2 grid cells
- **Full**: Full width

### Responsive Behavior

- **Desktop**: Full grid layout
- **Tablet**: 2-column layout
- **Mobile**: Single column

## State Management

### Local State

```typescript
// Widget visibility and configuration
widgets = signal<WidgetConfig[]>([...]);

// UI state
isLoading = signal(true);
isEditMode = signal(false);
layout = signal<DashboardLayout>('grid');
```

### Persistent State

User preferences saved to localStorage:
- Layout preference
- Widget visibility
- Widget positions
- Custom settings

## Data Flow

### Initial Load

1. Component initialization
2. Load user preferences
3. Fetch dashboard data
4. Initialize widgets
5. Setup auto-refresh

### Real-time Updates

1. WebSocket connection established
2. Subscribe to relevant events
3. Update specific widget data
4. Trigger change detection

### Auto-refresh

- Stats: Every 60 seconds
- Sprint Progress: Every 30 seconds
- Tasks: Every 45 seconds
- Team Activity: Every 60 seconds

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+R | Refresh all widgets |
| Ctrl+E | Toggle edit mode |
| Ctrl+L | Cycle layout mode |
| Ctrl+F | Focus search |
| ESC | Exit fullscreen widget |

## Performance Optimization

### Strategies

1. **Lazy Loading**: Widgets loaded on demand
2. **Virtual Scrolling**: For list widgets
3. **Memoization**: Computed values cached
4. **Debouncing**: Search and filter operations
5. **OnPush Strategy**: Change detection optimization

### Metrics

- Initial render: <500ms
- Widget refresh: <200ms
- Drag operation: 60fps
- Memory usage: <50MB

## Customization

### Adding New Widgets

1. Create widget component
2. Register in widget configuration
3. Add to widget gallery
4. Define refresh logic

### Widget API

```typescript
interface Widget {
  onInit(): void;
  onRefresh(): void;
  onDestroy(): void;
  configure(settings: any): void;
}
```

## Security Considerations

### Data Access

- User-specific data filtering
- Role-based widget visibility
- Secure WebSocket connections
- API token refresh handling

### Configuration Export

- No sensitive data in exports
- Validation on import
- User confirmation required

## Testing

### Unit Tests

```typescript
describe('DashboardComponent', () => {
  // Component initialization
  // Widget management
  // Layout switching
  // Drag and drop
});

describe('DashboardService', () => {
  // Data loading
  // WebSocket handling
  // Chart generation
  // Error handling
});
```

### Integration Tests

- Widget interaction
- Real-time updates
- Configuration persistence
- Error recovery

## Troubleshooting

### Common Issues

1. **Widgets not loading**
   - Check network connection
   - Verify API endpoints
   - Review console errors

2. **Layout issues**
   - Clear localStorage
   - Reset to default layout
   - Check browser compatibility

3. **Performance problems**
   - Reduce refresh intervals
   - Limit visible widgets
   - Check memory usage

## Future Enhancements

### Planned Features

1. Custom widget development SDK
2. AI-powered insights
3. Predictive analytics
4. Advanced filtering
5. Widget marketplace
6. Collaborative dashboards
7. Mobile app integration
8. Export to PDF/Excel

### Technical Improvements

1. Server-side rendering
2. WebAssembly for charts
3. IndexedDB for offline
4. Service Worker caching
5. GraphQL subscriptions

## API Reference

### GraphQL Queries

```graphql
query GetDashboardStats {
  dashboardStats {
    totalProjects
    activeProjects
    totalTasks
    completedTasks
    velocity
    productivityScore
  }
}

query GetSprintProgress($sprintId: ID) {
  sprintProgress(sprintId: $sprintId) {
    sprintName
    progress
    daysRemaining
    burndown {
      date
      ideal
      actual
    }
  }
}
```

### WebSocket Events

```typescript
// Subscribe to updates
websocket.on('dashboard:stats:update', (data) => {});
websocket.on('task:update', (data) => {});
websocket.on('activity:new', (data) => {});
```

## Related Documentation

- [Frontend Architecture](./FRONTEND_STRUCTURE.md)
- [State Management](./STATE_MANAGEMENT.md)
- [WebSocket Integration](./WEBSOCKET.md)
- [Testing Guide](./TESTING.md)

---

Last updated: September 12, 2025
