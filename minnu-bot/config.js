// Configuration for Minnu Bot

export const config = {
  // Your Google Gemini API key
  GEMINI_API_KEY: 'AIzaSyDVcmYRO6XEYAddTpPTla_xk5ARSuB1NO0',

  // Minnu's phone number
  TARGET_PHONE_NUMBER: '917356968830',

  // Delay before sending reply (20 seconds)
  REPLY_DELAY_MS: 20000,

  // Your name
  YOUR_NAME: 'Nandakishore',

  // Her name
  TARGET_NAME: 'Minnu',

  // Max context messages
  MAX_CONTEXT_MESSAGES: 50,

  // Gemini model
  GEMINI_MODEL: 'gemini-1.5-flash',

  // Minnu-specific paths
  CHAT_HISTORY_FILE: './minnu-bot/data/chat_history.json',
  EARLIER_CHATS_FILE: './minnu-bot/data/earlier_chats.txt',
  SESSION_PATH: './minnu-bot/data/session'
};
