import pkg from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs-extra';
import { join } from 'path';
import { config } from '../config/config.js';
import logger from './logger.js';
import database from './database.js';

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore
} = pkg;

class WhatsAppClient {
  constructor() {
    this.sock = null;
    this.store = null;
    this.isReady = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  async initialize() {
    try {
      logger.info('Initializing WhatsApp client...');
      
      const { version } = await fetchLatestBaileysVersion();
      logger.info(`Baileys version: ${version.join('.')}`);
      
      const { state, saveCreds } = await useMultiFileAuthState(
        join(config.sessionPath, 'auth')
      );
      
      this.store = makeInMemoryStore({});
      
      this.sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        printQRInTerminal: false,
        logger: logger,
        browser: ['WormAI', 'Chrome', '2026'],
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false
      });
      
      this.store.bind(this.sock.ev);
      
      this.setupEventListeners(saveCreds);
      
      return this.sock;
    } catch (error) {
      logger.error('Failed to initialize client', { error: error.message });
      throw error;
    }
  }

  setupEventListeners(saveCreds) {
    this.sock.ev.on('creds.update', saveCreds);
    
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, pairingCode } = update;
      
      if (connection === 'open') {
        this.isReady = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        logger.success('WhatsApp client connected successfully');
        this.sock.sendPresenceUpdate('available');
      }
      
      if (connection === 'close') {
        this.isReady = false;
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        
        if (statusCode === DisconnectReason.loggedOut) {
          logger.warn('Logged out, clearing session');
          await this.clearSession();
          process.exit(0);
        } else if (statusCode === DisconnectReason.restartRequired) {
          logger.info('Restart required, reconnecting...');
          await this.reconnect();
        } else {
          logger.warn(`Connection closed: ${statusCode}`);
          await this.reconnect();
        }
      }
    });
    
    this.sock.ev.on('messages.upsert', async ({ messages }) => {
      if (!messages?.[0]) return;
      const msg = messages[0];
      
      if (!msg.key.fromMe && msg.message) {
        await this.handleMessage(msg);
      }
    });
  }

  async pairing(number) {
    try {
      this.isConnecting = true;
      logger.info(`Initiating pairing for ${number}`);
      
      const code = await this.sock.requestPairingCode(number);
      logger.success(`Pairing code: ${code}`);
      
      return code;
    } catch (error) {
      logger.error('Pairing failed', { error: error.message });
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached');
      process.exit(1);
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.initialize();
      } catch (error) {
        logger.error('Reconnection failed', { error: error.message });
        await this.reconnect();
      }
    }, delay);
  }

  async clearSession() {
    try {
      const sessionPath = join(config.sessionPath, 'auth');
      if (fs.existsSync(sessionPath)) {
        await fs.remove(sessionPath);
        logger.info('Session cleared');
      }
    } catch (error) {
      logger.error('Failed to clear session', { error: error.message });
    }
  }

  async sendMessage(jid, content, options = {}) {
    try {
      if (!this.sock || !this.isReady) {
        throw new Error('Client not ready');
      }
      
      const messageOptions = {
        ...options,
        text: content
      };
      
      if (typeof content === 'string') {
        messageOptions.text = content;
      }
      
      return await this.sock.sendMessage(jid, messageOptions);
    } catch (error) {
      logger.error('Failed to send message', { error: error.message });
      throw error;
    }
  }

  async handleMessage(msg) {
    try {
      database.incrementStats('messages');
      
      const message = msg.message;
      const text = message?.conversation || 
                   message?.extendedTextMessage?.text ||
                   message?.imageMessage?.caption ||
                   message?.videoMessage?.caption ||
                   '';
      
      if (!text) return;
      
      // Handle command
      const { commandHandler } = await import('../handlers/command.js');
      await commandHandler.handle(this, msg, text);
    } catch (error) {
      logger.error('Error handling message', { error: error.message });
    }
  }

  async getStatus() {
    return {
      ready: this.isReady,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      uptime: process.uptime()
    };
  }
}

export default new WhatsAppClient();
