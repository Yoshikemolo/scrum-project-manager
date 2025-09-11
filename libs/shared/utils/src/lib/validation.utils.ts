export class ValidationUtils {
  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let score = 0;

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    } else {
      score++;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score++;
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score++;
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score++;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score++;
    }

    if (score >= 5) {
      strength = 'strong';
    } else if (score >= 3) {
      strength = 'medium';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate phone number
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate project key format
   */
  static isValidProjectKey(key: string): boolean {
    const keyRegex = /^[A-Z]{2,10}$/;
    return keyRegex.test(key);
  }

  /**
   * Validate username
   */
  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
  }

  /**
   * Validate hex color
   */
  static isValidHexColor(color: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  /**
   * Validate credit card number (Luhn algorithm)
   */
  static isValidCreditCard(number: string): boolean {
    const digits = number.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate date range
   */
  static isValidDateRange(startDate: Date, endDate: Date): boolean {
    return startDate < endDate;
  }

  /**
   * Validate file size
   */
  static isValidFileSize(sizeInBytes: number, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return sizeInBytes <= maxSizeInBytes;
  }

  /**
   * Validate file type
   */
  static isValidFileType(fileName: string, allowedTypes: string[]): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  }

  /**
   * Sanitize HTML input
   */
  static sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Validate JSON string
   */
  static isValidJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }
}
