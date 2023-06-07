import { AppDataSource } from '../../data-source';
import { NextFunction, Request, Response } from 'express';
import { Publication } from '../../entity/Publication';
import { asDTO, asDTOs } from './PublicationDTO';
import { ImagesUploader } from '../../services/ImagesUploader';

export class PublicationController {
  private publicationRepository = AppDataSource.getRepository(Publication);
  public one = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const slug = request.params.slug;
      const publication = await this.publicationRepository.findOne({
        where: { slug },
        relations: {
          user: true,
          questions: true,
        },
        select: {
          user: {
            name: true,
          },
        },
      });
      if (!publication) {
        return response
          .status(404)
          .json({ message: 'La publicación que se intenta buscar no existe' });
      }
      const publicationDTO = asDTO(publication);
      return response.status(200).json(publicationDTO);
    } catch (error) {
      return response.status(400).json({
        message: 'Ha ocurrido un error trayendo la publicación',
        error: error.detail,
      });
    }
  };

  /**
   * Obtiene todas las publicaciones de la base de datos.
   * @param request - La solicitud HTTP que se está procesando.
   * @param response - La respuesta HTTP que se enviará al cliente.
   * @param next - La función que se llamará después de que se complete la operación.
   * @returns Un arreglo de objetos DTO que representan las publicaciones.
   */
  public all = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const publications = await this.publicationRepository.find({
        where: { user: true || false },
        relations: {
          user: true,
          questions: true,
        },
        select: {
          user: {
            name: true,
          },
          questions: {
            question: true,
            answer: true,
          },
        },
      });
      const publicationDTOs = asDTOs(publications);
      return response.status(200).json(publicationDTOs);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message: 'Ha ocurrido un error obteniendo las Publicaciones',
        error: error.detail,
      });
    }
  };

  /**
   * Crea y guarda una nueva publicación en la base de datos.
   * @param request - La solicitud HTTP que contiene los datos de la publicación.
   * @param response - La respuesta HTTP que se enviará al cliente.
   * @param next - La función que se llamará después de que se complete la operación.
   * @returns La publicación creada.
   */
  public save = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const imagesUploaderService = new ImagesUploader();
    let imagesUrls: string[];
    if (request.files) {
      imagesUrls = await imagesUploaderService.uploadImages(
        request.files.images
      );
    }
    try {
      const {
        name,
        slug,
        initialContent,
        finalContent,
        category,
        published,
        user_id,
      } = request.body;
      if (user_id) {
        const publication = this.publicationRepository.create({
          name,
          slug,
          initialContent,
          finalContent,
          category,
          published,
          images: imagesUrls,
          user: {
            id: user_id,
          },
        });
        const result = await this.publicationRepository.save(publication);
        return response.status(201).json(result);
      } else {
        const user_id = null;
        const publication = this.publicationRepository.create({
          name,
          slug,
          initialContent,
          finalContent,
          category,
          published: published ? JSON.parse(published) : undefined,
          images: imagesUrls,
          user: {
            id: user_id,
          },
        });
        const result = await this.publicationRepository.save(publication);

        // guardar preguntas asociadas
        const preQuestions = JSON.parse(request.body.questions);
        const questions = preQuestions.map((question: any) => {
          return {
            question: question.question,
            answer: question.answer,
            publication: {
              id: result.id,
            },
          };
        });

        // insertarlos nuevamente
        await AppDataSource.getRepository('Question').save(questions);

        return response.status(201).json(result);
      }
    } catch (error) {
      return response.status(400).json({
        message: 'Ha ocurrido un error creando una nueva Publicación',
        error: error.detail,
      });
    }
  };

  /**
   * Actualiza una publicación existente en la base de datos.
   * @param request - La solicitud HTTP que se está procesando.
   * @param response - La respuesta HTTP que se enviará al cliente.
   * @param next - La función que se llamará después de que se complete la operación.
   * @returns La publicación actualizada.
   */
  public update = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const busquedaSlug = request.params.slug;
      const publication = await this.publicationRepository.findOne({
        where: { slug: busquedaSlug },
        relations: {
          user: true,
          questions: true,
        },
        select: {
          user: {
            id: true,
          },
        },
      });
      if (!publication) {
        return response.status(400).json({
          message: 'La publicación que se intenta actualizar no existe',
        });
      }
      const { name, slug, initialContent, finalContent, category } =
        request.body;
      const userId = request.body.user_id
        ? Number(request.body.user_id)
        : undefined;
      const published = request.body.published
        ? JSON.parse(request.body.published)
        : undefined;
      let imagesUrls: string[];
      if (request.files) {
        const imagesUploaderService = new ImagesUploader();
        imagesUrls = await imagesUploaderService.uploadImages(
          request.files.images
        );
      }

      this.publicationRepository.merge(publication, {
        name,
        slug,
        initialContent,
        finalContent,
        category,
        images: imagesUrls,
        published,
        // user: { id: userId },
      });

      await this.publicationRepository.save(publication);

      // guardar preguntas asociadas
      const preQuestions = JSON.parse(request.body.questions);
      const questions = preQuestions.map((question: any) => {
        return {
          question: question.question,
          answer: question.answer,
          publication: {
            id: publication.id,
          },
        };
      });

      // eliminar anteriores
      await AppDataSource.getRepository('Question').delete({
        publication: {
          id: publication.id,
        },
      });

      // insertarlos nuevamente
      await AppDataSource.getRepository('Question').save(questions);

      return response.status(200).json(publication);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message: 'Ha ocurrido un error actualizando la Publicación',
        error: error.detail,
      });
    }
  };

  /**
   * Elimina una publicación de la base de datos.
   * @param request - La solicitud HTTP que se está procesando.
   * @param response - La respuesta HTTP que se enviará al cliente.
   * @param next - La función que se llamará después de que se complete la operación.
   * @returns Un mensaje que indica si la publicación se eliminó correctamente o no.
   */
  public remove = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const slug = request.params.slug;
      const publicationToRemove = await this.publicationRepository.findOne({
        where: { slug },
        relations: {
          questions: {
            publication: true,
          },
        },
      });
      if (!publicationToRemove) {
        return response
          .status(404)
          .json({ message: 'La publicación que se intenta borrar no existe' });
      }
      await this.publicationRepository.remove(publicationToRemove);
      return response
        .status(200)
        .json({ message: 'La Publicación se ha borrado correctamente' });
    } catch (error) {
      return response.status(400).json({
        message:
          'Ha ocurrido un error eliminando una pregunta con su respuesta',
        error: error.detail,
      });
    }
  };

  public publishOrUnpublish = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const publicationsIds: number[] = request.body.publicationsIdsToUpdate;
    const isPublished = request.body.isPublished;
    try {
      await this.publicationRepository.update(publicationsIds, {
        published: isPublished,
      });
      return response.status(200).json({
        message: 'Las publicaciones se han actualizado correctamente',
      });
    } catch (error) {
      return response.status(400).json({
        message: 'Ha ocurrido un error actualizando las publicaciones',
        error: error.detail,
      });
    }
  };
}