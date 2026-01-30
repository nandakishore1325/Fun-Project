# WhatsApp Contextual Bot

A fun WhatsApp bot that automatically replies to a specific contact with contextual, AI-powered messages. It waits 20 seconds after receiving a message before sending a thoughtful, conversation-continuing reply.

**Powered by Google Gemini API (FREE!)**

## Features

- **Targeted Replies**: Only responds to one specific contact (you choose who)
- **20-Second Delay**: Waits before replying to seem natural and human-like
- **Contextual AI**: Uses Google Gemini to generate replies based on conversation history
- **Chat History**: Import your earlier WhatsApp chats for better context
- **Fun & Safe**: Replies are witty, friendly, and encourage continued conversation
- **FREE**: Uses Google Gemini's generous free tier (60 requests/minute)

## Prerequisites

- Node.js 18 or higher
- A Google Gemini API key (FREE - [get one here](https://aistudio.google.com/apikey))
- A WhatsApp account
- Google Chrome or Chromium browser installed

## Setup

### 1. Get Your FREE Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the Bot

Edit `config/config.js` with your settings:

```javascript
// Your FREE Gemini API key
GEMINI_API_KEY: 'your-api-key-here',

// Target phone number (country code + number, no + sign)
// Example: 919876543210 for Indian number +91 98765 43210
TARGET_PHONE_NUMBER: '919876543210',

// Your name and theirs (for context)
YOUR_NAME: 'Me',
TARGET_NAME: 'Friend',

// Reply delay in milliseconds (default: 20000 = 20 seconds)
REPLY_DELAY_MS: 20000,
```

Or use environment variables:

```bash
export GEMINI_API_KEY=your-api-key-here
export TARGET_PHONE_NUMBER=919876543210
export YOUR_NAME=Me
export TARGET_NAME=Friend
```

### 4. Add Earlier Chat History (Optional but Recommended)

Export your WhatsApp chat with the target contact:

1. Open WhatsApp > the chat with your target contact
2. Tap menu (⋮) > More > Export chat
3. Choose "Without media"
4. Copy the contents

Paste the exported chat into `data/earlier_chats.txt`. This gives the AI context about your relationship and conversation style.

### 5. Start the Bot

```bash
npm start
```

### 6. Link WhatsApp

When the bot starts, you'll see a QR code in the terminal:

1. Open WhatsApp on your phone
2. Go to Settings > Linked Devices > Link a Device
3. Scan the QR code

Once linked, the bot will start monitoring for messages from your target contact.

## How It Works

```
Message received from target contact
           ↓
    Wait 20 seconds
           ↓
   Load chat history
           ↓
 Generate AI response (Gemini)
           ↓
    Send reply
           ↓
   Save to history
```

If multiple messages arrive during the 20-second wait, the timer resets to ensure the reply considers all recent messages.

## Project Structure

```
├── config/
│   ├── config.js          # Main configuration
│   └── .env.example       # Environment variables template
├── data/
│   ├── earlier_chats.txt  # Paste your WhatsApp export here
│   ├── chat_history.json  # Session messages (auto-generated)
│   └── whatsapp-session/  # WhatsApp auth data (auto-generated)
├── src/
│   ├── index.js           # Entry point
│   ├── services/
│   │   ├── aiService.js   # Gemini AI integration
│   │   └── whatsappClient.js  # WhatsApp bot logic
│   └── utils/
│       └── chatHistory.js # Chat history management
└── package.json
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `GEMINI_API_KEY` | - | Your FREE Google Gemini API key |
| `TARGET_PHONE_NUMBER` | - | Phone number to reply to (with country code) |
| `REPLY_DELAY_MS` | 20000 | Delay before replying (ms) |
| `YOUR_NAME` | "Me" | Your name for context |
| `TARGET_NAME` | "Friend" | Their name for context |
| `MAX_CONTEXT_MESSAGES` | 50 | Recent messages to include |
| `GEMINI_MODEL` | gemini-1.5-flash | AI model (fast & free) |

## Tips for Best Results

1. **Add chat history**: The more context, the better the replies
2. **Be specific with names**: Use actual names, not just "Me" and "Friend"
3. **Let it warm up**: The first few replies might be generic; it gets better with context
4. **Adjust delay**: Change `REPLY_DELAY_MS` if 20 seconds feels too fast/slow

## Stopping the Bot

Press `Ctrl+C` to gracefully stop the bot. Your session will be saved for next time.

## Troubleshooting

**QR code not appearing?**
- Make sure Chrome/Chromium is installed
- Try running with `DEBUG=* npm start` for more logs

**Authentication failing?**
- Delete the `data/whatsapp-session` folder and try again
- Make sure you're scanning quickly (QR codes expire)

**Bot not responding?**
- Verify the phone number format (country code + number, no + sign)
- Check the console for error messages
- Make sure your Gemini API key is valid

**API errors?**
- The free tier has limits (60 requests/minute). If exceeded, wait a minute.
- Make sure your API key is correctly copied

## Disclaimer

This bot is for personal, fun use only. Use responsibly and ensure you have consent from the person you're chatting with. Don't use it for spam or harassment.

## License

MIT
