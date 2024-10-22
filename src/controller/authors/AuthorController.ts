import { AppDataSource } from "../../data-source";
import { Request, Response } from "express";
import { Author } from "../../entity/Author";

// TODO: Add Swagger documentation
export class AuthorController {
   private authorRepository = AppDataSource.getRepository(Author);

   public all = async (request:Request, response: Response,) => {
      try {
         const authors = await this.authorRepository.find();
         if (!authors) {
            return response.status(404).json({message: 'No hay autores.'});
         }
         const authorsOrderByName = authors.sort((a, b) => a.name.localeCompare(b.name));
         return response.status(200).json(authorsOrderByName);
      } catch (error) {
         return response.status(500).json({ message: "Ha ocurrido un error obteniendo todos los Autores: ", error: error.detail });
      }
   };

   public one = async (request: Request, response: Response) => {
      try {
         const id = parseInt(request.params.id, 10);
         const author = await this.authorRepository.findOne({ where: { id } });
         if (author) {
            return response.status(200).json(author);
         }
         return response.status(200).json("No se ha encontrado el Autor");
      } catch (error) {
         return response.status(500).json({ message: "Ocurrió un error obteniendo un Autor: ", error: error.message });
      }
   };

   public save = async (request: Request, response: Response) => {
      try {
         const { name, email, description, photo } = request.body;
         const author = new Author();
         author.name = name;
         author.email = email;
         author.description = description;
         author.photo = photo;
         await this.authorRepository.save(author);
         return response.status(201).json(author);
      } catch (error) {
         return response.status(500).json({ message: "Ocurrió un error guardando un Autor: ", error: error.message });
      }
   };

   public remove = async (request: Request, response: Response) => {
      try {
         const id = parseInt(request.params.id, 10);
         const author = await this.authorRepository.findOne({ where: { id } });
         if (!author) {
            return response.status(404).json({ message: "No se ha encontrado el Autor a eliminar" });
         }
         await this.authorRepository.remove(author);
         return response.status(200).json({message: "El Autor ha sido eliminado: ", author});
      } catch (error) {
         return response.status(500).json({ message: "Ocurrió un error eliminando un Autor: ", error: error.message });
      }
   };

   public update = async (request: Request, response: Response) => {
      try {
         const id = parseInt(request.params.id, 10);
         const author = await this.authorRepository.findOne({ where: { id } });
         if (!author) {
            return response.status(404).json({ message: "No se ha encontrado el Autor a actualizar" });
         }
         const { name, email, description, photo } = request.body;
         author.name = name;
         author.email = email;
         author.description = description;
         author.photo = photo;
         await this.authorRepository.save(author);
         return response.status(200).json(author);
      } catch (error) {
         return response.status(500).json({ message: "Ocurrió un error actualizando un Autor: ", error: error.message });
      }
   };
}
