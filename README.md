# WhatsApp Auto-Reply Bot

A Node.js bot that automatically replies to every message in a specific WhatsApp group using Claude AI for intelligent, contextual responses.

## How It Works

1. Connects to WhatsApp Web via QR code scan
2. Monitors your specified group ("YOLO✨")
3. Uses Claude AI to generate contextual replies to every message
4. Maintains conversation history for better context awareness

## Prerequisites

- **Node.js** version 16 or higher
- **Google Chrome** or Chromium browser installed
- **Anthropic API key** (get one at https://console.anthropic.com/)

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure the Bot

Edit `config.json` and add your Anthropic API key:

```json
{
  "targetGroupName": "YOLO✨",
  "anthropicApiKey": "YOUR_ANTHROPIC_API_KEY_HERE",
  "systemPrompt": "You are a friendly and helpful participant in a WhatsApp group chat...",
  "model": "claude-sonnet-4-20250514"
}
```

**Configuration options:**
- `targetGroupName`: The WhatsApp group to monitor
- `anthropicApiKey`: Your Anthropic API key
- `systemPrompt`: Instructions for how the bot should respond
- `model`: Claude model to use (claude-sonnet-4-20250514 recommended for balance of speed/quality)

### Step 3: Run the Bot

```bash
npm start
```

### Step 4: Link Your WhatsApp

1. QR code appears in terminal
2. Open WhatsApp on your phone
3. Go to **Settings > Linked Devices > Link a Device**
4. Scan the QR code

## Features

- **Contextual AI Replies**: Uses Claude to understand and respond to messages naturally
- **Conversation Memory**: Remembers the last 20 messages for context
- **Group-Specific**: Only responds in your specified group
- **Self-Aware**: Won't reply to its own messages
- **Session Persistence**: Saves login so you don't need to scan QR every time

## Customizing the Bot's Personality

Edit the `systemPrompt` in `config.json` to change how the bot responds:

```json
{
  "systemPrompt": "You are a witty and sarcastic friend. Keep responses short and funny."
}
```

```json
{
  "systemPrompt": "You are a helpful assistant. Answer questions clearly and provide useful information."
}
```

## Important Notes

- Keep your terminal running for the bot to stay active
- The bot will reply to every message from others in the group
- API usage is charged per message (check Anthropic pricing)
- Press `Ctrl+C` to stop the bot

## Troubleshooting

**"Invalid API key" error?**
- Make sure you've added your Anthropic API key to `config.json`
- Get a key at https://console.anthropic.com/

**Bot not replying?**
- Check the group name matches exactly (including emojis)
- Make sure you have API credits

**Session expired?**
- Delete `.wwebjs_auth` folder and restart to scan a new QR code

## Disclaimer

- Uses unofficial WhatsApp Web API - use responsibly
- API costs apply for Claude usage
- Automated messaging may violate WhatsApp ToS if abused
