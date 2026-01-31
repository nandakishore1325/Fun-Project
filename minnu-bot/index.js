// Minnu Bot - Self-contained WhatsApp contextual reply bot (Groq)
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
        console.log('📜 Loaded earlier chat history with Minnu');
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
    const systemPrompt = `You ARE ${config.YOUR_NAME}. You're a 24 year old guy working in Bangalore. You're chatting with ${config.TARGET_NAME} on WhatsApp.

ABOUT YOU:
- 24 years old, male
- Work in Bangalore (tech job)
- Caring, understanding, and patient personality
- You're someone people feel comfortable opening up to
- Speak in ENGLISH only
- Use lowercase often, skip punctuation sometimes like real texting

YOUR PERSONALITY:
- You genuinely care about ${config.TARGET_NAME} and want to understand them
- You're reliable - the kind of person people can count on
- You're approachable and easy to talk to
- You listen more than you talk - acknowledge what they say before responding
- You're supportive without being overbearing or preachy
- You ask thoughtful follow-up questions that show you're paying attention
- You remember details from the conversation and reference them naturally

YOUR TEXTING STYLE:
- Warm and friendly, but calm and grounded
- Message length depends on context:
  - For casual chat: keep it short, 1-2 sentences
  - For emotional or deep topics: take your time, 3-5 sentences is fine
  - When they share something heavy: respond thoughtfully, reflect on their feelings
- Show you're listening by reflecting back what they said sometimes
- Use "hmm", "i get that", "makes sense", "yeah i hear you" naturally
- Ask gentle questions like "how are you feeling about that?" or "what happened then?"
- When discussing emotions, think deeper - acknowledge the complexity of feelings
- Don't overuse emojis, maybe 1 occasionally or none
- Be present and attentive, not distracted or rushed
- Give space for them to share more if they want

NEVER DO THIS:
- Don't sound like a bot or AI
- Don't be overwhelming or too intense
- Don't give unsolicited advice or try to fix everything
- Don't be dismissive or brush off their feelings
- Don't use phrases like "Tell me more!" or "That's so interesting!"
- Don't be formal or use proper grammar all the time
- Don't use Hindi or Hinglish words
- Don't make it about yourself - focus on them`;

    const userMessage = `CONVERSATION SO FAR:
${chatContext || 'Starting fresh conversation.'}

${config.TARGET_NAME} just said: "${incomingMessage}"

Reply as ${config.YOUR_NAME} (just the message, nothing else):`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: config.GROQ_MODEL,
        temperature: 0.9,
        max_tokens: 300,
      });

      const reply = completion.choices[0]?.message?.content?.trim() || '';
      console.log(`🤖 AI generated reply: "${reply}"`);
      return reply;
    } catch (error) {
      console.error('Error generating AI response:', error.message);
      const fallbacks = [
        "hmm i get that",
        "yeah i hear you",
        "that makes sense",
        "how are you feeling about it?",
        "what happened then?",
        "im here",
        "take your time",
        "yeah?",
        "go on",
        "i understand",
        "hmm yeah",
        "and then what?",
        "how so?",
        "that sounds tough",
        "im listening"
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
      console.log('✅ Minnu Bot is ready!');
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
║     🤖 Minnu Bot                                      ║
║     Powered by Groq (Llama) - FREE & FAST             ║
╚═══════════════════════════════════════════════════════╝
`);
    this.chatHistory.loadEarlierChats();
    this.chatHistory.loadSessionHistory();
    await this.client.initialize();
  }

  async stop() {
    console.log('\n🛑 Stopping Minnu bot...');
    for (const [chatId, timeoutId] of this.pendingReplies) {
      clearTimeout(timeoutId);
    }
    this.pendingReplies.clear();
    if (this.client) await this.client.destroy();
    console.log('👋 Minnu Bot stopped. Goodbye!');
  }
}

// ============ MAIN ============
const bot = new WhatsAppBot();

process.on('SIGINT', async () => { await bot.stop(); process.exit(0); });
process.on('SIGTERM', async () => { await bot.stop(); process.exit(0); });

bot.start().catch(err => {
  console.error('Failed to start Minnu bot:', err.message);
  process.exit(1);
});
