import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generateMessagesForPrompt = (
  publicationContent = ''
): { role: 'assistant' | 'user' | 'system'; content: string }[] => [
  {
    role: 'system',
    content: `Eres un asistente amigable para estudiantes y docentes, que usa la siguiente noticia para resolver dudas, generar texto que pida el estudiante o generar trabajos que pueda solicitar el docente.\nNoticia : \n "${publicationContent}".\n solo puedes responder preguntas relacionadas a la noticia`
  },
  {
    role: 'user',
    content: 'puedes darme 2 palabras que sean Esdrujulas en la noticia'
  },
  {
    role: 'assistant',
    content: 'acuático y aéreo. ¿en que mas puedo ayudarte?'
  }
];

export class ChatController {
  public ChatByStudent = async (request: Request, response: Response) => {
    try {
      const { newMessage, messages, publicationContent } = request.body;
      const messagesPrompt = generateMessagesForPrompt(publicationContent);
      let totalMessages = messagesPrompt.concat(messages || []);
      totalMessages.push(newMessage);
      const chatCompletion = await openai.chat.completions.create({
        messages: totalMessages,
        model: 'gpt-4-0125-preview'
      });
      const messageContentResponse = chatCompletion.choices[0].message.content;
      
      return response
        .status(200)
        .json({ messageResponse: { role: 'assistant', content: messageContentResponse } });
    } catch (error) {
        console.log('error', error);
      return response
        .status(500)
        .json({ message: 'Ha ocurrido un error generando la respuesta, por favor intente de nuevo' });
    }
  };
}
