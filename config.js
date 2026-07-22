import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

export const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  
  // Bot
  botName: process.env.BOT_NAME || 'WormAI',
  ownerNumber: process.env.OWNER_NUMBER || '',
  prefixes: process.env.PREFIX ? process.env.PREFIX.split(',') : ['!', '.', '?'],
  
  // WhatsApp
  sessionFile: process.env.SESSION_FILE || 'session.json',
  sessionPath: join(__dirname, 'database', 'sessions'),
  
  // AI
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
    fallbackModel: process.env.GROQ_FALLBACK_MODEL || 'llama3-70b-8192'
  },
  
  // Database
  dbPath: process.env.DB_PATH || join(__dirname, 'database', 'data.json'),
  autoBackup: process.env.AUTO_BACKUP === 'true',
  backupInterval: parseInt(process.env.BACKUP_INTERVAL) || 3600000,
  
  // Cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
    size: parseInt(process.env.CACHE_SIZE) || 100
  },
  
  // Security
  maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH) || 4096,
  maxInputLength: parseInt(process.env.MAX_INPUT_LENGTH) || 2000,
  enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    maxRequests: parseInt(process.env.MAX_REQUESTS_PER_WINDOW) || 30
  }
};

export default config;
