export class StringUtils {
  /**
   * Generate a random ID
   */
  static generateId(prefix?: string): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
  }

  /**
   * Generate project key from name
   */
  static generateProjectKey(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 4);
  }

  /**
   * Slugify a string
   */
  static slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Truncate string
   */
  static truncate(text: string, length: number, suffix: string = '...'): string {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length - suffix.length) + suffix;
  }

  /**
   * Capitalize first letter
   */
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Convert to title case
   */
  static toTitleCase(text: string): string {
    return text
      .split(' ')
      .map(word => this.capitalize(word))
      .join(' ');
  }

  /**
   * Extract initials from name
   */
  static getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mask email
   */
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  /**
   * Parse mentions from text
   */
  static extractMentions(text: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.substring(1)) : [];
  }

  /**
   * Highlight search terms
   */
  static highlightText(text: string, searchTerm: string): string {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Convert bytes to human readable format
   */
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Generate random color
   */
  static generateColor(seed?: string): string {
    if (seed) {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      }
      const color = Math.floor(Math.abs(Math.sin(hash) * 16777215));
      return '#' + color.toString(16).padStart(6, '0');
    }
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }
}
