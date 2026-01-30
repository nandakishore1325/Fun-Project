const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config.json');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: config.model });

// Store recent messages for context (per group)
const messageHistory = new Map();
const MAX_HISTORY = 20; // Keep last 20 messages for context

// Create WhatsApp client with local authentication (saves session)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Display QR code in terminal for authentication
client.on('qr', (qr) => {
    console.log('\n========================================');
    console.log('Scan this QR code with your WhatsApp app:');
    console.log('(Open WhatsApp > Settings > Linked Devices > Link a Device)');
    console.log('========================================\n');
    qrcode.generate(qr, { small: true });
});

// Called when client is ready
client.on('ready', () => {
    console.log('\n========================================');
    console.log('WhatsApp Bot is ready and running!');
    console.log(`Monitoring group: "${config.targetGroupName}"`);
    console.log('Using Gemini AI for contextual replies (FREE)');
    console.log('========================================\n');
});

// Called on authentication success
client.on('authenticated', () => {
    console.log('Authentication successful!');
});

// Called if authentication fails
client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});

// Called when client disconnects
client.on('disconnected', (reason) => {
    console.log('Client disconnected:', reason);
});

// Generate contextual reply using Gemini
async function generateReply(senderName, messageText, chatId) {
    // Get or initialize message history for this chat
    if (!messageHistory.has(chatId)) {
        messageHistory.set(chatId, []);
    }
    const history = messageHistory.get(chatId);

    // Add the new message to history
    history.push(`${senderName}: ${messageText}`);

    // Keep only the last MAX_HISTORY messages
    while (history.length > MAX_HISTORY) {
        history.shift();
    }

    // Build conversation context
    const conversationContext = history.join('\n');

    const prompt = `${config.systemPrompt}

Here's the recent chat history:

${conversationContext}

Respond to the latest message from ${senderName}. Remember to be concise and natural. Just give the reply, nothing else.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const replyText = response.text().trim();

        // Add bot's reply to history
        history.push(`Bot: ${replyText}`);

        return replyText;
    } catch (error) {
        console.error('Error generating reply with Gemini:', error.message);
        return null;
    }
}

// Handle incoming messages
client.on('message', async (message) => {
    try {
        // Get the chat this message belongs to
        const chat = await message.getChat();

        // Check if this is a group chat
        if (!chat.isGroup) {
            return; // Ignore non-group messages
        }

        // Check if this is the target group (case-insensitive match)
        const groupName = chat.name.toLowerCase();
        const targetName = config.targetGroupName.toLowerCase();

        if (groupName !== targetName) {
            return; // Ignore messages from other groups
        }

        // Don't reply to our own messages
        if (message.fromMe) {
            return;
        }

        // Skip empty messages or media-only messages
        if (!message.body || message.body.trim() === '') {
            return;
        }

        // Get sender info
        const contact = await message.getContact();
        const senderName = contact.pushname || contact.name || 'Someone';

        // Log the received message
        console.log(`[${new Date().toLocaleTimeString()}] ${senderName}: ${message.body}`);

        // Generate contextual reply using Gemini
        const replyText = await generateReply(senderName, message.body, chat.id._serialized);

        if (replyText) {
            // Send the reply
            await message.reply(replyText);
            console.log(`[${new Date().toLocaleTimeString()}] Bot replied: ${replyText}`);
        } else {
            console.log(`[${new Date().toLocaleTimeString()}] Failed to generate reply`);
        }

    } catch (error) {
        console.error('Error processing message:', error);
    }
});

// Handle errors
client.on('error', (error) => {
    console.error('Client error:', error);
});

// Start the client
console.log('Starting WhatsApp Bot with Gemini AI (FREE)...');
console.log('Please wait for the QR code to appear...\n');
client.initialize();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down bot...');
    await client.destroy();
    process.exit(0);
});
