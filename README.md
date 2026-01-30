# WhatsApp Auto-Reply Bot

A Node.js bot that automatically replies to every message in a specific WhatsApp group using Google's Gemini AI (FREE) for intelligent, contextual responses.

## How It Works

1. Connects to WhatsApp Web via QR code scan
2. Monitors your specified group ("YOLO✨")
3. Uses Gemini AI to generate contextual replies to every message
4. Maintains conversation history for better context awareness

## Prerequisites

- **Node.js** version 16 or higher
- **Google Chrome** or Chromium browser installed
- **Google Gemini API key** (FREE - get one at https://aistudio.google.com/apikey)

## Setup Instructions

### Step 1: Get Your FREE Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure the Bot

Edit `config.json` and add your Gemini API key:

```json
{
  "targetGroupName": "YOLO✨",
  "geminiApiKey": "YOUR_GEMINI_API_KEY_HERE",
  "systemPrompt": "You are a friendly and helpful participant...",
  "model": "gemini-1.5-flash"
}
```

### Step 4: Run the Bot

```bash
npm start
```

### Step 5: Link Your WhatsApp

1. QR code appears in terminal
2. Open WhatsApp on your phone
3. Go to **Settings > Linked Devices > Link a Device**
4. Scan the QR code

## Features

- **FREE AI**: Uses Google Gemini with generous free tier
- **Contextual Replies**: Understands and responds to messages naturally
- **Conversation Memory**: Remembers last 20 messages for context
- **Group-Specific**: Only responds in your specified group
- **Session Persistence**: Saves login so you don't scan QR every time

## Customizing the Bot's Personality

Edit the `systemPrompt` in `config.json`:

```json
{
  "systemPrompt": "You are a witty and sarcastic friend. Keep responses short and funny."
}
```

## Free Tier Limits

Gemini's free tier includes:
- 15 requests per minute
- 1 million tokens per minute
- 1,500 requests per day

This is more than enough for personal group chat use.

## Troubleshooting

**"API key not valid" error?**
- Get a free key at https://aistudio.google.com/apikey

**Bot not replying?**
- Check the group name matches exactly (including emojis)

**Session expired?**
- Delete `.wwebjs_auth` folder and restart

## Disclaimer

- Uses unofficial WhatsApp Web API - use responsibly
- Automated messaging may violate WhatsApp ToS if abused
