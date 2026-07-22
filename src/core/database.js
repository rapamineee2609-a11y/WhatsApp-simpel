import fs from 'fs-extra';
import { join } from 'path';
import { config } from '../config/config.js';
import logger from './logger.js';

class Database {
  constructor() {
    this.path = config.dbPath;
    this.data = {};
    this.backupInterval = null;
    this.load();
    this.startBackup();
  }

  load() {
    try {
      if (fs.existsSync(this.path)) {
        this.data = fs.readJsonSync(this.path);
        logger.success('Database loaded successfully');
      } else {
        this.data = this.getDefaultStructure();
        this.save();
        logger.info('New database created');
      }
    } catch (error) {
      logger.error('Failed to load database', { error: error.message });
      this.data = this.getDefaultStructure();
    }
  }

  getDefaultStructure() {
    return {
      users: {},
      groups: {},
      settings: {},
      premium: {},
      bans: {},
      stats: {
        messages: 0,
        commands: 0,
        startTime: Date.now()
      }
    };
  }

  save() {
    try {
      fs.ensureDirSync(join(this.path, '..'));
      fs.writeJsonSync(this.path, this.data, { spaces: 2 });
    } catch (error) {
      logger.error('Failed to save database', { error: error.message });
    }
  }

  startBackup() {
    if (config.autoBackup) {
      this.backupInterval = setInterval(() => {
        this.backup();
      }, config.backupInterval);
    }
  }

  backup() {
    try {
      const backupPath = join(
        this.path, '..', 'backup',
        `data_${Date.now()}.json`
      );
      fs.ensureDirSync(join(this.path, '..', 'backup'));
      fs.copySync(this.path, backupPath);
      logger.debug('Database backup created');
    } catch (error) {
      logger.error('Failed to create backup', { error: error.message });
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  update(key, updates) {
    if (this.data[key]) {
      this.data[key] = { ...this.data[key], ...updates };
    } else {
      this.data[key] = updates;
    }
    this.save();
    return this.data[key];
  }

  getUser(userId) {
    if (!this.data.users[userId]) {
      this.data.users[userId] = {
        registered: Date.now(),
        commands: 0,
        premium: false,
        banned: false,
        cooldowns: {}
      };
      this.save();
    }
    return this.data.users[userId];
  }

  getGroup(groupId) {
    if (!this.data.groups[groupId]) {
      this.data.groups[groupId] = {
        registered: Date.now(),
        settings: {
          welcome: true,
          goodbye: true,
          antiLink: false,
          antiSpam: false,
          antiBadword: false
        }
      };
      this.save();
    }
    return this.data.groups[groupId];
  }

  isPremium(userId) {
    return this.data.premium[userId] || false;
  }

  isBanned(userId) {
    return this.data.bans[userId] || false;
  }

  incrementStats(key) {
    if (this.data.stats[key] !== undefined) {
      this.data.stats[key]++;
      this.save();
    }
  }
}

export default new Database();
