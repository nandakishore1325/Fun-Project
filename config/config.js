// Configuration for the WhatsApp Contextual Bot

export const config = {
  // Your Google Gemini API key - get one FREE at https://aistudio.google.com/apikey
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AIzaSyDVcmYRO6XEYAddTpPTla_xk5ARSuB1NO0',

  // The phone number of the person you want to auto-reply to
  // Format: country code + number (e.g., '919876543210' for India)
  TARGET_PHONE_NUMBER: process.env.TARGET_PHONE_NUMBER || '919845511393',

  // Delay before sending reply (in milliseconds)
  // 20 seconds = 20000 ms
  REPLY_DELAY_MS: 20000,

  // Your name (for context in AI responses)
  YOUR_NAME: process.env.YOUR_NAME || 'Nandakishore',

  // Target person's name (for context)
  TARGET_NAME: process.env.TARGET_NAME || 'Naveena',

  // Maximum number of recent messages to include as context
  MAX_CONTEXT_MESSAGES: 50,

  // Gemini model to use
  GEMINI_MODEL: 'gemini-1.5-flash-latest',

  // Path to chat history file
  CHAT_HISTORY_FILE: './data/chat_history.json',

  // Path to earlier chats file (paste your WhatsApp export here)
  EARLIER_CHATS_FILE: './data/earlier_chats.txt'
};
