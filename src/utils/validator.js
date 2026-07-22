import { config } from '../config/config.js';

export function validateInput(input) {
  if (!input) return true;
  
  // Check length
  if (input.length > config.maxInputLength) {
    return false;
  }
  
  // Check for malicious patterns
  const patterns = [
    /<script>/i,
    /onerror=/i,
    /javascript:/i,
    /eval\(/i,
    /document\./i,
    /window\./i
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(input)) {
      return false;
    }
  }
  
  return true;
}

export function isValidNumber(number) {
  const clean = number.replace(/[^0-9]/g, '');
  return clean.length >= 10 && clean.length <= 15;
}

export function isValidPrefix(prefix) {
  return config.prefixes.includes(prefix);
}

export function isValidCommand(command) {
  return /^[a-z0-9_-]+$/i.test(command);
}

export function sanitizeInput(input) {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

export function formatNumber(number) {
  return number.replace(/[^0-9]/g, '');
}

export function validateURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
  }
