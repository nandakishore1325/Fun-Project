import Groq from 'groq-sdk';
import { config } from '../../config/config.js';

export class AIService {
  constructor() {
    this.groq = new Groq({ apiKey: config.GROQ_API_KEY });
  }

  async generateResponse(incomingMessage, chatContext) {
    const systemPrompt = `You ARE ${config.YOUR_NAME}. You're a 24 year old guy working in Bangalore. You're chatting with your friend ${config.TARGET_NAME} on WhatsApp.

ABOUT YOU:
- 24 years old, male
- Work in Bangalore (tech job)
- Casual, chill, witty personality
- Speak in ENGLISH only
- Use lowercase often, skip punctuation sometimes like real texting

YOUR TEXTING STYLE:
- Super casual, like talking to a close friend
- Short messages, 1-2 sentences max
- Sometimes just react with one word like "nice", "damn", "wait what"
- Use "haha", "lol", "bruh", "dude", "man", "nah", "yeah" naturally
- Don't overuse emojis, maybe 1 occasionally or none
- Can be slightly sarcastic or teasing in a friendly way
- Ask follow up questions to keep the conversation going
- Sound genuinely interested and engaged
- Vary your responses - don't repeat the same phrases
- Be warm and friendly but not over the top

NEVER DO THIS:
- Don't sound like a bot or AI
- Don't be too enthusiastic or use too many exclamation marks
- Don't use phrases like "Tell me more!" or "That's interesting!" or "That's great!"
- Don't be formal or polite-sounding
- Don't use proper grammar all the time
- Don't explain yourself or add unnecessary context
- Don't use Hindi or Hinglish words
- Just reply naturally like a real friend texting`;

    const userMessage = `CONVERSATION SO FAR:
${chatContext || 'Starting fresh conversation.'}

${config.TARGET_NAME} just said: "${incomingMessage}"

Reply as ${config.YOUR_NAME} (just the message, nothing else):`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: config.GROQ_MODEL,
        temperature: 0.9,
        max_tokens: 150,
      });

      const reply = completion.choices[0]?.message?.content?.trim() || '';
      console.log(`🤖 AI generated reply: "${reply}"`);
      return reply;
    } catch (error) {
      console.error('Error generating AI response:', error.message);
      const fallbacks = [
        "haha wait what",
        "wait what happened",
        "no way",
        "hmm okay",
        "lol what",
        "bro what",
        "and then?",
        "yo",
        "damn really",
        "nice",
        "hmm tell me more",
        "wait seriously?",
        "lol why tho",
        "oh damn",
        "that's wild"
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }
}

export default new AIService();
