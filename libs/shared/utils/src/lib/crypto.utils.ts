import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export class CryptoUtils {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly saltRounds = 12;

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Encrypt data
   */
  static encrypt(text: string, secretKey: string): {
    encrypted: string;
    iv: string;
    authTag: string;
  } {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt data
   */
  static decrypt(
    encryptedData: {
      encrypted: string;
      iv: string;
      authTag: string;
    },
    secretKey: string,
  ): string {
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate hash of data
   */
  static hash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Generate HMAC
   */
  static generateHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC
   */
  static verifyHMAC(data: string, hmac: string, secret: string): boolean {
    const expectedHmac = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(expectedHmac, 'hex'),
    );
  }

  /**
   * Generate OTP (One-Time Password)
   */
  static generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandom(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
  }

  /**
   * Generate API key
   */
  static generateApiKey(prefix: string = 'sk'): string {
    const token = this.generateToken(32);
    return `${prefix}_${token}`;
  }

  /**
   * Mask sensitive data
   */
  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(Math.max(4, data.length - visibleChars * 2));
    return `${start}${middle}${end}`;
  }
}
