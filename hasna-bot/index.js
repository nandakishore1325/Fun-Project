// Hasna Bot - Self-contained WhatsApp contextual reply bot
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============ CHAT HISTORY MANAGER ============
class ChatHistoryManager {
  constructor() {
    this.historyPath = path.join(__dirname, 'data', 'chat_history.json');
    this.earlierChatsPath = path.join(__dirname, 'data', 'earlier_chats.txt');
    this.messages = [];
    this.earlierChats = '';
  }

  loadEarlierChats() {
    try {
      if (fs.existsSync(this.earlierChatsPath)) {
        const content = fs.readFileSync(this.earlierChatsPath, 'utf-8');
        this.earlierChats = content
          .split('\n')
          .filter(line => !line.startsWith('#') && line.trim())
          .join('\n');
        console.log('📜 Loaded earlier chat history with Hasna');
      } else {
        console.log('📝 No earlier chat history found. Add chats to hasna-bot/data/earlier_chats.txt');
      }
    } catch (error) {
      console.error('Error loading earlier chats:', error.message);
    }
    return this.earlierChats;
  }

  loadSessionHistory() {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = JSON.parse(fs.readFileSync(this.historyPath, 'utf-8'));
        this.messages = data.messages || [];
        console.log(`💬 Loaded ${this.messages.length} messages from current session`);
      }
    } catch (error) {
      this.messages = [];
    }
    return this.messages;
  }

  addMessage(sender, content, timestamp = new Date()) {
    const message = { sender, content, timestamp: timestamp.toISOString() };
    this.messages.push(message);
    this.saveSessionHistory();
    return message;
  }

  saveSessionHistory() {
    try {
      const dir = path.dirname(this.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.historyPath, JSON.stringify({ messages: this.messages }, null, 2));
    } catch (error) {
      console.error('Error saving session history:', error.message);
    }
  }

  getContextForAI() {
    const recentMessages = this.messages.slice(-config.MAX_CONTEXT_MESSAGES);
    let context = '';

    if (this.earlierChats) {
      context += '=== EARLIER CONVERSATION HISTORY ===\n';
      context += this.earlierChats;
      context += '\n\n=== RECENT MESSAGES (CURRENT SESSION) ===\n';
    }

    if (recentMessages.length > 0) {
      recentMessages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleString();
        context += `[${time}] ${msg.sender}: ${msg.content}\n`;
      });
    }

    return context;
  }
}

// ============ AI SERVICE ============
class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      generationConfig: { maxOutputTokens: 256, temperature: 0.9 }
    });
  }

  async generateResponse(incomingMessage, chatContext) {
    const prompt = `You are helping ${config.YOUR_NAME} reply to their friend ${config.TARGET_NAME} on WhatsApp.

Your job is to generate a reply that:
1. Is FUN and light-hearted - use humor, playful teasing, witty comebacks
2. Is SAFE - never offensive, mean-spirited, or inappropriate
3. Is CONTEXTUAL - references their shared history and ongoing conversation naturally
4. ENCOURAGES A RESPONSE - ask questions, share opinions that invite discussion, use hooks
5. Feels NATURAL - like a real person texting, not a bot
6. Is CONCISE - typically 1-3 sentences, like real WhatsApp messages

IMPORTANT RULES:
- Never be mean, rude, or hurtful
- Never discuss anything inappropriate
- Keep responses SHORT - this is WhatsApp, not email!

Here's the conversation context:

${chatContext || 'No previous conversation history available.'}

---
LATEST MESSAGE FROM ${config.TARGET_NAME}:
"${incomingMessage}"

---
Generate a fun, contextual reply. Just respond with the message text only.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const reply = response.text().trim();
      console.log(`🤖 AI generated reply: "${reply}"`);
      return reply;
    } catch (error) {
      console.error('Error generating AI response:', error.message);
      const fallbacks = [
        "Haha that's interesting! Tell me more 😄",
        "Wait what?? You can't just drop that and not explain!",
        "Okay I need the full story now 👀",
        "lol nice! What else is going on with you?"
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }
}

// ============ WHATSAPP BOT ============
class WhatsAppBot {
  constructor() {
    this.chatHistory = new ChatHistoryManager();
    this.aiService = new AIService();

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, 'data', 'session')
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      }
    });

    this.pendingReplies = new Map();
    this.isReady = false;
    this.targetChatId = `${config.TARGET_PHONE_NUMBER}@c.us`;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('qr', (qr) => {
      console.log('\n📱 Scan this QR code with WhatsApp:\n');
      qrcode.generate(qr, { small: true });
      console.log('\nOpen WhatsApp > Settings > Linked Devices > Link a Device\n');
    });

    this.client.on('ready', () => {
      this.isReady = true;
      console.log('✅ Hasna Bot is ready!');
      console.log(`🎯 Listening for messages from: ${config.TARGET_NAME} (${config.TARGET_PHONE_NUMBER})`);
      console.log(`⏱️ Reply delay: ${config.REPLY_DELAY_MS / 1000} seconds`);
      console.log('\n--- Bot is now active ---\n');
    });

    this.client.on('authenticated', () => console.log('🔐 Authentication successful!'));
    this.client.on('auth_failure', (msg) => console.error('❌ Authentication failed:', msg));
    this.client.on('disconnected', (reason) => {
      console.log('📴 Client disconnected:', reason);
      this.isReady = false;
    });

    this.client.on('message', async (message) => {
      await this.handleIncomingMessage(message);
    });
  }

  async handleIncomingMessage(message) {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      const senderId = message.from;

      if (senderId !== this.targetChatId) return;
      if (chat.isGroup || message.isStatus || message.fromMe) return;

      const messageBody = message.body;
      if (!messageBody || messageBody.trim() === '') return;

      console.log(`\n📨 Message from ${config.TARGET_NAME}: "${messageBody}"`);
      this.chatHistory.addMessage(config.TARGET_NAME, messageBody);

      if (this.pendingReplies.has(senderId)) {
        clearTimeout(this.pendingReplies.get(senderId));
        console.log('⏸️ Cancelled previous pending reply (new message received)');
      }

      console.log(`⏳ Waiting ${config.REPLY_DELAY_MS / 1000} seconds before replying...`);

      const timeoutId = setTimeout(async () => {
        await this.sendContextualReply(message, chat);
        this.pendingReplies.delete(senderId);
      }, config.REPLY_DELAY_MS);

      this.pendingReplies.set(senderId, timeoutId);
    } catch (error) {
      console.error('Error handling message:', error.message);
    }
  }

  async sendContextualReply(originalMessage, chat) {
    try {
      await chat.sendStateTyping();
      const context = this.chatHistory.getContextForAI();
      const reply = await this.aiService.generateResponse(originalMessage.body, context);
      const typingTime = Math.min(reply.length * 50, 3000);
      await this.sleep(typingTime);
      await chat.sendMessage(reply);
      console.log(`✉️ Sent reply: "${reply}"`);
      this.chatHistory.addMessage(config.YOUR_NAME, reply);
    } catch (error) {
      console.error('Error sending reply:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async start() {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║     🤖 Hasna Bot                                      ║
║     Auto-reply with AI-powered contextual messages    ║
║     Powered by Google Gemini (FREE)                   ║
╚═══════════════════════════════════════════════════════╝
`);
    this.chatHistory.loadEarlierChats();
    this.chatHistory.loadSessionHistory();
    await this.client.initialize();
  }

  async stop() {
    console.log('\n🛑 Stopping Hasna bot...');
    for (const [chatId, timeoutId] of this.pendingReplies) {
      clearTimeout(timeoutId);
    }
    this.pendingReplies.clear();
    if (this.client) await this.client.destroy();
    console.log('👋 Hasna Bot stopped. Goodbye!');
  }
}

// ============ MAIN ============
const bot = new WhatsAppBot();

process.on('SIGINT', async () => { await bot.stop(); process.exit(0); });
process.on('SIGTERM', async () => { await bot.stop(); process.exit(0); });

bot.start().catch(err => {
  console.error('Failed to start Hasna bot:', err.message);
  process.exit(1);
});
