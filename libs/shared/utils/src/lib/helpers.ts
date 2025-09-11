export function generateProjectKey(projectName: string): string {
  return projectName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 5);
}

export function generateTaskKey(projectKey: string, taskNumber: number): string {
  return `${projectKey}-${taskNumber.toString().padStart(4, '0')}`;
}

export function calculateVelocity(completedPoints: number, totalDays: number): number {
  if (totalDays === 0) return 0;
  return Math.round((completedPoints / totalDays) * 10) / 10;
}

export function calculateSprintProgress(completedPoints: number, totalPoints: number): number {
  if (totalPoints === 0) return 0;
  return Math.round((completedPoints / totalPoints) * 100);
}

export function calculateBurndownIdeal(totalPoints: number, totalDays: number, currentDay: number): number {
  if (totalDays === 0) return totalPoints;
  const dailyBurn = totalPoints / totalDays;
  return Math.max(0, totalPoints - (dailyBurn * currentDay));
}

export function estimateCompletionDate(remainingPoints: number, velocity: number): Date | null {
  if (velocity <= 0) return null;
  const daysNeeded = Math.ceil(remainingPoints / velocity);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysNeeded);
  return completionDate;
}

export function calculateTeamCapacity(teamMembers: number, sprintDays: number, averageHoursPerDay: number = 6): number {
  return teamMembers * sprintDays * averageHoursPerDay;
}

export function prioritizeTasks<T extends { priority: number; value: number }>(
  tasks: T[],
  maxCapacity: number
): T[] {
  const sorted = [...tasks].sort((a, b) => {
    const ratioA = a.value / a.priority;
    const ratioB = b.value / b.priority;
    return ratioB - ratioA;
  });

  const selected: T[] = [];
  let currentCapacity = 0;

  for (const task of sorted) {
    if (currentCapacity + task.value <= maxCapacity) {
      selected.push(task);
      currentCapacity += task.value;
    }
  }

  return selected;
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch((error) => {
    if (retries === 0) {
      throw error;
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(retry(fn, retries - 1, delay * 2));
      }, delay);
    });
  });
}

export function memoize<T extends (...args: any[]) => any>(
  fn: T
): T {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
