const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config.json');

// Store recent messages for context (per group)
const messageHistory = new Map();
const MAX_HISTORY = 20;

// Cooldown tracking
let lastReplyTime = 0;
const COOLDOWN_MS = 20 * 1000;

// Create WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'yolo-bot',
        dataPath: './data/yolo-session'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n========================================');
    console.log('Scan this QR code with your WhatsApp app:');
    console.log('========================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n========================================');
    console.log('WhatsApp Bot is ready!');
    console.log(`Group: "${config.targetGroupName}"`);
    console.log('Cooldown: 20 seconds');
    console.log('========================================\n');
});

client.on('authenticated', () => console.log('Authenticated!'));
client.on('auth_failure', (msg) => console.error('Auth failed:', msg));
client.on('disconnected', (reason) => console.log('Disconnected:', reason));

// Generate reply using direct API call
async function generateReply(senderName, messageText, chatId) {
    if (!messageHistory.has(chatId)) {
        messageHistory.set(chatId, []);
    }
    const history = messageHistory.get(chatId);
    history.push(`${senderName}: ${messageText}`);

    while (history.length > MAX_HISTORY) {
        history.shift();
    }

    const conversationContext = history.join('\n');
    const prompt = `${config.systemPrompt}\n\nChat history:\n${conversationContext}\n\nRespond to ${senderName}'s latest message. Be concise (1-2 sentences).`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error('API Error:', data.error.message);
            return null;
        }

        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (replyText) {
            history.push(`Bot: ${replyText}`);
        }
        return replyText || null;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

// Handle messages
client.on('message', async (message) => {
    try {
        const chat = await message.getChat();

        if (!chat.isGroup) return;
        if (chat.name.toLowerCase() !== config.targetGroupName.toLowerCase()) return;
        if (message.fromMe) return;
        if (!message.body?.trim()) return;

        const contact = await message.getContact();
        const senderName = contact.pushname || contact.name || 'Someone';

        console.log(`[${new Date().toLocaleTimeString()}] ${senderName}: ${message.body}`);

        const now = Date.now();
        if (now - lastReplyTime < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (now - lastReplyTime)) / 1000);
            console.log(`Cooldown: ${remaining}s remaining`);
            return;
        }

        const replyText = await generateReply(senderName, message.body, chat.id._serialized);

        if (replyText) {
            await message.reply(replyText);
            lastReplyTime = Date.now();
            console.log(`[${new Date().toLocaleTimeString()}] Bot: ${replyText}`);
        } else {
            console.log('Failed to generate reply');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
});

client.on('error', (error) => console.error('Client error:', error));

console.log('Starting bot...\n');
client.initialize();

process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await client.destroy();
    process.exit(0);
});
