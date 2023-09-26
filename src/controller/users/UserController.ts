import { AppDataSource } from '../../data-source';
require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { User } from '../../entity/User';
import { Publication } from '../../entity/Publication';
import { validateLogin } from './UserAuth';
import sendEmail from '../../config/email';
import { sign, verify } from 'jsonwebtoken';
import { UserConfirmationJWT } from '../../types/JWTData';
import { ILike } from 'typeorm';
import { request } from 'http';
const secretKey = process.env.JWT_SECRET;
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

export class UserController {
  private userRepository = AppDataSource.getRepository(User);
  private publicationRepository = AppDataSource.getRepository(Publication);
  public all = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const users = await this.userRepository.find({
        where: { isAdmin: false },
        relations: {
          publications: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          enabled: true,
          publications: {
            name: true,
            published: true,
          },
        },
      });

      // TODO: add default value to username and description
      users.forEach((user) => {
        // TODO: for now, the username must be the email without the domain
        user.username = user.email.split('@')[0];
        user.description =
          'Periodista apasionad@ y curiosa con una pasión por contar historias y descubrir la verdad. Con una pluma ágil y una mente inquisitiva, se dedica a investigar y reportar noticias de manera objetiva y precisa. Siempre se esfuerza por obtener diferentes perspectivas y mantener altos estándares éticos en su trabajo.\n\nSofía tiene una gran habilidad para entrevistar a personas de diversos orígenes y escuchar atentamente sus testimonios. Su empatía y sensibilidad le permiten capturar las emociones y experiencias de sus fuentes de una manera auténtica y respetuosa.\n\nComo periodista comprometida, Sofía está dispuesta a adentrarse en los temas más complejos y controvertidos de la sociedad. Le gusta investigar a fondo para desentrañar la verdad detrás de los eventos y compartir esas historias con el público, brindando una voz a aquellos que a menudo son ignorados.\n\nCon una ética sólida y un sentido de responsabilidad, Sofía se esfuerza por informar con precisión y mantener la integridad en su trabajo periodístico. Cree en el poder de los medios de comunicación para generar un cambio positivo y es consciente de la responsabilidad que conlleva su rol como informadora de la sociedad.\n\nEn resumen, Sofía es una periodista apasionada, ética y comprometida, que busca descubrir y compartir la verdad a través de su trabajo periodístico, dando voz a las personas y temas importantes de nuestra sociedad.';
      });

      return response.status(200).json(users);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message: 'Ha ocurrido un error obteniendo los Usuarios',
        error,
      });
    }
  };

  createHash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  public one = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseInt(request.params.id);
      const user = await this.userRepository.findOne({
        where: { id },
        select: {
          email: true,
          name: true,
          enabled: true,
        },
      });
      if (!user) {
        return response
          .status(404)
          .json({ message: 'El usuario que se intenta buscar no existe' });
      }
      if (user.isAdmin === true) {
        return response
          .status(401)
          .json({ message: 'No esta autorizado a ver este usuario' });
      }
      return response.status(200).json(user);
    } catch (error) {
      return response.status(400).json({
        message: 'Ha ocurrido un error obteniendo al Usuario',
        error: error.detail,
      });
    }
  };

  public oneByUsername = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const username = request.params.username;

      // search by username, this is the substring of email, before @
      const user = await this.userRepository.findOne({
        where: { username: username },
        select: {
          email: true,
          name: true,
          enabled: true,
        },
      });

      if (!user) {
        return response
          .status(404)
          .json({ message: 'El usuario que se intenta buscar no existe' });
      }

      // TODO: add default value to username and description
      user.description =
        user.description ||
        'Periodista apasionad@ y curiosa con una pasión por contar historias y descubrir la verdad. Con una pluma ágil y una mente inquisitiva, se dedica a investigar y reportar noticias de manera objetiva y precisa. Siempre se esfuerza por obtener diferentes perspectivas y mantener altos estándares éticos en su trabajo.\n\nSofía tiene una gran habilidad para entrevistar a personas de diversos orígenes y escuchar atentamente sus testimonios. Su empatía y sensibilidad le permiten capturar las emociones y experiencias de sus fuentes de una manera auténtica y respetuosa.\n\nComo periodista comprometida, Sofía está dispuesta a adentrarse en los temas más complejos y controvertidos de la sociedad. Le gusta investigar a fondo para desentrañar la verdad detrás de los eventos y compartir esas historias con el público, brindando una voz a aquellos que a menudo son ignorados.\n\nCon una ética sólida y un sentido de responsabilidad, Sofía se esfuerza por informar con precisión y mantener la integridad en su trabajo periodístico. Cree en el poder de los medios de comunicación para generar un cambio positivo y es consciente de la responsabilidad que conlleva su rol como informadora de la sociedad.\n\nEn resumen, Sofía es una periodista apasionada, ética y comprometida, que busca descubrir y compartir la verdad a través de su trabajo periodístico, dando voz a las personas y temas importantes de nuestra sociedad.';

      return response.status(200).json(user);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message: 'Ha ocurrido un error obteniendo al Usuario',
        error: error.detail,
      });
    }
  };

  public oneByEmail = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const email = request.params.email;

      // search by email
      const user = await this.userRepository.findOne({
        where: { email: email },
        select: {
          id: true,
        },
      });

      if (!user) {
        return response
          .status(404)
          .json({ message: 'El usuario que se intenta buscar no existe' });
      }

      // TODO: add default value to username and description
      // user.description = user.description =
      //   'Periodista apasionad@ y curiosa con una pasión por contar historias y descubrir la verdad. Con una pluma ágil y una mente inquisitiva, se dedica a investigar y reportar noticias de manera objetiva y precisa. Siempre se esfuerza por obtener diferentes perspectivas y mantener altos estándares éticos en su trabajo.\n\nSofía tiene una gran habilidad para entrevistar a personas de diversos orígenes y escuchar atentamente sus testimonios. Su empatía y sensibilidad le permiten capturar las emociones y experiencias de sus fuentes de una manera auténtica y respetuosa.\n\nComo periodista comprometida, Sofía está dispuesta a adentrarse en los temas más complejos y controvertidos de la sociedad. Le gusta investigar a fondo para desentrañar la verdad detrás de los eventos y compartir esas historias con el público, brindando una voz a aquellos que a menudo son ignorados.\n\nCon una ética sólida y un sentido de responsabilidad, Sofía se esfuerza por informar con precisión y mantener la integridad en su trabajo periodístico. Cree en el poder de los medios de comunicación para generar un cambio positivo y es consciente de la responsabilidad que conlleva su rol como informadora de la sociedad.\n\nEn resumen, Sofía es una periodista apasionada, ética y comprometida, que busca descubrir y compartir la verdad a través de su trabajo periodístico, dando voz a las personas y temas importantes de nuestra sociedad.';

      return response.status(200).json(user);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message: 'Ha ocurrido un error obteniendo al Usuario',
        error: error.detail,
      });
    }
  };

  public register = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { nombre, email, password } = request.body;
    const salt = bcrypt.genSaltSync(10);

    const user = Object.assign(new User(), {
      name: nombre,
      email,
      password: bcrypt.hashSync(password, salt),
      isTeacher: true,
    });

    if (!user) {
      return 'El nombre, email y contraseña son requeridos para crear un usuario';
    }

    // revisar si ya existe
    const userExists = await this.userRepository.findOne({
      where: { email },
    });

    if (userExists) {
      return response.status(400).json({
        message: 'El usuario ya existe',
      });
    }

    try {
      const savedUser = await this.userRepository.save(user);
      // return response.status(200).json(savedUser);
      // solo devolver el email
      return response.status(200).json({ email: savedUser.email });
    } catch (error) {
      return response.status(400).json({
        message: 'Ha ocurrido un error creando el Usuario',
        error: error.detail,
      });
    }
  };

  public checkAuth = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const email = request.body.email;
    const password = request.body.password;
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      return response
        .status(401)
        .json({ message: 'Error, no esta autorizado' });
    }
    const result = await validateLogin(user, password);
    return response.status(200).json(result);
  };

  public save = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { name, email } = request.body;
    const user = Object.assign(new User(), {
      name,
      email,
      password: this.createHash(email),
    });
    if (!user) {
      return 'you have to add firstName, email lastName and age to create an User';
    }
    try {
      const savedUser = await this.userRepository.save(user);
      // genero token
      const token = sign({ userId: savedUser.id }, secretKey);
      // URL de confirmación con el token como parámetro
      const confirmationUrl = `${process.env.FRONT_URL}/confirm?token=${token}`;

      // guardo token en la base de datos
      savedUser.token = token;
      await this.userRepository.save(savedUser);
      const to = savedUser.email;
      const subject = 'Confirmación de registro';
      const content = `Hola ${savedUser.name}, ¡gracias por registrarte! Por favor, confirma tu cuenta haciendo click en el siguiente enlace: <a href="${confirmationUrl}">${confirmationUrl}</a>`; //envio email con el token de confirmacion
      await sendEmail(to, subject, content);
      const message = `Usuario ${savedUser.email} registrado exitosamente`;
      return response.status(200).json({ user: savedUser, token, message });
    } catch (error) {
      return response.status(400).json({
        message: 'Ha ocurrido un error creando el Usuario',
        error: error.detail,
      });
    }
  };
  public confirm = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { password, token } = request.body;
    try {
      //verifico token
      const decode = verify(token, secretKey) as UserConfirmationJWT;
      //obtengo el usuario basado en el ID del token
      const user = await this.userRepository.findOneBy({ id: decode.userId });
      //si no existe el usuario
      if (!user) {
        return response.status(404).json({ message: 'usuario no encontrado' });
      }
      // Actualizar el usuario con el password, cambiar el estado y eliminar el token
      user.password = password;
      user.enabled = true;
      user.token = null;
      await this.userRepository.save(user);

      return response
        .status(200)
        .json({ message: 'Usuario confirmado exitosamente' });
    } catch (error) {
      return response.status(400).json({
        message: 'Ha ocurrido un error al confirmar el usuario',
        error: error.message,
      });
    }
  };

  public update = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseInt(request.params.id);
      const user = await this.userRepository.findOne({
        where: { id },
        select: {
          id: true,
          name: true,
          enabled: true,
        },
      });
      if (!user) {
        return response
          .status(404)
          .json({ message: 'El Usuario que se intenta actualizar no existe' });
      }
      const { name, enabled } = request.body;
      user.name = name;
      user.enabled = enabled;
      await this.userRepository.save(user);
      return response.status(200).json(user);
    } catch (error) {
      return response.status(400).json({
        message: 'Ha ocurrido un error actualizando el Usuario',
        error: error.detail,
      });
    }
  };

  public oneForProfile = async (request: Request, response: Response) => {
    try {
      const username = request.params.id;

      const user = await this.userRepository.findOne({
        where: { name: username },
        select: {
          id: true,
          name: true,
          description: true,
        },
        relations: ['publications', 'publications.author'],
      });

      const publications = await this.publicationRepository.find({
        where: { author: { id: user.id } },
        select: ['name', 'fecha_publicacion'],
      });
      user.publications = publications;

      if (!user) {
        return response.status(404).json({
          message: 'oneForProfile: El usuario que se intenta buscar no existe',
        });
      }
      return response.status(200).json(user);
    } catch (error) {
      console.log(error);
      return response.status(400).json({
        message: 'Ha ocurrido un error obteniendo al Usuario para perfil',
        error: error.detail,
      });
    }
  };
}
