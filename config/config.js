// Configuration for the WhatsApp Contextual Bot (Naveena)

export const config = {
  // Your Groq API key (FREE) - set via environment variable
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  // The phone number of the person you want to auto-reply to
  TARGET_PHONE_NUMBER: process.env.TARGET_PHONE_NUMBER || '919845511393',

  // Delay before sending reply (10 seconds)
  REPLY_DELAY_MS: 10000,

  // Your name
  YOUR_NAME: process.env.YOUR_NAME || 'Nandakishore',

  // Target person's name
  TARGET_NAME: process.env.TARGET_NAME || 'Naveena',

  // Maximum number of recent messages to include as context
  MAX_CONTEXT_MESSAGES: 50,

  // Groq model
  GROQ_MODEL: 'llama-3.1-8b-instant',

  // Path to chat history file
  CHAT_HISTORY_FILE: './data/chat_history.json',

  // Path to earlier chats file
  EARLIER_CHATS_FILE: './data/earlier_chats.txt'
};
