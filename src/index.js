import WhatsAppBot from './services/whatsappClient.js';
import { config } from '../config/config.js';

// Validate configuration
function validateConfig() {
  const errors = [];

  if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === 'your-api-key-here') {
    errors.push('❌ GEMINI_API_KEY is not set. Get one FREE at https://aistudio.google.com/apikey');
  }

  if (!config.TARGET_PHONE_NUMBER || config.TARGET_PHONE_NUMBER === '919876543210') {
    errors.push('⚠️ TARGET_PHONE_NUMBER might not be set (using default). Update in config/config.js');
  }

  if (errors.length > 0) {
    console.log('\n⚠️ Configuration warnings:\n');
    errors.forEach(err => console.log(err));
    console.log('\nEdit config/config.js to fix these issues.\n');

    // Only exit if API key is missing
    if (errors.some(e => e.includes('GEMINI_API_KEY'))) {
      console.log('Cannot start without API key. Exiting...');
      process.exit(1);
    }
  }
}

// Main entry point
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║     🤖 WhatsApp Contextual Bot                        ║
║     Auto-reply with AI-powered contextual messages    ║
║     Powered by Google Gemini (FREE)                   ║
╚═══════════════════════════════════════════════════════╝
`);

  // Validate config
  validateConfig();

  // Create bot instance
  const bot = new WhatsAppBot();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await bot.stop();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
  });

  // Start the bot
  try {
    await bot.start();
  } catch (error) {
    console.error('Failed to start bot:', error.message);
    process.exit(1);
  }
}

// Run
main();
