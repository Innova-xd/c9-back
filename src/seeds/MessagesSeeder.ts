import { DataSource } from "typeorm";
import { Seeder, SeederFactoryManager } from "typeorm-extension";
import { Messages } from "../entity/Messages";

export class MessagesSeeder implements Seeder {
   async run(
      dataSource: DataSource,
      factoryManager: SeederFactoryManager
   ): Promise<any> {
      const messageRepository = dataSource.getRepository(Messages);

      const messageData = [
         {
            role: "user",
            content: "Hola!",
            chat: { id: 1 },
         },
         {
            role: "ia",
            content: "¡Hola! ¿En qué te puedo ayudar?",
            chat: { id: 1 },

         },
         {
            role: "user",
            content: "Cuéntame más acerca de esta noticia.",
            chat: { id: 1 },

         },
         {
            role: "ia",
            content: "Claro, aquí hay más detalles:",
            chat: { id: 1 },

         },
         {
            role: "user",
            content: "AI, ayúdame a redactar la noticia de nuevo",
            chat: { id: 2 },

         },
         {
            role: "ia",
            content: "Claro! ¿Qué tono deseas usar?",
            chat: { id: 2 },
         },
         {
            role: "user",
            content: "Un tono más alegre",
            chat: { id: 2 },
         },
         {
            role: "user",
            content: "¿Cómo puedo destacar el segundo párrafo?",
            chat: { id: 3 },
         },
         {
            role: "ia",
            content: "Puedes ponerlo en negrita",
            chat: { id: 3 }
         },
         {
            role: "user",
            content: "Me refiero a hacerlo más expresivo",
            chat: { id: 3 }
         },
         {
            role: "ia",
            content: "Entiendo. Acá hay una propuesta de redacción:",
            chat: { id: 3 }
         },
      ];

      const messages = messageRepository.create(messageData);
      await messageRepository.save(messages);
   }
}
