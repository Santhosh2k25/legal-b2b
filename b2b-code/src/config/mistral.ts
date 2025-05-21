import MistralClient from '@mistralai/mistralai';

const apiKey = 'HDijPhnvnvhaHQ459km1DTVwEdOamEU2';
const client = new MistralClient(apiKey);

export const mistralClient = {
  async chat(messages: any[]) {
    try {
      const chatResponse = await client.chat({
        model: 'mistral-large-latest',
        messages: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      });

      return chatResponse.choices[0].message.content;
    } catch (error) {
      console.error('Error calling Mistral AI:', error);
      throw error;
    }
  }
};