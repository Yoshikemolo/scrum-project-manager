/**
 * Dashboard Service
 * Manages dashboard data and widget states
 */
import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, interval, combineLatest, BehaviorSubject } from 'rxjs';
import { map, catchError, shareReplay, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { Apollo, gql } from 'apollo-angular';
import { WebSocketService } from '../../../core/services/websocket.service';

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalSprints: number;
  activeSprints: number;
  teamMembers: number;
  velocity: number;
  burndownRate: number;
  productivityScore: number;
}

/**
 * Sprint progress data
 */
export interface SprintProgress {
  sprintId: string;
  sprintName: string;
  startDate: Date;
  endDate: Date;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  progress: number;
  daysRemaining: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  burndown: Array<{ date: string; ideal: number; actual: number }>;
}

/**
 * Task item
 */
export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: {
    id: string;
    name: string;
    avatar: string;
  };
  dueDate: Date;
  storyPoints: number;
  tags: string[];
  progress: number;
}

/**
 * Team member activity
 */
export interface TeamActivity {
  memberId: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentTask: string;
  tasksCompleted: number;
  tasksInProgress: number;
  lastActivity: Date;
  productivity: number;
}

/**
 * Activity feed item
 */
export interface ActivityItem {
  id: string;
  type: 'task' | 'comment' | 'sprint' | 'project' | 'user';
  action: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  target: {
    id: string;
    type: string;
    name: string;
  };
  timestamp: Date;
  details?: any;
}

/**
 * Calendar event
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'deadline' | 'sprint' | 'release' | 'holiday';
  color: string;
  participants?: Array<{ id: string; name: string; avatar: string }>;
  location?: string;
  description?: string;
}

/**
 * Chart data point
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }>;
}

// GraphQL Queries
const DASHBOARD_STATS_QUERY = gql`
  query GetDashboardStats {
    dashboardStats {
      totalProjects
      activeProjects
      totalTasks
      completedTasks
      totalSprints
      activeSprints
      teamMembers
      velocity
      burndownRate
      productivityScore
    }
  }
`;

const SPRINT_PROGRESS_QUERY = gql`
  query GetSprintProgress($sprintId: ID) {
    sprintProgress(sprintId: $sprintId) {
      sprintId
      sprintName
      startDate
      endDate
      totalPoints
      completedPoints
      remainingPoints
      progress
      daysRemaining
      status
      burndown {
        date
        ideal
        actual
      }
    }
  }
`;

const MY_TASKS_QUERY = gql`
  query GetMyTasks($status: String, $limit: Int) {
    myTasks(status: $status, limit: $limit) {
      id
      title
      description
      status
      priority
      assignee {
        id
        name
        avatar
      }
      dueDate
      storyPoints
      tags
      progress
    }
  }
`;

const TEAM_ACTIVITY_QUERY = gql`
  query GetTeamActivity {
    teamActivity {
      memberId
      name
      avatar
      status
      currentTask
      tasksCompleted
      tasksInProgress
      lastActivity
      productivity
    }
  }
`;

const ACTIVITY_FEED_QUERY = gql`
  query GetActivityFeed($limit: Int) {
    activityFeed(limit: $limit) {
      id
      type
      action
      user {
        id
        name
        avatar
      }
      target {
        id
        type
        name
      }
      timestamp
      details
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // State management
  private stats$ = new BehaviorSubject<DashboardStats | null>(null);
  private sprintProgress$ = new BehaviorSubject<SprintProgress | null>(null);
  private tasks$ = new BehaviorSubject<TaskItem[]>([]);
  private teamActivity$ = new BehaviorSubject<TeamActivity[]>([]);
  private activityFeed$ = new BehaviorSubject<ActivityItem[]>([]);
  private calendarEvents$ = new BehaviorSubject<CalendarEvent[]>([]);
  
  // Loading states
  public isLoadingStats = signal(false);
  public isLoadingSprint = signal(false);
  public isLoadingTasks = signal(false);
  public isLoadingTeam = signal(false);
  public isLoadingActivity = signal(false);
  
  // Error states
  public statsError = signal<string | null>(null);
  public sprintError = signal<string | null>(null);
  public tasksError = signal<string | null>(null);
  
  // Computed values
  public tasksByStatus = computed(() => {
    const tasks = this.tasks$.value;
    return {
      todo: tasks.filter(t => t.status === 'todo'),
      inProgress: tasks.filter(t => t.status === 'in-progress'),
      review: tasks.filter(t => t.status === 'review'),
      done: tasks.filter(t => t.status === 'done')
    };
  });
  
  public onlineTeamMembers = computed(() => {
    return this.teamActivity$.value.filter(m => m.status === 'online').length;
  });
  
  public upcomingDeadlines = computed(() => {
    const tasks = this.tasks$.value;
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter(t => t.dueDate && new Date(t.dueDate) <= weekFromNow)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  });
  
  constructor(
    private apollo: Apollo,
    private websocket: WebSocketService
  ) {
    this.setupWebSocketListeners();
    this.setupAutoRefresh();
  }
  
  /**
   * Setup WebSocket listeners for real-time updates
   */
  private setupWebSocketListeners(): void {
    // Listen for stats updates
    this.websocket.on<DashboardStats>('dashboard:stats:update')
      .subscribe(stats => {
        this.stats$.next(stats);
      });
    
    // Listen for task updates
    this.websocket.on<TaskItem>('task:update')
      .subscribe(task => {
        const tasks = [...this.tasks$.value];
        const index = tasks.findIndex(t => t.id === task.id);
        if (index >= 0) {
          tasks[index] = task;
        } else {
          tasks.push(task);
        }
        this.tasks$.next(tasks);
      });
    
    // Listen for activity updates
    this.websocket.on<ActivityItem>('activity:new')
      .subscribe(activity => {
        const activities = [activity, ...this.activityFeed$.value].slice(0, 50);
        this.activityFeed$.next(activities);
      });
    
    // Listen for team status updates
    this.websocket.on<TeamActivity>('team:status:update')
      .subscribe(member => {
        const team = [...this.teamActivity$.value];
        const index = team.findIndex(m => m.memberId === member.memberId);
        if (index >= 0) {
          team[index] = member;
          this.teamActivity$.next(team);
        }
      });
  }
  
  /**
   * Setup auto-refresh intervals
   */
  private setupAutoRefresh(): void {
    // Refresh stats every minute
    interval(60000).subscribe(() => {
      this.loadStats();
    });
    
    // Refresh sprint progress every 30 seconds
    interval(30000).subscribe(() => {
      this.loadSprintProgress();
    });
    
    // Refresh tasks every 45 seconds
    interval(45000).subscribe(() => {
      this.loadTasks();
    });
  }
  
  /**
   * Load all dashboard data
   */
  public loadDashboardData(): Observable<any> {
    return combineLatest([
      this.loadStats(),
      this.loadSprintProgress(),
      this.loadTasks(),
      this.loadTeamActivity(),
      this.loadActivityFeed()
    ]).pipe(
      map(([stats, sprint, tasks, team, activity]) => ({
        stats,
        sprint,
        tasks,
        team,
        activity
      })),
      catchError(error => {
        console.error('Error loading dashboard data:', error);
        return of(null);
      })
    );
  }
  
  /**
   * Load dashboard statistics
   */
  public loadStats(): Observable<DashboardStats> {
    this.isLoadingStats.set(true);
    this.statsError.set(null);
    
    // Simulated data for now
    const mockStats: DashboardStats = {
      totalProjects: 12,
      activeProjects: 8,
      totalTasks: 247,
      completedTasks: 156,
      totalSprints: 24,
      activeSprints: 3,
      teamMembers: 15,
      velocity: 42,
      burndownRate: 0.78,
      productivityScore: 85
    };
    
    return of(mockStats).pipe(
      map(stats => {
        this.stats$.next(stats);
        this.isLoadingStats.set(false);
        return stats;
      }),
      catchError(error => {
        this.statsError.set('Failed to load statistics');
        this.isLoadingStats.set(false);
        return of(mockStats);
      })
    );
  }
  
  /**
   * Load sprint progress
   */
  public loadSprintProgress(sprintId?: string): Observable<SprintProgress> {
    this.isLoadingSprint.set(true);
    this.sprintError.set(null);
    
    // Simulated data
    const mockProgress: SprintProgress = {
      sprintId: 'sprint-1',
      sprintName: 'Sprint 24',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-14'),
      totalPoints: 120,
      completedPoints: 78,
      remainingPoints: 42,
      progress: 65,
      daysRemaining: 2,
      status: 'in-progress',
      burndown: [
        { date: '2025-09-01', ideal: 120, actual: 120 },
        { date: '2025-09-02', ideal: 110, actual: 115 },
        { date: '2025-09-03', ideal: 100, actual: 108 },
        { date: '2025-09-04', ideal: 90, actual: 95 },
        { date: '2025-09-05', ideal: 80, actual: 88 },
        { date: '2025-09-08', ideal: 70, actual: 82 },
        { date: '2025-09-09', ideal: 60, actual: 78 },
        { date: '2025-09-10', ideal: 50, actual: 72 },
        { date: '2025-09-11', ideal: 40, actual: 65 },
        { date: '2025-09-12', ideal: 30, actual: 42 }
      ]
    };
    
    return of(mockProgress).pipe(
      map(progress => {
        this.sprintProgress$.next(progress);
        this.isLoadingSprint.set(false);
        return progress;
      }),
      catchError(error => {
        this.sprintError.set('Failed to load sprint progress');
        this.isLoadingSprint.set(false);
        return of(mockProgress);
      })
    );
  }
  
  /**
   * Load user tasks
   */
  public loadTasks(status?: string, limit = 20): Observable<TaskItem[]> {
    this.isLoadingTasks.set(true);
    this.tasksError.set(null);
    
    // Simulated data
    const mockTasks: TaskItem[] = [
      {
        id: 'task-1',
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication to the API',
        status: 'in-progress',
        priority: 'high',
        assignee: {
          id: 'user-1',
          name: 'John Doe',
          avatar: 'https://i.pravatar.cc/150?img=1'
        },
        dueDate: new Date('2025-09-13'),
        storyPoints: 8,
        tags: ['backend', 'security'],
        progress: 65
      },
      {
        id: 'task-2',
        title: 'Design dashboard wireframes',
        description: 'Create wireframes for the new dashboard',
        status: 'review',
        priority: 'medium',
        assignee: {
          id: 'user-2',
          name: 'Jane Smith',
          avatar: 'https://i.pravatar.cc/150?img=2'
        },
        dueDate: new Date('2025-09-14'),
        storyPoints: 5,
        tags: ['design', 'ui'],
        progress: 90
      },
      {
        id: 'task-3',
        title: 'Write unit tests',
        description: 'Add unit tests for the core services',
        status: 'todo',
        priority: 'medium',
        assignee: {
          id: 'user-1',
          name: 'John Doe',
          avatar: 'https://i.pravatar.cc/150?img=1'
        },
        dueDate: new Date('2025-09-15'),
        storyPoints: 3,
        tags: ['testing', 'quality'],
        progress: 0
      },
      {
        id: 'task-4',
        title: 'Optimize database queries',
        description: 'Improve performance of slow queries',
        status: 'in-progress',
        priority: 'critical',
        assignee: {
          id: 'user-3',
          name: 'Bob Johnson',
          avatar: 'https://i.pravatar.cc/150?img=3'
        },
        dueDate: new Date('2025-09-12'),
        storyPoints: 13,
        tags: ['backend', 'performance'],
        progress: 40
      },
      {
        id: 'task-5',
        title: 'Update documentation',
        description: 'Update API documentation with new endpoints',
        status: 'done',
        priority: 'low',
        assignee: {
          id: 'user-1',
          name: 'John Doe',
          avatar: 'https://i.pravatar.cc/150?img=1'
        },
        dueDate: new Date('2025-09-11'),
        storyPoints: 2,
        tags: ['documentation'],
        progress: 100
      }
    ];
    
    return of(mockTasks).pipe(
      map(tasks => {
        const filteredTasks = status 
          ? tasks.filter(t => t.status === status)
          : tasks;
        
        this.tasks$.next(filteredTasks.slice(0, limit));
        this.isLoadingTasks.set(false);
        return filteredTasks;
      }),
      catchError(error => {
        this.tasksError.set('Failed to load tasks');
        this.isLoadingTasks.set(false);
        return of([]);
      })
    );
  }
  
  /**
   * Load team activity
   */
  public loadTeamActivity(): Observable<TeamActivity[]> {
    this.isLoadingTeam.set(true);
    
    // Simulated data
    const mockTeam: TeamActivity[] = [
      {
        memberId: 'user-1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?img=1',
        status: 'online',
        currentTask: 'Implement user authentication',
        tasksCompleted: 12,
        tasksInProgress: 3,
        lastActivity: new Date(),
        productivity: 92
      },
      {
        memberId: 'user-2',
        name: 'Jane Smith',
        avatar: 'https://i.pravatar.cc/150?img=2',
        status: 'online',
        currentTask: 'Design dashboard wireframes',
        tasksCompleted: 18,
        tasksInProgress: 2,
        lastActivity: new Date(),
        productivity: 88
      },
      {
        memberId: 'user-3',
        name: 'Bob Johnson',
        avatar: 'https://i.pravatar.cc/150?img=3',
        status: 'away',
        currentTask: 'Optimize database queries',
        tasksCompleted: 8,
        tasksInProgress: 4,
        lastActivity: new Date(Date.now() - 30 * 60 * 1000),
        productivity: 75
      },
      {
        memberId: 'user-4',
        name: 'Alice Brown',
        avatar: 'https://i.pravatar.cc/150?img=4',
        status: 'offline',
        currentTask: '',
        tasksCompleted: 15,
        tasksInProgress: 1,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
        productivity: 80
      }
    ];
    
    return of(mockTeam).pipe(
      map(team => {
        this.teamActivity$.next(team);
        this.isLoadingTeam.set(false);
        return team;
      })
    );
  }
  
  /**
   * Load activity feed
   */
  public loadActivityFeed(limit = 20): Observable<ActivityItem[]> {
    this.isLoadingActivity.set(true);
    
    // Simulated data
    const mockActivity: ActivityItem[] = [
      {
        id: 'activity-1',
        type: 'task',
        action: 'completed',
        user: {
          id: 'user-1',
          name: 'John Doe',
          avatar: 'https://i.pravatar.cc/150?img=1'
        },
        target: {
          id: 'task-5',
          type: 'task',
          name: 'Update documentation'
        },
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        details: { storyPoints: 2 }
      },
      {
        id: 'activity-2',
        type: 'comment',
        action: 'added',
        user: {
          id: 'user-2',
          name: 'Jane Smith',
          avatar: 'https://i.pravatar.cc/150?img=2'
        },
        target: {
          id: 'task-2',
          type: 'task',
          name: 'Design dashboard wireframes'
        },
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        details: { comment: 'Looks good! Ready for review.' }
      },
      {
        id: 'activity-3',
        type: 'sprint',
        action: 'started',
        user: {
          id: 'user-3',
          name: 'Bob Johnson',
          avatar: 'https://i.pravatar.cc/150?img=3'
        },
        target: {
          id: 'sprint-24',
          type: 'sprint',
          name: 'Sprint 24'
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        details: { duration: '2 weeks' }
      },
      {
        id: 'activity-4',
        type: 'task',
        action: 'assigned',
        user: {
          id: 'user-1',
          name: 'John Doe',
          avatar: 'https://i.pravatar.cc/150?img=1'
        },
        target: {
          id: 'task-3',
          type: 'task',
          name: 'Write unit tests'
        },
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        details: { assignee: 'John Doe' }
      },
      {
        id: 'activity-5',
        type: 'project',
        action: 'updated',
        user: {
          id: 'user-4',
          name: 'Alice Brown',
          avatar: 'https://i.pravatar.cc/150?img=4'
        },
        target: {
          id: 'project-1',
          type: 'project',
          name: 'SCRUM Manager'
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        details: { field: 'description' }
      }
    ];
    
    return of(mockActivity).pipe(
      map(activity => {
        this.activityFeed$.next(activity.slice(0, limit));
        this.isLoadingActivity.set(false);
        return activity;
      })
    );
  }
  
  /**
   * Load calendar events
   */
  public loadCalendarEvents(start: Date, end: Date): Observable<CalendarEvent[]> {
    // Simulated data
    const mockEvents: CalendarEvent[] = [
      {
        id: 'event-1',
        title: 'Sprint Planning',
        start: new Date('2025-09-14T10:00:00'),
        end: new Date('2025-09-14T11:30:00'),
        type: 'meeting',
        color: '#2196f3',
        participants: [
          { id: 'user-1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' },
          { id: 'user-2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' }
        ],
        location: 'Conference Room A'
      },
      {
        id: 'event-2',
        title: 'Sprint 24 Ends',
        start: new Date('2025-09-14T00:00:00'),
        end: new Date('2025-09-14T23:59:59'),
        type: 'sprint',
        color: '#4caf50'
      },
      {
        id: 'event-3',
        title: 'Release v2.0',
        start: new Date('2025-09-20T00:00:00'),
        end: new Date('2025-09-20T23:59:59'),
        type: 'release',
        color: '#ff9800'
      },
      {
        id: 'event-4',
        title: 'Daily Standup',
        start: new Date('2025-09-13T09:00:00'),
        end: new Date('2025-09-13T09:15:00'),
        type: 'meeting',
        color: '#2196f3',
        participants: [
          { id: 'user-1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' },
          { id: 'user-2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' },
          { id: 'user-3', name: 'Bob Johnson', avatar: 'https://i.pravatar.cc/150?img=3' },
          { id: 'user-4', name: 'Alice Brown', avatar: 'https://i.pravatar.cc/150?img=4' }
        ]
      }
    ];
    
    return of(mockEvents).pipe(
      map(events => {
        const filtered = events.filter(e => 
          e.start >= start && e.start <= end
        );
        this.calendarEvents$.next(filtered);
        return filtered;
      })
    );
  }
  
  /**
   * Get chart data for various metrics
   */
  public getChartData(type: string): Observable<ChartData> {
    switch (type) {
      case 'burndown':
        return this.getBurndownChartData();
      case 'velocity':
        return this.getVelocityChartData();
      case 'tasks':
        return this.getTasksChartData();
      case 'productivity':
        return this.getProductivityChartData();
      default:
        return of({ labels: [], datasets: [] });
    }
  }
  
  /**
   * Get burndown chart data
   */
  private getBurndownChartData(): Observable<ChartData> {
    const sprint = this.sprintProgress$.value;
    if (!sprint) {
      return of({ labels: [], datasets: [] });
    }
    
    return of({
      labels: sprint.burndown.map(d => d.date),
      datasets: [
        {
          label: 'Ideal',
          data: sprint.burndown.map(d => d.ideal),
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: false
        },
        {
          label: 'Actual',
          data: sprint.burndown.map(d => d.actual),
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: false
        }
      ]
    });
  }
  
  /**
   * Get velocity chart data
   */
  private getVelocityChartData(): Observable<ChartData> {
    return of({
      labels: ['Sprint 20', 'Sprint 21', 'Sprint 22', 'Sprint 23', 'Sprint 24'],
      datasets: [
        {
          label: 'Committed',
          data: [45, 52, 48, 55, 50],
          backgroundColor: 'rgba(33, 150, 243, 0.6)'
        },
        {
          label: 'Completed',
          data: [42, 48, 45, 52, 42],
          backgroundColor: 'rgba(76, 175, 80, 0.6)'
        }
      ]
    });
  }
  
  /**
   * Get tasks chart data
   */
  private getTasksChartData(): Observable<ChartData> {
    const tasks = this.tasksByStatus();
    
    return of({
      labels: ['To Do', 'In Progress', 'Review', 'Done'],
      datasets: [
        {
          label: 'Tasks',
          data: [
            tasks.todo.length,
            tasks.inProgress.length,
            tasks.review.length,
            tasks.done.length
          ],
          backgroundColor: [
            'rgba(158, 158, 158, 0.6)',
            'rgba(33, 150, 243, 0.6)',
            'rgba(255, 152, 0, 0.6)',
            'rgba(76, 175, 80, 0.6)'
          ]
        }
      ]
    });
  }
  
  /**
   * Get productivity chart data
   */
  private getProductivityChartData(): Observable<ChartData> {
    const team = this.teamActivity$.value;
    
    return of({
      labels: team.map(m => m.name),
      datasets: [
        {
          label: 'Productivity %',
          data: team.map(m => m.productivity),
          backgroundColor: 'rgba(156, 39, 176, 0.6)',
          borderColor: 'rgba(156, 39, 176, 1)'
        }
      ]
    });
  }
  
  /**
   * Get observable streams
   */
  public get stats$(): Observable<DashboardStats | null> {
    return this.stats$.asObservable();
  }
  
  public get sprintProgress$(): Observable<SprintProgress | null> {
    return this.sprintProgress$.asObservable();
  }
  
  public get tasks$(): Observable<TaskItem[]> {
    return this.tasks$.asObservable();
  }
  
  public get teamActivity$(): Observable<TeamActivity[]> {
    return this.teamActivity$.asObservable();
  }
  
  public get activityFeed$(): Observable<ActivityItem[]> {
    return this.activityFeed$.asObservable();
  }
  
  public get calendarEvents$(): Observable<CalendarEvent[]> {
    return this.calendarEvents$.asObservable();
  }
}
