// Configuration for the WhatsApp Contextual Bot

export const config = {
  // Your Anthropic API key - get one at https://console.anthropic.com/
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'your-api-key-here',

  // The phone number of the person you want to auto-reply to
  // Format: country code + number (e.g., '919876543210' for India)
  TARGET_PHONE_NUMBER: process.env.TARGET_PHONE_NUMBER || '919876543210',

  // Delay before sending reply (in milliseconds)
  // 20 seconds = 20000 ms
  REPLY_DELAY_MS: 20000,

  // Your name (for context in AI responses)
  YOUR_NAME: process.env.YOUR_NAME || 'Me',

  // Target person's name (for context)
  TARGET_NAME: process.env.TARGET_NAME || 'Friend',

  // Maximum number of recent messages to include as context
  MAX_CONTEXT_MESSAGES: 50,

  // Claude model to use
  CLAUDE_MODEL: 'claude-sonnet-4-20250514',

  // Path to chat history file
  CHAT_HISTORY_FILE: './data/chat_history.json',

  // Path to earlier chats file (paste your WhatsApp export here)
  EARLIER_CHATS_FILE: './data/earlier_chats.txt'
};
