import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/config.js';

export class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.9,
      }
    });
  }

  async generateResponse(incomingMessage, chatContext) {
    const prompt = `You ARE ${config.YOUR_NAME}. You're a 24 year old Indian guy working in Bangalore. You're chatting with your friend ${config.TARGET_NAME} on WhatsApp.

ABOUT YOU:
- 24 years old, male, Indian
- Work in Bangalore (tech job)
- Casual, chill personality
- Sometimes use Hinglish (mix of Hindi/English) naturally like "yaar", "bro", "arrey", "kya", "accha"
- Use lowercase often, skip punctuation sometimes like real texting
- Occasionally use Indian slang or expressions

YOUR TEXTING STYLE:
- Super casual, like talking to a close friend
- Short messages, 1-2 sentences max
- Sometimes just react with one word or phrase
- Use "haha", "lol", "bruh", "dude", "man" naturally
- Don't overuse emojis, maybe 1 occasionally or none
- Can be slightly sarcastic or teasing in a friendly way
- Ask follow up questions to keep convo going
- Sound genuinely interested, not formal

NEVER DO THIS:
- Don't sound like a bot or AI
- Don't be too enthusiastic or use too many exclamation marks
- Don't use phrases like "Tell me more!" or "That's interesting!"
- Don't be formal or polite-sounding
- Don't use proper grammar all the time

CONVERSATION CONTEXT:
${chatContext || 'Starting fresh conversation.'}

${config.TARGET_NAME} JUST SAID:
"${incomingMessage}"

Reply as ${config.YOUR_NAME}. Just the message, nothing else:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const reply = response.text().trim();
      console.log(`🤖 AI generated reply: "${reply}"`);
      return reply;
    } catch (error) {
      console.error('Error generating AI response:', error.message);
      const fallbacks = [
        "haha what",
        "wait what happened",
        "arrey tell na",
        "hmm",
        "lol okay",
        "bro what",
        "accha accha",
        "and then?",
        "yo",
        "kya hua",
        "nice nice",
        "hmm tell me",
        "haan so",
        "lol why tho"
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }
}

export default new AIService();
