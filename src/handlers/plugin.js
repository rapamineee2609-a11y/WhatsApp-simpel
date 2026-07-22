import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.pluginPath = path.join(__dirname, '..', 'plugins');
    this.loadedPlugins = new Set();
  }

  async loadPlugins() {
    try {
      await fs.ensureDir(this.pluginPath);
      
      const pluginDirs = await fs.readdir(this.pluginPath);
      
      for (const dir of pluginDirs) {
        const fullPath = path.join(this.pluginPath, dir);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await this.loadPlugin(fullPath, dir);
        }
      }
      
      logger.success(`Loaded ${this.plugins.size} plugins`);
      return this.plugins;
    } catch (error) {
      logger.error('Failed to load plugins', { error: error.message });
      return this.plugins;
    }
  }

  async loadPlugin(pluginPath, pluginName) {
    try {
      const indexPath = path.join(pluginPath, 'index.js');
      
      if (!await fs.pathExists(indexPath)) {
        logger.warn(`No index.js found in plugin: ${pluginName}`);
        return;
      }
      
      const pluginModule = await import(`file://${indexPath}`);
      const plugin = pluginModule.default || pluginModule;
      
      if (!plugin.name || !plugin.commands) {
        logger.warn(`Invalid plugin structure: ${pluginName}`);
        return;
      }
      
      this.plugins.set(plugin.name, plugin);
      this.loadedPlugins.add(pluginName);
      logger.info(`Loaded plugin: ${plugin.name} (${plugin.commands.length} commands)`);
    } catch (error) {
      logger.error(`Failed to load plugin ${pluginName}`, { error: error.message });
    }
  }

  async reloadPlugin(pluginName) {
    try {
      // Remove from loaded plugins
      this.plugins.delete(pluginName);
      this.loadedPlugins.delete(pluginName);
      
      // Clear module cache
      const pluginPath = path.join(this.pluginPath, pluginName);
      const cacheKey = path.resolve(pluginPath, 'index.js');
      delete require.cache[cacheKey];
      
      // Reload
      await this.loadPlugin(pluginPath, pluginName);
      logger.success(`Plugin reloaded: ${pluginName}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to reload plugin ${pluginName}`, { error: error.message });
      return false;
    }
  }

  async reloadAllPlugins() {
    this.plugins.clear();
    this.loadedPlugins.clear();
    await this.loadPlugins();
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  getPlugins() {
    return Array.from(this.plugins.values());
  }

  getLoadedPlugins() {
    return Array.from(this.loadedPlugins);
  }
}

export default new PluginManager();
