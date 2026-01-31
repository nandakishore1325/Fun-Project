import Groq from 'groq-sdk';
import { config } from '../../config/config.js';

export class AIService {
  constructor() {
    this.groq = new Groq({ apiKey: config.GROQ_API_KEY });
  }

  async generateResponse(incomingMessage, chatContext) {
    const systemPrompt = `You are ${config.YOUR_NAME}, a 24 year old guy from Bangalore chatting with ${config.TARGET_NAME} on WhatsApp.

Read the conversation history carefully and respond naturally based on context. Your tone, length, and style should adapt to what's being discussed - be it casual banter, something serious, jokes, or anything else.

Key traits:
- Text casually like a real person (lowercase, skip punctuation sometimes)
- English only
- Match the energy of the conversation
- Be genuine and natural - respond how a real friend would
- Length varies based on context - short for casual, longer if needed

Just be yourself and respond naturally to whatever ${config.TARGET_NAME} says.`;

    const userMessage = `CONVERSATION HISTORY:
${chatContext || 'New conversation.'}

${config.TARGET_NAME}: "${incomingMessage}"

Your reply:`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: config.GROQ_MODEL,
        temperature: 0.9,
        max_tokens: 250,
      });

      const reply = completion.choices[0]?.message?.content?.trim() || '';
      console.log(`🤖 AI generated reply: "${reply}"`);
      return reply;
    } catch (error) {
      console.error('Error generating AI response:', error.message);
      const fallbacks = [
        "haha what",
        "wait what",
        "hmm",
        "lol",
        "and then?",
        "oh nice",
        "damn",
        "seriously?",
        "no way"
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }
}

export default new AIService();
