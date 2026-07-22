import GroqService from '../../services/groq.js';
import logger from '../../core/logger.js';

const groq = new GroqService();

export default {
  name: 'ai',
  description: 'AI powered commands using Groq',
  version: '1.0.0',
  
  commands: [
    {
      name: 'ai',
      description: 'Chat with AI',
      aliases: ['ask', 'chat'],
      cooldown: 3000,
      execute: async (client, msg, args) => {
        const query = args.join(' ');
        if (!query) {
          await client.sendMessage(msg.key.remoteJid, 'Please provide a question.');
          return;
        }
        
        const sender = msg.key.remoteJid;
        const response = await groq.chat(sender, query);
        await client.sendMessage(msg.key.remoteJid, response);
      }
    },
    {
      name: 'explain',
      description: 'Explain a concept',
      aliases: ['exp'],
      cooldown: 5000,
      execute: async (client, msg, args) => {
        const topic = args.join(' ');
        if (!topic) {
          await client.sendMessage(msg.key.remoteJid, 'Please provide a topic to explain.');
          return;
        }
        
        const response = await groq.explain(topic);
        await client.sendMessage(msg.key.remoteJid, response);
      }
    },
    {
      name: 'rewrite',
      description: 'Rewrite text',
      aliases: ['rw'],
      cooldown: 5000,
      execute: async (client, msg, args) => {
        const text = args.join(' ');
        if (!text) {
          await client.sendMessage(msg.key.remoteJid, 'Please provide text to rewrite.');
          return;
        }
        
        const response = await groq.rewrite(text);
        await client.sendMessage(msg.key.remoteJid, response);
      }
    },
    {
      name: 'translate',
      description: 'Translate text',
      aliases: ['tr'],
      cooldown: 5000,
      execute: async (client, msg, args) => {
        const text = args.join(' ');
        if (!text) {
          await client.sendMessage(msg.key.remoteJid, 'Please provide text to translate.');
          return;
        }
        
        const response = await groq.translate(text);
        await client.sendMessage(msg.key.remoteJid, response);
      }
    },
    {
      name: 'summarize',
      description: 'Summarize text',
      aliases: ['sum'],
      cooldown: 5000,
      execute: async (client, msg, args) => {
        const text = args.join(' ');
        if (!text) {
          await client.sendMessage(msg.key.remoteJid, 'Please provide text to summarize.');
          return;
        }
        
        const response = await groq.summarize(text);
        await client.sendMessage(msg.key.remoteJid, response);
      }
    },
    {
      name: 'code',
      description: 'Generate code',
      aliases: ['coding'],
      cooldown: 5000,
      execute: async (client, msg, args) => {
        const query = args.join(' ');
        if (!query) {
          await client.sendMessage(msg.key.remoteJid, 'Please describe what code you need.');
          return;
        }
        
        const response = await groq.code(query);
        await client.sendMessage(msg.key.remoteJid, response);
      }
    },
    {
      name: 'debug',
      description: 'Debug code',
      aliases: ['dbg'],
      cooldown: 5000,
      execute: async (client, msg, args) => {
        const code = args.join(' ');
        if (!code) {
          await client.sendMessage(msg.key.remoteJid, 'Please provide code to debug.');
          return;
        }
        
        const response = await groq.debug(code);
        await client.sendMessage(msg.key.remoteJid, response);
      }
    },
    {
      name: 'resetai',
      description: 'Reset AI memory',
      aliases: ['resetmem', 'clearmem'],
      cooldown: 10000,
      execute: async (client, msg) => {
        const sender = msg.key.remoteJid;
        groq.clearHistory(sender);
        await client.sendMessage(msg.key.remoteJid, 'AI memory reset successfully.');
      }
    }
  ]
};
