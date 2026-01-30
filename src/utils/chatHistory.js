import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../config/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');

export class ChatHistoryManager {
  constructor() {
    this.historyPath = path.join(projectRoot, config.CHAT_HISTORY_FILE);
    this.earlierChatsPath = path.join(projectRoot, config.EARLIER_CHATS_FILE);
    this.messages = [];
    this.earlierChats = '';
  }

  // Load earlier chat history from the exported WhatsApp file
  loadEarlierChats() {
    try {
      if (fs.existsSync(this.earlierChatsPath)) {
        const content = fs.readFileSync(this.earlierChatsPath, 'utf-8');
        // Filter out comment lines
        this.earlierChats = content
          .split('\n')
          .filter(line => !line.startsWith('#') && line.trim())
          .join('\n');
        console.log('📜 Loaded earlier chat history for context');
      }
    } catch (error) {
      console.error('Error loading earlier chats:', error.message);
    }
    return this.earlierChats;
  }

  // Load recent session messages
  loadSessionHistory() {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = JSON.parse(fs.readFileSync(this.historyPath, 'utf-8'));
        this.messages = data.messages || [];
        console.log(`💬 Loaded ${this.messages.length} messages from current session`);
      }
    } catch (error) {
      console.error('Error loading session history:', error.message);
      this.messages = [];
    }
    return this.messages;
  }

  // Add a new message to history
  addMessage(sender, content, timestamp = new Date()) {
    const message = {
      sender,
      content,
      timestamp: timestamp.toISOString()
    };
    this.messages.push(message);
    this.saveSessionHistory();
    return message;
  }

  // Save session history to file
  saveSessionHistory() {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.historyPath,
        JSON.stringify({ messages: this.messages }, null, 2)
      );
    } catch (error) {
      console.error('Error saving session history:', error.message);
    }
  }

  // Get formatted context for AI
  getContextForAI() {
    const recentMessages = this.messages.slice(-config.MAX_CONTEXT_MESSAGES);

    let context = '';

    // Add earlier chat history if available
    if (this.earlierChats) {
      context += '=== EARLIER CONVERSATION HISTORY ===\n';
      context += this.earlierChats;
      context += '\n\n=== RECENT MESSAGES (CURRENT SESSION) ===\n';
    }

    // Add recent session messages
    if (recentMessages.length > 0) {
      recentMessages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleString();
        context += `[${time}] ${msg.sender}: ${msg.content}\n`;
      });
    }

    return context;
  }

  // Clear session history (keeps earlier chats)
  clearSessionHistory() {
    this.messages = [];
    this.saveSessionHistory();
    console.log('🗑️ Session history cleared');
  }
}

export default new ChatHistoryManager();
