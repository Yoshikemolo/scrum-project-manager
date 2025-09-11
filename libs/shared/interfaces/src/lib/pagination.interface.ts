export interface IPaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface IPaginationResponse<T> {
  items: T[];
  meta: IPaginationMeta;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ICursorPaginationRequest {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface ICursorPaginationResponse<T> {
  items: T[];
  meta: ICursorPaginationMeta;
}

export interface ICursorPaginationMeta {
  nextCursor?: string;
  previousCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface IOffsetPaginationRequest {
  offset: number;
  limit: number;
}

export interface IOffsetPaginationResponse<T> {
  items: T[];
  meta: IOffsetPaginationMeta;
}

export interface IOffsetPaginationMeta {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface IInfiniteScrollRequest {
  lastId?: string;
  limit?: number;
}

export interface IInfiniteScrollResponse<T> {
  items: T[];
  lastId?: string;
  hasMore: boolean;
}

export interface ISortOption {
  field: string;
  label: string;
  order: 'asc' | 'desc';
}

export interface IFilterOption {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  NOT_IN = 'not_in',
  BETWEEN = 'between',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
}

export interface ISearchRequest {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
  highlight?: boolean;
  suggestions?: boolean;
  limit?: number;
}

export interface ISearchResponse<T> {
  results: ISearchResult<T>[];
  total: number;
  suggestions?: string[];
  facets?: ISearchFacet[];
}

export interface ISearchResult<T> {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface ISearchFacet {
  field: string;
  values: ISearchFacetValue[];
}

export interface ISearchFacetValue {
  value: string;
  count: number;
}
