# WhatsApp Auto-Reply Bot

A Node.js bot that automatically replies to every message in a specific WhatsApp group.

## How It Works

This bot uses the `whatsapp-web.js` library to connect to WhatsApp Web. When you run it:
1. A QR code appears in your terminal
2. You scan it with your WhatsApp app (like linking WhatsApp Web)
3. The bot monitors your specified group and auto-replies to every message

## Prerequisites

- **Node.js** version 16 or higher
- **Google Chrome** or Chromium browser installed on your system

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure the Bot

Edit `config.json` and set your preferences:

```json
{
  "targetGroupName": "My Family Group",
  "replyMessage": "Hello {sender}! Thank you for your message. This is an automated reply."
}
```

- **targetGroupName**: The exact name of the WhatsApp group you want to monitor
- **replyMessage**: The message to send as a reply
  - Use `{sender}` to include the sender's name
  - Use `{message}` to include their original message

### Step 3: Run the Bot

```bash
npm start
```

### Step 4: Link Your WhatsApp

1. When the bot starts, a QR code will appear in your terminal
2. Open WhatsApp on your phone
3. Go to **Settings > Linked Devices > Link a Device**
4. Scan the QR code
5. The bot will connect and start monitoring

## Example Configurations

### Simple Acknowledgment
```json
{
  "targetGroupName": "Work Team",
  "replyMessage": "Thanks for your message! I'll get back to you soon."
}
```

### Personalized Reply
```json
{
  "targetGroupName": "Project Updates",
  "replyMessage": "Hi {sender}! Your message has been received."
}
```

### Away Message
```json
{
  "targetGroupName": "Friends Chat",
  "replyMessage": "Hey {sender}! I'm currently away. I'll respond when I'm back."
}
```

## Important Notes

- The bot only replies to messages in the specified group
- It will not reply to your own messages
- Your WhatsApp session is saved locally (in `.wwebjs_auth` folder), so you don't need to scan the QR code every time
- Keep your terminal/computer running for the bot to stay active
- To stop the bot, press `Ctrl+C`

## Troubleshooting

**QR code not appearing?**
- Make sure Chrome/Chromium is installed
- Try running with `sudo` if you get permission errors

**Bot not replying?**
- Check that `targetGroupName` in `config.json` matches your group name exactly (case-insensitive)
- Make sure you're a member of that group

**Session expired?**
- Delete the `.wwebjs_auth` folder and restart the bot to scan a new QR code

## Disclaimer

This bot uses an unofficial WhatsApp Web API. Use responsibly and be aware that excessive automation may violate WhatsApp's Terms of Service.
