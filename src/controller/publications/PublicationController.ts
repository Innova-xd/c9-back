import { AppDataSource } from '../../data-source';
import { NextFunction, Request, Response } from 'express';
import { Publication } from '../../entity/Publication';
import { asDTO, asDTOs, LocationFullInfo } from './PublicationDTO';
import { ImagesUploader } from '../../services/ImagesUploader';
import { Region } from '../../entity/Region';
import { City } from '../../entity/City';
import { Category } from '../../entity/Category';
import { ILike } from 'typeorm';

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
        relations: ['user', 'questions', 'category', 'author'],
        select: {
          user: {
            name: true,
            username: true,
          },
          author: {
            id: true,
            name: true,
          },
        },
      });
      if (!publication) {
        return response
          .status(404)
          .json({ message: 'La publicación que se intenta buscar no existe' });
      }

      let locationFullInfo: LocationFullInfo = null;
      if (publication.location) {
        const region = await AppDataSource.getRepository(Region).findOneBy({
          id: publication.location.regionId,
        });
        const city = publication.location.cityId
          ? await AppDataSource.getRepository(City).findOneBy({
              id: publication.location.cityId,
            })
          : null;
        locationFullInfo = { region, city };
      }

      // Add author to DTO
      const author = publication.author;
      const publicationDTO = asDTO({
        ...publication,
        locationFullInfo,
        author,
      });

      // TODO: Agregar imágenes dummy si es que images es vacio
      if (publication?.images?.length === 0) {
        for (let i = 0; i < 3; i++) {
          const randomId = Math.floor(Math.random() * 1000) + 1;
          const imageUrl = `https://picsum.photos/1200/800?random=${randomId}`;
          publication.images.push(imageUrl);
        }
      }

      return response.status(200).json(publicationDTO);
    } catch (error) {
      console.log(error);
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
        relations: ['user', 'questions', 'category', 'author'],
        select: {
          user: {
            name: true,
            username: true,
          },
          author: {
            name: true,
          },
          questions: {
            question: true,
            answer: true,
          },
        },
        order: {
          featured: 'desc',
          fecha_publicacion: 'desc',
        },
      });

      const publicationDTOs = await Promise.all(
        publications.map(async (publication) => {
          let locationFullInfo: LocationFullInfo = null;
          if (publication.location) {
            const region = await AppDataSource.getRepository(Region).findOneBy({
              id: publication.location.regionId,
            });
            const city = publication.location.cityId
              ? await AppDataSource.getRepository(City).findOneBy({
                  id: publication.location.cityId,
                })
              : null;
            locationFullInfo = { region, city };
          }

          // Add author to DTO
          const author = publication.author;

          // TODO: Agregar imágenes dummy si es que images es vacio
          if (publication.images?.length === 0) {
            for (let i = 0; i < 3; i++) {
              const randomId = Math.floor(Math.random() * 1000) + 1;
              const imageUrl = `https://picsum.photos/1200/800?random=${randomId}`;
              publication.images.push(imageUrl);
            }
          }

          // Create a new object with all properties from publication and the updated fields
          const updatedPublication = {
            ...publication,
            locationFullInfo,
            author,
          };

          return asDTO(updatedPublication);
        })
      );

      return response.status(200).json(publicationDTOs);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message: 'Ha ocurrido un error obteniendo las Publicaciones',
        error: error.detail,
      });
    }
  };

  public allPublished = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const publications = await this.publicationRepository.find({
        where: { user: true || false, published: true },
        relations: ['user', 'questions', 'category', 'author'],
        select: {
          user: {
            name: true,
            username: true,
          },
          questions: {
            question: true,
            answer: true,
          },
          author: {
            name: true,
          },
        },
        order: {
          featured: 'desc',
          fecha_publicacion: 'desc',
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
        finalContent_en,
        published,
        user,
        keywords,
        fecha_publicacion,
        author,
      } = request.body;

      const locationParse = request.body.location
        ? JSON.parse(request.body.location)
        : undefined;

      const location =
        locationParse && locationParse.region?.id !== null
          ? {
              regionId: locationParse.region.id,
              cityId: locationParse.city?.id || null,
            }
          : null;

      const category = request.body.category
        ? JSON.parse(request.body.category)
        : undefined;

      const authorParse = request.body.author
        ? JSON.parse(request.body.author)
        : undefined;

      const user_id = user ? { id: user.id } : { id: null };
      const featured = request.body.featured
        ? JSON.parse(request.body.featured)
        : undefined;

      const keys = keywords ? JSON.parse(keywords) : undefined;

      const publication = this.publicationRepository.create({
        name,
        slug,
        initialContent,
        finalContent,
        finalContent_EN: finalContent_en,
        category,
        location,
        published: published ? JSON.parse(published) : undefined,
        fecha_publicacion: new Date(fecha_publicacion),
        featured,
        keywords: keys || [],
        images: imagesUrls || [],
        user,
        author: authorParse || null,
      });

      // quitar el featured anterior solo si ahora viene como true
      if (publication.featured) {
        const oldFeaturedPublication =
          await this.publicationRepository.findOneBy({
            featured: true,
          });

        if (oldFeaturedPublication) {
          oldFeaturedPublication.featured = false;
          await this.publicationRepository.save(oldFeaturedPublication);
        }
      }

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
    } catch (error) {
      console.log('ERROR: ', error);
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
          category: true,
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
      const {
        name,
        slug,
        initialContent,
        finalContent,
        finalContent_en,
        fecha_publicacion,
        keywords,
      } = request.body;
      const userId = request.body.user_id
        ? Number(request.body.user_id)
        : undefined;
      const published = request.body.published
        ? JSON.parse(request.body.published)
        : undefined;

      const locationParse = request.body.location
        ? JSON.parse(request.body.location)
        : undefined;

      const location =
        locationParse && locationParse.region?.id !== null
          ? {
              regionId: locationParse.region.id,
              cityId: locationParse.city?.id || null,
            }
          : null;

      const category = request.body.category
        ? JSON.parse(request.body.category)
        : undefined;
      const featured = request.body.featured
        ? JSON.parse(request.body.featured)
        : undefined;

      const authorParse = request.body.author
        ? JSON.parse(request.body.author)
        : undefined;

      let imagesUrls: string[];
      if (request.files) {
        const imagesUploaderService = new ImagesUploader();
        imagesUrls = await imagesUploaderService.uploadImages(
          request.files.images
        );
      }

      // quitar el featured anterior solo si ahora viene como true
      if (featured) {
        const oldFeaturedPublication =
          await this.publicationRepository.findOneBy({
            featured: true,
          });

        if (oldFeaturedPublication) {
          oldFeaturedPublication.featured = false;
          await this.publicationRepository.save(oldFeaturedPublication);
        }
      }

      const keys = keywords ? JSON.parse(keywords) : undefined;

      this.publicationRepository.merge(publication, {
        name,
        slug,
        initialContent,
        finalContent,
        finalContent_EN: finalContent_en,
        category,
        location,
        images: imagesUrls,
        published,
        featured,
        fecha_publicacion: new Date(fecha_publicacion),
        author: authorParse || null,
        keywords: keys,
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

  public addVisit = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const slug = request.params.slug;
      const publication = await this.publicationRepository.findOne({
        where: { slug },
      });
      if (!publication) {
        return response
          .status(404)
          .json({ message: 'La publicación que se intenta visitar no existe' });
      }

      publication.visits += 1;
      await this.publicationRepository.save(publication);

      return response.status(200).json({
        message: 'La publicación se ha visitado correctamente',
      });
    } catch (error) {
      return response.status(400).json({
        message: 'Ha ocurrido un error visitando la publicación',
        error: error.detail,
      });
    }
  };

  /**
   * Obtiene todas las categorías.
   * @param request - La solicitud HTTP que se está procesando.
   * @param response - La respuesta HTTP que se enviará al cliente.
   * @param next - La función que se llamará después de que se complete la operación.
   * @returns Un arreglo de objetos que representan las categorías.
   */
  public getAllCategories = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const categoryRepository = AppDataSource.getRepository(Category);
      const categories = await categoryRepository.find();
      return response.status(200).json(categories);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message: 'Ha ocurrido un error obteniendo las categorías',
        error: error.detail,
      });
    }
  };

/**
 * Crea una nueva categoría.
 * @param request - La solicitud HTTP que contiene los datos de la categoría.
 * @param response - La respuesta HTTP que se enviará al cliente.
 * @param next - La función que se llamará después de que se complete la operación.
 * @returns El objeto de la nueva categoría creada.
 */
public createCategory = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const { name } = request.body; // Se asume que solo se recibe 'name'

    // Validación básica
    if (!name) {
      return response.status(400).json({
        message: 'El nombre de la categoría es requerido',
      });
    }

    const categoryRepository = AppDataSource.getRepository(Category);

    // Crear la nueva categoría
    const newCategory = categoryRepository.create({
      name,
    });

    // Guardar la nueva categoría en la base de datos
    await categoryRepository.save(newCategory);

    // Retornar la categoría recién creada, con su id y name
    return response.status(201).json({
      id: newCategory.id,
      name: newCategory.name,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({
      message: 'Ha ocurrido un error creando la categoría',
      error: error.message,
    });
  }
};

  /**
   * Obtiene todas las regiones y sus comunas.
   * @param request - La solicitud HTTP que se está procesando.
   * @param response - La respuesta HTTP que se enviará al cliente.
   * @param next - La función que se llamará después de que se complete la operación.
   * @returns Un arreglo de objetos que representan las regiones y sus comunas.
   */
  public getAllRegions = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const regionRepository = AppDataSource.getRepository(Region);
      const regions = await regionRepository.find({
        relations: { cities: true },
        select: { id: true, name: true },
        order: { id: 'ASC' },
      });
      return response.status(200).json(regions);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message: 'Ha ocurrido un error obteniendo las regiones',
        error: error.detail,
      });
    }
  };
  /**
   * Obtiene todas las publicaciones que contengan una keyword específica en el campo keywords.
   * @param request - La solicitud HTTP que se está procesando.
   * @param response - La respuesta HTTP que se enviará al cliente.
   * @param next - La función que se llamará después de que se complete la operación.
   * @returns Un arreglo de objetos DTO que representan las publicaciones.
   */
  public getByKeyword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const keyword = request.params.keyword; // Obtener la keyword de los parámetros

      // Realizar la búsqueda en la base de datos para obtener las publicaciones que contengan la keyword
      const publications = await this.publicationRepository.find({
        where: { keywords: ILike(`%${keyword}%`) },
        relations: ['user', 'questions', 'category', 'author'],
        select: {
          user: {
            name: true,
            username: true,
          },
          questions: {
            question: true,
            answer: true,
          },
          author: {
            name: true,
          },
        },
        order: {
          featured: 'desc',
          fecha_publicacion: 'desc',
        },
      });

      const publicationDTOs = asDTOs(publications);
      return response.status(200).json(publicationDTOs);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message:
          'Ha ocurrido un error obteniendo las Publicaciones por keyword',
        error: error.detail,
      });
    }
  };
  
  public getByCategory= async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const category = parseInt(request.params.category); 

      if (isNaN(category)) {
        return response.status(400).json({
          message: 'El ID de la categoría debe ser un número válido.',
        });
      }

      const publications = await this.publicationRepository.find({
        where: { category: {id: category } },
        relations: ['user', 'questions', 'category', 'author'],
        select: {
          user: {
            name: true,
            username: true,
          },
          questions: {
            question: true,
            answer: true,
          },
          author: {
            name: true,
          },
        },
        order: {
          featured: 'desc',
          fecha_publicacion: 'desc',
        },
      });

      const publicationDTOs = asDTOs(publications);
      return response.status(200).json(publicationDTOs);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message:
          'Ha ocurrido un error obteniendo las Publicaciones por categoria',
        error: error.detail,
      });
    }
  };

  public getByRegionId = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const regionId = parseInt(request.params.regionId);
  
      if (isNaN(regionId)) {
        return response.status(400).json({ message: 'ID de región no válido' });
      }
  
      // Usamos el QueryBuilder con un alias específico para la tabla Publication
      const publications = await this.publicationRepository
        .createQueryBuilder("publication")  // Alias correcto para la tabla "publication"
        .leftJoinAndSelect("publication.user", "user")
        .leftJoinAndSelect("publication.questions", "questions")
        .leftJoinAndSelect("publication.category", "category")
        .leftJoinAndSelect("publication.author", "author")
        .where('publication.location->>\'regionId\' = :regionId', { regionId: regionId })
        .orderBy('publication.featured', 'DESC')
        .addOrderBy('publication.fecha_publicacion', 'DESC')
        .getMany();
  
      if (publications.length === 0) {
        return response.status(404).json({ message: 'No se encontraron publicaciones para esta región' });
      }
  
      const publicationDTOs = asDTOs(publications);
  
      return response.status(200).json(publicationDTOs);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message: 'Ha ocurrido un error obteniendo las publicaciones por región',
        error: error.detail,
      });
    }
  };
  

}
