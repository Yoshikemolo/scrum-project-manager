export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  PASSWORD: {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    // At least 8 characters
    SIMPLE: /^.{8,}$/,
    // Contains uppercase
    HAS_UPPERCASE: /[A-Z]/,
    // Contains lowercase
    HAS_LOWERCASE: /[a-z]/,
    // Contains number
    HAS_NUMBER: /\d/,
    // Contains special character
    HAS_SPECIAL: /[@$!%*?&]/,
  },

  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  
  PROJECT_KEY: /^[A-Z]{2,10}$/,
  
  PHONE: {
    INTERNATIONAL: /^\+[1-9]\d{1,14}$/,
    US: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
    GENERIC: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
  },

  URL: {
    FULL: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
    SIMPLE: /^(https?:\/\/)/,
    DOMAIN: /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}$/,
  },

  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  
  ALPHABETIC: /^[a-zA-Z]+$/,
  
  NUMERIC: /^[0-9]+$/,
  
  DECIMAL: /^\d+(\.\d{1,2})?$/,
  
  DATE: {
    ISO: /^\d{4}-\d{2}-\d{2}$/,
    US: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/,
    EU: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
  },

  TIME: {
    TWENTY_FOUR: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    TWELVE: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/,
  },

  CREDIT_CARD: {
    VISA: /^4[0-9]{12}(?:[0-9]{3})?$/,
    MASTERCARD: /^5[1-5][0-9]{14}$/,
    AMEX: /^3[47][0-9]{13}$/,
    DISCOVER: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    GENERIC: /^[0-9]{13,19}$/,
  },

  IP_ADDRESS: {
    V4: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    V6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  },

  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  
  MENTION: /@([a-zA-Z0-9_]+)/g,
  
  HASHTAG: /#([a-zA-Z0-9_]+)/g,
  
  FILE_NAME: /^[a-zA-Z0-9._-]+$/,
  
  JWT: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
  
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/,
  
  MONGODB_ID: /^[0-9a-fA-F]{24}$/,
  
  SQL_INJECTION: /('|(\-\-)|(;)|(\|\|)|(\/\*)|(\*\/))/,
  
  XSS: /(<script|<iframe|javascript:|onerror=|onclick=)/i,
};

export const SANITIZATION_PATTERNS = {
  HTML_TAGS: /<[^>]*>/g,
  SPECIAL_CHARS: /[^a-zA-Z0-9\s]/g,
  EXTRA_SPACES: /\s+/g,
  LEADING_TRAILING_SPACES: /^\s+|\s+$/g,
  NON_ALPHANUMERIC: /[^a-zA-Z0-9]/g,
  NON_NUMERIC: /[^0-9]/g,
  SCRIPT_TAGS: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  STYLE_TAGS: /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
};
