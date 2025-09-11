export class ObjectUtils {
  /**
   * Deep clone object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any;
    }

    if (obj instanceof Object) {
      const clonedObj = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }

    return obj;
  }

  /**
   * Deep merge objects
   */
  static deepMerge<T extends object>(...objects: Partial<T>[]): T {
    const result = {} as T;

    for (const obj of objects) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = this.deepMerge(
              (result[key] || {}) as any,
              value as any,
            );
          } else {
            result[key] = value as any;
          }
        }
      }
    }

    return result;
  }

  /**
   * Pick properties from object
   */
  static pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Omit properties from object
   */
  static omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result as Omit<T, K>;
  }

  /**
   * Check if object is empty
   */
  static isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  }

  /**
   * Get nested property value
   */
  static get(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      result = result?.[key];
      if (result === undefined) {
        return defaultValue;
      }
    }

    return result;
  }

  /**
   * Set nested property value
   */
  static set(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  /**
   * Compare objects for equality
   */
  static isEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    
    if (!obj1 || !obj2) return false;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.isEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }

  /**
   * Convert object to query string
   */
  static toQueryString(obj: Record<string, any>): string {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, String(v)));
        } else {
          params.append(key, String(value));
        }
      }
    }
    
    return params.toString();
  }

  /**
   * Parse query string to object
   */
  static fromQueryString(queryString: string): Record<string, any> {
    const params = new URLSearchParams(queryString);
    const result: Record<string, any> = {};
    
    for (const [key, value] of params.entries()) {
      if (result[key]) {
        if (Array.isArray(result[key])) {
          result[key].push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Remove null and undefined values
   */
  static compact(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Map object values
   */
  static mapValues<T, R>(
    obj: Record<string, T>,
    fn: (value: T, key: string) => R,
  ): Record<string, R> {
    const result: Record<string, R> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      result[key] = fn(value, key);
    }
    
    return result;
  }

  /**
   * Map object keys
   */
  static mapKeys<T>(
    obj: Record<string, T>,
    fn: (key: string, value: T) => string,
  ): Record<string, T> {
    const result: Record<string, T> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = fn(key, value);
      result[newKey] = value;
    }
    
    return result;
  }
}
