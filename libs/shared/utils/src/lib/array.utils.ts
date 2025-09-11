export class ArrayUtils {
  /**
   * Chunk array into smaller arrays
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Remove duplicates from array
   */
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  /**
   * Remove duplicates by property
   */
  static uniqueBy<T, K extends keyof T>(array: T[], key: K): T[] {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * Group array by property
   */
  static groupBy<T, K extends keyof T>(
    array: T[],
    key: K,
  ): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Sort array by multiple properties
   */
  static sortBy<T>(array: T[], ...keys: (keyof T)[]): T[] {
    return [...array].sort((a, b) => {
      for (const key of keys) {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
      }
      return 0;
    });
  }

  /**
   * Shuffle array
   */
  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get intersection of arrays
   */
  static intersection<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return arrays[0];

    return arrays.reduce((acc, arr) => 
      acc.filter(item => arr.includes(item))
    );
  }

  /**
   * Get difference between arrays
   */
  static difference<T>(array1: T[], array2: T[]): T[] {
    return array1.filter(item => !array2.includes(item));
  }

  /**
   * Flatten nested array
   */
  static flatten<T>(array: any[], depth: number = 1): T[] {
    if (depth <= 0) return array;
    return array.reduce((acc, val) => 
      acc.concat(Array.isArray(val) ? this.flatten(val, depth - 1) : val), 
      []
    );
  }

  /**
   * Get random element from array
   */
  static random<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get random elements from array
   */
  static sample<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Partition array by predicate
   */
  static partition<T>(
    array: T[],
    predicate: (item: T) => boolean,
  ): [T[], T[]] {
    const pass: T[] = [];
    const fail: T[] = [];
    
    for (const item of array) {
      if (predicate(item)) {
        pass.push(item);
      } else {
        fail.push(item);
      }
    }
    
    return [pass, fail];
  }

  /**
   * Move element in array
   */
  static move<T>(array: T[], from: number, to: number): T[] {
    const result = [...array];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }

  /**
   * Sum array of numbers
   */
  static sum(array: number[]): number {
    return array.reduce((sum, num) => sum + num, 0);
  }

  /**
   * Get average of numbers
   */
  static average(array: number[]): number {
    if (array.length === 0) return 0;
    return this.sum(array) / array.length;
  }

  /**
   * Get min and max from array
   */
  static minMax(array: number[]): { min: number; max: number } | null {
    if (array.length === 0) return null;
    return {
      min: Math.min(...array),
      max: Math.max(...array),
    };
  }
}
