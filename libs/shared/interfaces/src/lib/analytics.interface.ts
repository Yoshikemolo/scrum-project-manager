/**
 * Analytics related interfaces
 */

import { IUser } from './user.interface';
import { IProject } from './project.interface';
import { ISprint } from './sprint.interface';
import { ITask } from './task.interface';

export interface IAnalyticsDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: IWidget[];
  layout: ILayoutConfig;
  filters: IFilterConfig;
  owner: IUser;
  isPublic: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  dataSource: string;
  config: IWidgetConfig;
  position: IPosition;
  size: ISize;
  refreshInterval?: number; // seconds
}

export enum WidgetType {
  CHART = 'CHART',
  TABLE = 'TABLE',
  METRIC = 'METRIC',
  GAUGE = 'GAUGE',
  MAP = 'MAP',
  TIMELINE = 'TIMELINE',
  HEATMAP = 'HEATMAP',
  FUNNEL = 'FUNNEL',
  SANKEY = 'SANKEY',
  TREEMAP = 'TREEMAP',
  CUSTOM = 'CUSTOM'
}

export interface IWidgetConfig {
  chartType?: ChartType;
  metrics: string[];
  dimensions?: string[];
  filters?: IFilter[];
  sorting?: ISorting[];
  groupBy?: string[];
  aggregation?: AggregationType;
  timeRange?: ITimeRange;
  comparison?: IComparison;
  visualization?: IVisualizationOptions;
  thresholds?: IThreshold[];
  targets?: ITarget[];
}

export enum ChartType {
  LINE = 'LINE',
  BAR = 'BAR',
  PIE = 'PIE',
  DONUT = 'DONUT',
  AREA = 'AREA',
  SCATTER = 'SCATTER',
  BUBBLE = 'BUBBLE',
  RADAR = 'RADAR',
  POLAR = 'POLAR',
  COMBO = 'COMBO'
}

export enum AggregationType {
  SUM = 'SUM',
  AVG = 'AVG',
  MIN = 'MIN',
  MAX = 'MAX',
  COUNT = 'COUNT',
  DISTINCT = 'DISTINCT',
  MEDIAN = 'MEDIAN',
  PERCENTILE = 'PERCENTILE',
  STDDEV = 'STDDEV'
}

export interface IPosition {
  x: number;
  y: number;
}

export interface ISize {
  width: number;
  height: number;
}

export interface ILayoutConfig {
  type: 'grid' | 'flex' | 'absolute';
  columns?: number;
  rows?: number;
  gap?: number;
  padding?: number;
}

export interface IFilterConfig {
  global: IFilter[];
  dateRange: ITimeRange;
  projects?: string[];
  teams?: string[];
  users?: string[];
}

export interface IFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  dataType?: string;
}

export enum FilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  BETWEEN = 'BETWEEN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL'
}

export interface ISorting {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ITimeRange {
  type: 'absolute' | 'relative' | 'rolling';
  start?: Date;
  end?: Date;
  period?: string; // e.g., 'last_7_days', 'this_month', 'last_quarter'
  unit?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  value?: number;
}

export interface IComparison {
  enabled: boolean;
  type: 'period' | 'target' | 'benchmark';
  value?: any;
}

export interface IVisualizationOptions {
  colors?: string[];
  legend?: ILegendOptions;
  axis?: IAxisOptions;
  labels?: ILabelOptions;
  tooltip?: ITooltipOptions;
  animation?: boolean;
}

export interface ILegendOptions {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
}

export interface IAxisOptions {
  x?: {
    show: boolean;
    label?: string;
    type?: 'category' | 'value' | 'time';
    format?: string;
  };
  y?: {
    show: boolean;
    label?: string;
    type?: 'category' | 'value';
    format?: string;
    min?: number;
    max?: number;
  };
}

export interface ILabelOptions {
  show: boolean;
  format?: string;
  position?: 'inside' | 'outside' | 'center';
}

export interface ITooltipOptions {
  show: boolean;
  format?: string;
  shared?: boolean;
}

export interface IThreshold {
  value: number;
  color: string;
  label?: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
}

export interface ITarget {
  value: number;
  label: string;
  color?: string;
}

export interface IAnalyticsReport {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  schedule?: IReportSchedule;
  recipients?: string[];
  config: IReportConfig;
  lastGenerated?: Date;
  nextGeneration?: Date;
  owner: IUser;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReportType {
  PERFORMANCE = 'PERFORMANCE',
  VELOCITY = 'VELOCITY',
  BURNDOWN = 'BURNDOWN',
  BURNUP = 'BURNUP',
  CUMULATIVE_FLOW = 'CUMULATIVE_FLOW',
  CYCLE_TIME = 'CYCLE_TIME',
  LEAD_TIME = 'LEAD_TIME',
  THROUGHPUT = 'THROUGHPUT',
  CUSTOM = 'CUSTOM'
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  HTML = 'HTML',
  JSON = 'JSON'
}

export interface IReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:mm format
  timezone: string;
}

export interface IReportConfig {
  widgets: string[];
  filters: IFilterConfig;
  template?: string;
  includeCharts: boolean;
  includeRawData: boolean;
  includeSummary: boolean;
}

export interface IMetric {
  id: string;
  name: string;
  description?: string;
  formula: string;
  unit?: string;
  category: string;
  tags?: string[];
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKPI {
  id: string;
  name: string;
  description?: string;
  metric: IMetric;
  target: number;
  actual: number;
  trend: 'up' | 'down' | 'stable';
  status: 'on_track' | 'at_risk' | 'off_track';
  period: ITimeRange;
  owner?: IUser;
  updatedAt: Date;
}

export interface IAnalyticsEvent {
  id: string;
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId: string;
  properties?: Record<string, any>;
  timestamp: Date;
}
