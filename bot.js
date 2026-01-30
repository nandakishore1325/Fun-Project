const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config.json');

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

        // Get sender info
        const contact = await message.getContact();
        const senderName = contact.pushname || contact.name || 'Unknown';

        // Log the received message
        console.log(`[${new Date().toLocaleTimeString()}] Message from ${senderName}: ${message.body}`);

        // Build the reply message
        let replyText = config.replyMessage;

        // Replace placeholders if they exist in the config
        replyText = replyText.replace('{sender}', senderName);
        replyText = replyText.replace('{message}', message.body);

        // Send the reply
        await message.reply(replyText);

        console.log(`[${new Date().toLocaleTimeString()}] Replied to ${senderName}`);

    } catch (error) {
        console.error('Error processing message:', error);
    }
});

// Handle errors
client.on('error', (error) => {
    console.error('Client error:', error);
});

// Start the client
console.log('Starting WhatsApp Bot...');
console.log('Please wait for the QR code to appear...\n');
client.initialize();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down bot...');
    await client.destroy();
    process.exit(0);
});
