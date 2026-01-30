import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { config } from '../../config/config.js';
import chatHistory from '../utils/chatHistory.js';
import aiService from './aiService.js';

export class WhatsAppBot {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './data/naveena-session'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu'
        ]
      }
    });

    this.pendingReplies = new Map(); // Track pending delayed replies
    this.isReady = false;
    this.targetChatId = `${config.TARGET_PHONE_NUMBER}@c.us`;

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // QR Code for authentication
    this.client.on('qr', (qr) => {
      console.log('\n📱 Scan this QR code with WhatsApp:\n');
      qrcode.generate(qr, { small: true });
      console.log('\nOpen WhatsApp > Settings > Linked Devices > Link a Device\n');
    });

    // Ready event
    this.client.on('ready', () => {
      this.isReady = true;
      console.log('✅ WhatsApp bot is ready!');
      console.log(`🎯 Listening for messages from: ${config.TARGET_PHONE_NUMBER}`);
      console.log(`⏱️ Reply delay: ${config.REPLY_DELAY_MS / 1000} seconds`);
      console.log('\n--- Bot is now active ---\n');
    });

    // Authentication success
    this.client.on('authenticated', () => {
      console.log('🔐 Authentication successful!');
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg);
    });

    // Disconnected
    this.client.on('disconnected', (reason) => {
      console.log('📴 Client disconnected:', reason);
      this.isReady = false;
    });

    // Message received
    this.client.on('message', async (message) => {
      await this.handleIncomingMessage(message);
    });
  }

  async handleIncomingMessage(message) {
    try {
      // Get the chat
      const chat = await message.getChat();
      const contact = await message.getContact();

      // Only respond to messages from the target contact
      const senderId = message.from;

      if (senderId !== this.targetChatId) {
        return; // Ignore messages from other contacts
      }

      // Ignore group messages
      if (chat.isGroup) {
        return;
      }

      // Ignore status broadcasts
      if (message.isStatus) {
        return;
      }

      // Ignore messages sent by us
      if (message.fromMe) {
        return;
      }

      const senderName = contact.pushname || contact.name || config.TARGET_NAME;
      const messageBody = message.body;

      // Ignore empty messages or media-only messages
      if (!messageBody || messageBody.trim() === '') {
        console.log(`📎 Received media/empty message from ${senderName}, skipping...`);
        return;
      }

      console.log(`\n📨 Message from ${senderName}: "${messageBody}"`);

      // Add incoming message to history
      chatHistory.addMessage(config.TARGET_NAME, messageBody);

      // Cancel any pending reply for this chat (in case they sent multiple messages)
      if (this.pendingReplies.has(senderId)) {
        clearTimeout(this.pendingReplies.get(senderId));
        console.log('⏸️ Cancelled previous pending reply (new message received)');
      }

      // Schedule delayed reply
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
      // Show typing indicator
      await chat.sendStateTyping();

      // Get conversation context
      const context = chatHistory.getContextForAI();

      // Generate AI response
      const reply = await aiService.generateResponse(originalMessage.body, context);

      // Simulate typing time based on message length (more natural)
      const typingTime = Math.min(reply.length * 50, 3000); // ~50ms per char, max 3s
      await this.sleep(typingTime);

      // Send the reply
      await chat.sendMessage(reply);
      console.log(`✉️ Sent reply: "${reply}"`);

      // Add our reply to history
      chatHistory.addMessage(config.YOUR_NAME, reply);

    } catch (error) {
      console.error('Error sending reply:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async start() {
    console.log('🚀 Starting WhatsApp Contextual Bot...\n');

    // Load chat histories
    chatHistory.loadEarlierChats();
    chatHistory.loadSessionHistory();

    // Initialize client
    await this.client.initialize();
  }

  async stop() {
    console.log('\n🛑 Stopping bot...');

    // Clear all pending replies
    for (const [chatId, timeoutId] of this.pendingReplies) {
      clearTimeout(timeoutId);
    }
    this.pendingReplies.clear();

    // Destroy client
    if (this.client) {
      await this.client.destroy();
    }

    console.log('👋 Bot stopped. Goodbye!');
  }
}

export default WhatsAppBot;
