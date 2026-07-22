import logger from '../core/logger.js';
import database from '../core/database.js';
import { config } from '../config/config.js';
import { validateInput, isValidPrefix } from '../utils/validator.js';
import pluginManager from './plugin.js';

class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.cooldowns = new Map();
    this.rateLimits = new Map();
    this.loadCommands();
  }

  async loadCommands() {
    try {
      const plugins = await pluginManager.loadPlugins();
      
      for (const [name, plugin] of plugins) {
        if (plugin.commands) {
          for (const cmd of plugin.commands) {
            this.registerCommand(cmd, plugin);
          }
        }
      }
      
      logger.success(`Loaded ${this.commands.size} commands`);
    } catch (error) {
      logger.error('Failed to load commands', { error: error.message });
    }
  }

  registerCommand(cmd, plugin) {
    const commandName = cmd.name.toLowerCase();
    
    // Register command
    this.commands.set(commandName, {
      ...cmd,
      plugin,
      execute: cmd.execute
    });
    
    // Register aliases
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        this.aliases.set(alias.toLowerCase(), commandName);
      }
    }
  }

  async handle(client, msg, text) {
    try {
      // Check if message is a command
      const { prefix, command, args } = this.parseCommand(text);
      
      if (!command) return;
      
      // Check if command exists
      const cmdObj = this.getCommand(command);
      if (!cmdObj) return;
      
      // Check permissions
      const sender = msg.key.remoteJid;
      const user = database.getUser(sender);
      
      // Check if user is banned
      if (database.isBanned(sender)) {
        await client.sendMessage(sender, 'You are banned from using this bot.');
        return;
      }
      
      // Check premium if required
      if (cmdObj.premium && !database.isPremium(sender)) {
        await client.sendMessage(sender, 'This command is for premium users only.');
        return;
      }
      
      // Check cooldown
      if (this.isOnCooldown(sender, command)) {
        const remaining = this.getCooldownRemaining(sender, command);
        await client.sendMessage(sender, `Please wait ${Math.ceil(remaining / 1000)} seconds before using this command again.`);
        return;
      }
      
      // Check rate limit
      if (config.enableRateLimit && this.isRateLimited(sender)) {
        await client.sendMessage(sender, 'Rate limit exceeded. Please slow down.');
        return;
      }
      
      // Validate input
      if (!validateInput(args.join(' '))) {
        await client.sendMessage(sender, 'Invalid input. Please check your command.');
        return;
      }
      
      // Execute command
      try {
        database.incrementStats('commands');
        user.commands++;
        database.save();
        
        // Set cooldown
        if (cmdObj.cooldown) {
          this.setCooldown(sender, command, cmdObj.cooldown);
        }
        
        // Track rate limit
        this.trackRateLimit(sender);
        
        await cmdObj.execute(client, msg, args);
      } catch (error) {
        logger.error(`Command execution error: ${command}`, { error: error.message });
        await client.sendMessage(sender, `Error executing command: ${error.message}`);
      }
      
    } catch (error) {
      logger.error('Command handler error', { error: error.message });
    }
  }

  parseCommand(text) {
    const trimmedText = text.trim();
    
    // Check for prefix
    let prefix = null;
    for (const p of config.prefixes) {
      if (trimmedText.startsWith(p)) {
        prefix = p;
        break;
      }
    }
    
    if (!prefix) return { prefix: null, command: null, args: [] };
    
    const withoutPrefix = trimmedText.slice(prefix.length).trim();
    const [command, ...args] = withoutPrefix.split(/\s+/);
    
    return { prefix, command: command.toLowerCase(), args };
  }

  getCommand(name) {
    // Check if command exists
    if (this.commands.has(name)) {
      return this.commands.get(name);
    }
    
    // Check aliases
    if (this.aliases.has(name)) {
      return this.commands.get(this.aliases.get(name));
    }
    
    return null;
  }

  isOnCooldown(userId, command) {
    const key = `${userId}:${command}`;
    const cooldown = this.cooldowns.get(key);
    if (!cooldown) return false;
    return Date.now() < cooldown;
  }

  getCooldownRemaining(userId, command) {
    const key = `${userId}:${command}`;
    const cooldown = this.cooldowns.get(key);
    if (!cooldown) return 0;
    return cooldown - Date.now();
  }

  setCooldown(userId, command, duration) {
    const key = `${userId}:${command}`;
    this.cooldowns.set(key, Date.now() + duration);
    
    setTimeout(() => {
      this.cooldowns.delete(key);
    }, duration);
  }

  isRateLimited(userId) {
    if (!config.enableRateLimit) return false;
    
    const data = this.rateLimits.get(userId);
    if (!data) return false;
    
    const elapsed = Date.now() - data.startTime;
    if (elapsed > config.rateLimit.window) {
      this.rateLimits.delete(userId);
      return false;
    }
    
    return data.count >= config.rateLimit.maxRequests;
  }

  trackRateLimit(userId) {
    if (!config.enableRateLimit) return;
    
    const data = this.rateLimits.get(userId);
    const now = Date.now();
    
    if (!data || now - data.startTime > config.rateLimit.window) {
      this.rateLimits.set(userId, {
        startTime: now,
        count: 1
      });
    } else {
      data.count++;
    }
  }

  getCommands() {
    return Array.from(this.commands.values());
  }

  reload() {
    this.commands.clear();
    this.aliases.clear();
    this.cooldowns.clear();
    this.rateLimits.clear();
    this.loadCommands();
  }
}

export default new CommandHandler();
