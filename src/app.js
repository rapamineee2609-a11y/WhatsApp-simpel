import chalk from 'chalk';
import { config } from './config/config.js';
import logger from './core/logger.js';
import client from './core/client.js';
import authHandler from './handlers/auth.js';
import database from './core/database.js';

class Application {
  constructor() {
    this.startTime = Date.now();
  }

  async initialize() {
    try {
      this.showBanner();
      this.checkConfig();
      await this.setupDirectories();
      await database.load();
      await authHandler.start();
      this.setupShutdown();
      this.startStats();
      
      logger.success('WhatsApp AI Bot started successfully!');
    } catch (error) {
      logger.error('Failed to start application', { error: error.message });
      process.exit(1);
    }
  }

  showBanner() {
    console.log(chalk.cyan(`
╔════════════════════════════════════════╗
║                                        ║
║    ${chalk.bold('🤖 WhatsApp AI Bot 2026')}    ║
║                                        ║
║    Version: ${chalk.yellow('1.0.0')}              ║
║    Author: ${chalk.green('WormAI')}              ║
║                                        ║
╚════════════════════════════════════════╝
    `));
    
    console.log(chalk.gray(`Bot Name: ${config.botName}`));
    console.log(chalk.gray(`Environment: ${config.env}`));
    console.log(chalk.gray(`Prefixes: ${config.prefixes.join(', ')}`));
    console.log('');
  }

  checkConfig() {
    const required = ['GROQ_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      logger.warn(`Missing environment variables: ${missing.join(', ')}`);
      logger.warn('Some features may not work properly.');
    }
  }

  async setupDirectories() {
    const directories = [
      'database',
      'database/sessions',
      'database/backup',
      'logs',
      'src/plugins'
    ];
    
    for (const dir of directories) {
      await import('fs-extra').then(fs => fs.ensureDir(dir));
    }
  }

  setupShutdown() {
    process.on('SIGINT', () => {
      logger.info('Shutting down...');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info('Shutting down...');
      process.exit(0);
    });
    
    process.on('unhandledRejection', (error) => {
      logger.error('Unhandled rejection', { error: error.message });
    });
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message });
    });
  }

  startStats() {
    setInterval(() => {
      const uptime = Math.floor((Date.now() - this.startTime) / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      
      logger.debug(`Uptime: ${hours}h ${minutes}m ${seconds}s`);
    }, 60000);
  }
}

// Start application
const app = new Application();
app.initialize();

export default app;
