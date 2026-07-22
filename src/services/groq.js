import Groq from 'groq-sdk';
import { config } from '../config/config.js';
import logger from '../core/logger.js';

class GroqService {
  constructor() {
    this.client = new Groq({
      apiKey: config.groq.apiKey
    });
    this.histories = new Map();
    this.model = config.groq.model;
    this.fallbackModel = config.groq.fallbackModel;
    this.maxTokens = 2048;
    this.temperature = 0.7;
  }

  async chat(userId, message) {
    try {
      const history = this.getHistory(userId);
      history.push({ role: 'user', content: message });
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: history,
        max_tokens: this.maxTokens,
        temperature: this.temperature
      });
      
      const reply = response.choices[0]?.message?.content || 'No response generated.';
      history.push({ role: 'assistant', content: reply });
      
      // Limit history size
      if (history.length > 20) {
        history.splice(0, 2);
      }
      
      return reply;
    } catch (error) {
      logger.error('Groq API error', { error: error.message });
      
      // Try fallback model
      try {
        const response = await this.client.chat.completions.create({
          model: this.fallbackModel,
          messages: [{ role: 'user', content: message }],
          max_tokens: this.maxTokens,
          temperature: this.temperature
        });
        
        return response.choices[0]?.message?.content || 'Fallback response generated.';
      } catch (fallbackError) {
        logger.error('Fallback API error', { error: fallbackError.message });
        return 'AI service temporarily unavailable. Please try again later.';
      }
    }
  }

  async explain(topic) {
    const prompt = `Explain "${topic}" in a clear and concise way.`;
    return this.chat('system', prompt);
  }

  async rewrite(text) {
    const prompt = `Rewrite the following text to make it better and more engaging:\n\n${text}`;
    return this.chat('system', prompt);
  }

  async translate(text) {
    const prompt = `Translate the following text to Indonesian:\n\n${text}`;
    return this.chat('system', prompt);
  }

  async summarize(text) {
    const prompt = `Summarize the following text concisely:\n\n${text}`;
    return this.chat('system', prompt);
  }

  async code(query) {
    const prompt = `Generate code for the following request:\n\n${query}`;
    return this.chat('system', prompt);
  }

  async debug(code) {
    const prompt = `Debug the following code and provide the corrected version:\n\n${code}`;
    return this.chat('system', prompt);
  }

  getHistory(userId) {
    if (!this.histories.has(userId)) {
      this.histories.set(userId, [
        { role: 'system', content: 'You are a helpful AI assistant.' }
      ]);
    }
    return this.histories.get(userId);
  }

  clearHistory(userId) {
    this.histories.delete(userId);
    logger.info(`Cleared history for user: ${userId}`);
  }

  setModel(model) {
    if (model) {
      this.model = model;
      logger.info(`Model changed to: ${model}`);
    }
  }
}

export default GroqService;
