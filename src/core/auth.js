import readline from 'readline';
import chalk from 'chalk';
import logger from '../core/logger.js';
import client from '../core/client.js';

class AuthHandler {
  constructor() {
    this.isPaired = false;
    this.pairingCode = null;
  }

  async promptPairing() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(chalk.green('Enter WhatsApp number (e.g., 6281234567890): '), async (number) => {
        rl.close();
        
        // Validate number
        const cleanNumber = number.replace(/[^0-9]/g, '');
        if (!cleanNumber || cleanNumber.length < 10) {
          logger.error('Invalid number format');
          process.exit(1);
        }
        
        try {
          const code = await client.pairing(cleanNumber);
          this.pairingCode = code;
          this.isPaired = true;
          logger.success(`Pairing code: ${chalk.yellow(code)}`);
          logger.info('Enter the code in WhatsApp Web pairing screen');
          resolve(code);
        } catch (error) {
          logger.error('Pairing failed', { error: error.message });
          process.exit(1);
        }
      });
    });
  }

  async start() {
    try {
      // Check if session exists
      const hasSession = await this.checkSession();
      
      if (hasSession) {
        logger.info('Session found, connecting...');
        await client.initialize();
        return;
      }
      
      logger.info('No session found, starting pairing...');
      
      // Initialize client first
      await client.initialize();
      
      // Wait for connection to be ready
      await this.waitForConnection();
      
      // Start pairing
      await this.promptPairing();
      
      // Wait for successful connection
      await this.waitForConnection(60000);
      
      logger.success('WhatsApp bot authenticated successfully');
      
    } catch (error) {
      logger.error('Authentication failed', { error: error.message });
      process.exit(1);
    }
  }

  async checkSession() {
    try {
      const { existsSync } = await import('fs');
      const { join } = await import('path');
      const { config } = await import('../config/config.js');
      
      const sessionPath = join(config.sessionPath, 'auth', 'creds.json');
      return existsSync(sessionPath);
    } catch {
      return false;
    }
  }

  async waitForConnection(timeout = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (client.isReady) {
          resolve();
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('Connection timeout'));
          return;
        }
        
        setTimeout(check, 1000);
      };
      
      check();
    });
  }
}

export default new AuthHandler();
