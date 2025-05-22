import { Mistral } from '@mistralai/mistralai';

const apiKey = 'HDijPhnvnvhaHQ459km1DTVwEdOamEU2';
const client = new Mistral({ apiKey });

export const mistralClient = {
  async chat(messages: any[]) {
    try {
      const chatResponse = await client.chat.complete({
        model: 'mistral-large-latest',
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      });

      if (!chatResponse.choices || chatResponse.choices.length === 0) {
        throw new Error('No choices returned from Mistral API');
      }
      return chatResponse.choices[0].message.content;
    } catch (error) {
      console.error('Error calling Mistral AI:', error);
      throw error;
    }
  }
};