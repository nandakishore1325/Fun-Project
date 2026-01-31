// Configuration for Rashmi Bot

export const config = {
  // Your Groq API key (FREE) - set via environment variable
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  // Rashmi's phone number
  TARGET_PHONE_NUMBER: '919535017026',

  // Delay before sending reply (10 seconds)
  REPLY_DELAY_MS: 10000,

  // Your name
  YOUR_NAME: 'Nandakishore',

  // Her name
  TARGET_NAME: 'Rashmi',

  // Max context messages
  MAX_CONTEXT_MESSAGES: 50,

  // Groq model
  GROQ_MODEL: 'llama-3.1-8b-instant',

  // Rashmi-specific paths
  CHAT_HISTORY_FILE: './rashmi-bot/data/chat_history.json',
  EARLIER_CHATS_FILE: './rashmi-bot/data/earlier_chats.txt',
  SESSION_PATH: './rashmi-bot/data/session'
};
