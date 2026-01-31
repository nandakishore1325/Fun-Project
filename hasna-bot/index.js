// Hasna Bot - Self-contained WhatsApp contextual reply bot (Groq)
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import Groq from 'groq-sdk';
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
        console.log('📝 No earlier chat history found.');
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
      context += '\n\n=== RECENT MESSAGES ===\n';
    }

    if (recentMessages.length > 0) {
      recentMessages.forEach(msg => {
        context += `${msg.sender}: ${msg.content}\n`;
      });
    }

    return context;
  }
}

// ============ AI SERVICE (GROQ) ============
class AIService {
  constructor() {
    this.groq = new Groq({ apiKey: config.GROQ_API_KEY });
  }

  async generateResponse(incomingMessage, chatContext) {
    const systemPrompt = `You are ${config.YOUR_NAME}, a 24 year old guy from Bangalore chatting with ${config.TARGET_NAME} on WhatsApp.

Read the conversation history carefully and respond naturally based on context. Your tone, length, and style should adapt to what's being discussed - be it casual banter, something serious, jokes, or anything else.

Key traits:
- Text casually like a real person (lowercase, skip punctuation sometimes)
- English only
- Match the energy of the conversation
- Be genuine and natural - respond how a real friend would
- Length varies based on context - short for casual, longer if needed

Just be yourself and respond naturally to whatever ${config.TARGET_NAME} says.`;

    const userMessage = `CONVERSATION HISTORY:
${chatContext || 'New conversation.'}

${config.TARGET_NAME}: "${incomingMessage}"

Your reply:`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: config.GROQ_MODEL,
        temperature: 0.9,
        max_tokens: 250,
      });

      const reply = completion.choices[0]?.message?.content?.trim() || '';
      console.log(`🤖 AI generated reply: "${reply}"`);
      return reply;
    } catch (error) {
      console.error('Error generating AI response:', error.message);
      const fallbacks = [
        "haha what",
        "wait what",
        "hmm",
        "lol",
        "and then?",
        "oh nice",
        "damn",
        "seriously?",
        "no way"
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
║     Powered by Groq (Llama) - FREE & FAST             ║
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
