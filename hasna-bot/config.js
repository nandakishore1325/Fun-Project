// Configuration for Hasna Bot

export const config = {
  // Your Groq API key (FREE) - set via environment variable
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  // Hasna's phone number
  TARGET_PHONE_NUMBER: '919539073546',

  // Delay before sending reply (10 seconds)
  REPLY_DELAY_MS: 10000,

  // Your name
  YOUR_NAME: 'Nandakishore',

  // Her name
  TARGET_NAME: 'Hasna',

  // Max context messages
  MAX_CONTEXT_MESSAGES: 50,

  // Groq model
  GROQ_MODEL: 'llama-3.1-8b-instant',

  // Hasna-specific paths
  CHAT_HISTORY_FILE: './hasna-bot/data/chat_history.json',
  EARLIER_CHATS_FILE: './hasna-bot/data/earlier_chats.txt',
  SESSION_PATH: './hasna-bot/data/session'
};
