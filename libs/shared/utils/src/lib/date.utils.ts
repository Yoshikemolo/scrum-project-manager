import { format, addDays, subDays, startOfWeek, endOfWeek, differenceInDays, isWeekend, addBusinessDays } from 'date-fns';

export class DateUtils {
  /**
   * Format date to string
   */
  static formatDate(date: Date, formatString: string = 'yyyy-MM-dd'): string {
    return format(date, formatString);
  }

  /**
   * Get start of sprint (Monday)
   */
  static getSprintStart(date: Date): Date {
    return startOfWeek(date, { weekStartsOn: 1 });
  }

  /**
   * Get end of sprint (Friday, 2 weeks later)
   */
  static getSprintEnd(startDate: Date, durationDays: number = 14): Date {
    return addDays(startDate, durationDays - 1);
  }

  /**
   * Calculate business days between two dates
   */
  static getBusinessDays(startDate: Date, endDate: Date): number {
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

  /**
   * Add business days to a date
   */
  static addBusinessDays(date: Date, days: number): Date {
    return addBusinessDays(date, days);
  }

  /**
   * Get remaining days in sprint
   */
  static getRemainingDays(endDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    return Math.max(0, differenceInDays(end, today));
  }

  /**
   * Check if date is in current sprint
   */
  static isInCurrentSprint(date: Date, sprintStart: Date, sprintEnd: Date): boolean {
    return date >= sprintStart && date <= sprintEnd;
  }

  /**
   * Get sprint week number
   */
  static getSprintWeek(date: Date, sprintStart: Date): number {
    const daysDiff = differenceInDays(date, sprintStart);
    return Math.floor(daysDiff / 7) + 1;
  }

  /**
   * Parse ISO date string
   */
  static parseISODate(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Convert to ISO string
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Get time ago string
   */
  static getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return format(date, 'MMM dd, yyyy');
    }
  }
}
