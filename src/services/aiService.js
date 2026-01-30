import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config/config.js';

export class AIService {
  constructor() {
    this.client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY
    });
  }

  async generateResponse(incomingMessage, chatContext) {
    const systemPrompt = `You are helping ${config.YOUR_NAME} reply to their friend ${config.TARGET_NAME} on WhatsApp.

Your job is to generate a reply that:
1. Is FUN and light-hearted - use humor, playful teasing, witty comebacks
2. Is SAFE - never offensive, mean-spirited, or inappropriate
3. Is CONTEXTUAL - references their shared history and ongoing conversation naturally
4. ENCOURAGES A RESPONSE - ask questions, share opinions that invite discussion, use hooks
5. Feels NATURAL - like a real person texting, not a bot (use casual language, occasional typos are okay)
6. Is CONCISE - typically 1-3 sentences, like real WhatsApp messages

Personality traits to embody:
- Warm and friendly
- Quick-witted but kind
- Genuinely interested in the conversation
- Occasionally uses emojis (but not excessively)
- Matches the energy of the other person

IMPORTANT RULES:
- Never be mean, rude, or hurtful
- Never discuss anything inappropriate or NSFW
- Never pretend to be someone you're not
- If unsure, lean towards being friendly and asking a follow-up question
- Keep responses SHORT - this is WhatsApp, not email!

Based on the conversation history and the latest message, generate a single reply.`;

    const userPrompt = `Here's the conversation context:

${chatContext || 'No previous conversation history available.'}

---
LATEST MESSAGE FROM ${config.TARGET_NAME}:
"${incomingMessage}"

---
Generate a fun, contextual reply that encourages continued conversation. Just respond with the message text only, no quotes or explanations.`;

    try {
      const response = await this.client.messages.create({
        model: config.CLAUDE_MODEL,
        max_tokens: 256,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      const reply = response.content[0].text.trim();
      console.log(`🤖 AI generated reply: "${reply}"`);
      return reply;
    } catch (error) {
      console.error('Error generating AI response:', error.message);
      // Fallback responses if AI fails
      const fallbacks = [
        "Haha that's interesting! Tell me more 😄",
        "Wait what?? You can't just drop that and not explain!",
        "Okay I need the full story now 👀",
        "lol nice! What else is going on with you?"
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }
}

export default new AIService();
