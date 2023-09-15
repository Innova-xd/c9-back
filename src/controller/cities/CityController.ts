import { AppDataSource } from '../../data-source';
import { Request, Response } from 'express';
import { City } from '../../entity/City';

// TODO: Add Swagger documentation
export class CityController {
  private cityRepository = AppDataSource.getRepository(City);

  public all = async (request: Request, response: Response) => {
    try {
      const cities = await this.cityRepository.find({ relations: ['region'] });

      if (!cities) {
        return response.status(404).json({ message: 'No hay comunas' });
      }
      return response.status(200).json(cities);
    } catch (error) {
      console.log('error', error);
      return response.status(500).json({
        message: 'Ha ocurrido un error obteniendo todas las Comunas: ',
        error: error.detail,
      });
    }
  };

  public one = async (request: Request, response: Response) => {
    try {
      const id = parseInt(request.params.id, 10);
      const city = await this.cityRepository.findOne({ where: { id } });
      if (city) {
        return response.status(200).json(city);
      }
      return response.status(200).json('No se ha encontrado la Comuna');
    } catch (error) {
      return response.status(500).json({
        message: 'Ocurrió un error obteniendo una Comuna: ',
        error: error.message,
      });
    }
  };

  public save = async (request: Request, response: Response) => {
    try {
      const city = new City();
      city.name = request.body.name;
      city.region = request.body.region;
      await this.cityRepository.save(city);
      return response.status(201).json(city);
    } catch (error) {
      return response.status(500).json({
        message: 'Ocurrió un error guardando una Comuna: ',
        error: error.message,
      });
    }
  };

  public remove = async (request: Request, response: Response) => {
    try {
      const id = parseInt(request.params.id, 10);
      const city = await this.cityRepository.findOne({
        where: { id },
        relations: ['publications'],
      });

      if (!city) {
        return response
          .status(404)
          .json({ message: 'No se ha encontrado la Comuna' });
      }

      // TODO: la comuna no esta relacionada por BD con las publicaciones
      // if (city.publications.length > 0) {
      //   return response.status(400).json({
      //     message:
      //       'No se puede eliminar la Comuna, tiene publicaciones asociadas',
      //   });
      // }

      await this.cityRepository.remove(city);
      return response
        .status(200)
        .json({ message: 'La Comuna ha sido eliminada: ', city });
    } catch (error) {
      return response.status(500).json({
        message: 'Ocurrió un error eliminando una Comuna: ',
        error: error.message,
      });
    }
  };

  public update = async (request: Request, response: Response) => {
    try {
      const id = parseInt(request.params.id, 10);
      const city = await this.cityRepository.findOne({ where: { id } });
      if (!city) {
        return response
          .status(404)
          .json({ message: 'No se ha encontrado la Comuna' });
      }
      city.name = request.body.name;
      city.region = request.body.region;
      await this.cityRepository.save(city);
      return response.status(200).json(city);
    } catch (error) {
      return response.status(500).json({
        message: 'Ocurrió un error actualizando una Comuna: ',
        error: error.message,
      });
    }
  };
}
