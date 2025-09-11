import { format, parse, differenceInDays, addDays, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWeekend, isAfter, isBefore, isEqual } from 'date-fns';

export class DateUtils {
  static formatDate(date: Date | string, formatString: string = 'yyyy-MM-dd'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatString);
  }

  static parseDate(dateString: string, formatString: string = 'yyyy-MM-dd'): Date {
    return parse(dateString, formatString, new Date());
  }

  static getDaysBetween(startDate: Date, endDate: Date): number {
    return differenceInDays(endDate, startDate);
  }

  static addDays(date: Date, days: number): Date {
    return addDays(date, days);
  }

  static subtractDays(date: Date, days: number): Date {
    return subDays(date, days);
  }

  static getWorkingDaysBetween(startDate: Date, endDate: Date): number {
    let count = 0;
    let current = new Date(startDate);
    
    while (current <= endDate) {
      if (!isWeekend(current)) {
        count++;
      }
      current = addDays(current, 1);
    }
    
    return count;
  }

  static getNextWorkingDay(date: Date): Date {
    let nextDay = addDays(date, 1);
    while (isWeekend(nextDay)) {
      nextDay = addDays(nextDay, 1);
    }
    return nextDay;
  }

  static getPreviousWorkingDay(date: Date): Date {
    let prevDay = subDays(date, 1);
    while (isWeekend(prevDay)) {
      prevDay = subDays(prevDay, 1);
    }
    return prevDay;
  }

  static getSprintDateRange(startDate: Date, durationDays: number): { start: Date; end: Date } {
    const endDate = addDays(startDate, durationDays - 1);
    return {
      start: startOfDay(startDate),
      end: endOfDay(endDate),
    };
  }

  static isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    return (isAfter(date, startDate) || isEqual(date, startDate)) && 
           (isBefore(date, endDate) || isEqual(date, endDate));
  }

  static getWeekRange(date: Date): { start: Date; end: Date } {
    return {
      start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
      end: endOfWeek(date, { weekStartsOn: 1 }),
    };
  }

  static getMonthRange(date: Date): { start: Date; end: Date } {
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  }

  static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInDays = differenceInDays(now, date);
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays === -1) return 'Tomorrow';
    if (diffInDays > 0 && diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 0 && diffInDays > -7) return `In ${Math.abs(diffInDays)} days`;
    
    return format(date, 'MMM dd, yyyy');
  }

  static getBusinessDaysInMonth(year: number, month: number): number {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.getWorkingDaysBetween(startDate, endDate);
  }

  static calculateSprintEndDate(startDate: Date, duration: number, excludeWeekends: boolean = true): Date {
    if (!excludeWeekends) {
      return addDays(startDate, duration - 1);
    }
    
    let endDate = new Date(startDate);
    let daysAdded = 0;
    
    while (daysAdded < duration - 1) {
      endDate = addDays(endDate, 1);
      if (!isWeekend(endDate)) {
        daysAdded++;
      }
    }
    
    return endDate;
  }

  static getTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ];
    
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return count === 1 ? `1 ${interval.label} ago` : `${count} ${interval.label}s ago`;
      }
    }
    
    return 'just now';
  }
}
