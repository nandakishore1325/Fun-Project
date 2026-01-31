// Configuration for Minnu Bot

export const config = {
  // Your Groq API key (FREE) - set via environment variable
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  // Minnu's phone number
  TARGET_PHONE_NUMBER: '917356968830',

  // Delay before sending reply (10 seconds)
  REPLY_DELAY_MS: 10000,

  // Your name
  YOUR_NAME: 'Nandakishore',

  // Her name
  TARGET_NAME: 'Minnu',

  // Max context messages
  MAX_CONTEXT_MESSAGES: 50,

  // Groq model (llama is great for casual chat)
  GROQ_MODEL: 'llama-3.1-8b-instant',

  // Minnu-specific paths
  CHAT_HISTORY_FILE: './minnu-bot/data/chat_history.json',
  EARLIER_CHATS_FILE: './minnu-bot/data/earlier_chats.txt',
  SESSION_PATH: './minnu-bot/data/session'
};
