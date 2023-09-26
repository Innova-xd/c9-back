import { UserController } from './UserController';
import { body, param } from 'express-validator';
const express = require('express');
const userRouter = express.Router();
const userController = new UserController();
import validationReqSchema from '../middlewares/validations';
import { isAdmin } from '../middlewares/isAdmin';

import passport from '../../config/passport';
import { isAuthenticated } from '../middlewares/isAuthenticated';

/**
 * @swagger
 * path:
 * /users/{id}:
 *    get:
 *      tags:
 *        - usuarios
 *      summary: Obtener un usuario por su ID
 *      description: Este endpoint se utiliza para obtener los detalles de un usuario específico utilizando su ID como parámetro.
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: integer
 *          description: ID del usuario
 *      responses:
 *        '200':
 *          description: Retorna el usuario correspondiente al ID proporcionado.
 *        '404':
 *          description: Usuario no encontrado.
 *
 * /users:
 *    get:
 *      tags:
 *        - usuarios
 *      summary: Obtener todos los usuarios
 *      description: Este endpoint se utiliza para obtener todos los usuarios registrados.
 *      responses:
 *        '200':
 *          description: Retorna todos los usuarios existentes.
 *
 *    post:
 *      tags:
 *        - usuarios
 *      summary: Crear un nuevo usuario
 *      description: Este endpoint se utiliza para crear un nuevo usuario.
 *      requestBody:
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Users"
 *      responses:
 *        '200':
 *          description: El usuario ha sido creado exitosamente.
 *        '422':
 *          description: Error de validación.
 *
 *    put:
 *      tags:
 *        - usuarios
 *      summary: Actualizar un usuario existente
 *      description: Este endpoint se utiliza para actualizar un usuario existente utilizando su ID como parámetro.
 *
 *      requestBody:
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Users"
 *      responses:
 *        '200':
 *          description: El usuario ha sido actualizado exitosamente.
 *        '404':
 *          description: Usuario no encontrado.
 *        '422':
 *          description: Error de validación.
 *
 *    delete:
 *      tags:
 *        - usuarios
 *      summary: Eliminar un usuario existente
 *      description: Este endpoint se utiliza para eliminar un usuario existente utilizando su ID como parámetro.
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: integer
 *          description: ID del usuario
 *      responses:
 *        '200':
 *          description: El usuario ha sido eliminado exitosamente.
 *        '404':
 *          description: Usuario no encontrado.
 * /users/auth:
 *    post:
 *      tags:
 *        - usuarios
 *      summary: Autentica un usuario
 *      description: Este endpoint se utiliza para autenticar un usuario contra la base de datos.
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                password:
 *                  type: string
 *      responses:
 *        '400':
 *          description: El usuario no existe en la base de datos.
 *        '422':
 *          description: Error de validación.
 *        '200':
 *          description: Devuelve un JWT con los datos del usuario.
 */

userRouter.get('/users', isAdmin, userController.all);

userRouter.get(
  '/users/:id',
  isAdmin,
  validationReqSchema([param('id').isInt()]),
  userController.one
);

userRouter.get(
  '/users/profile/:id',
  validationReqSchema([param('id').isString()]),
  userController.oneForProfile
);

userRouter.get('/users/:username', userController.oneByUsername);

userRouter.get(
  '/users/email/:email',
  // isAdmin,
  userController.oneByEmail
);

userRouter.post(
  '/users',
  isAdmin,
  validationReqSchema([body('name').isString(), body('email').isString()]),
  userController.save
);

userRouter.post(
  '/users/auth',
  validationReqSchema([body('email').isString(), body('password').isString()]),
  userController.checkAuth
);

userRouter.post(
  '/users/register',
  validationReqSchema([
    body('nombre').isString().withMessage('Name must be a string'),
    body('email').isString().withMessage('Email must be a string'),
    body('password').isString().withMessage('Password must be a string'),
  ]),
  userController.register
);

userRouter.post(
  '/users/confirm',
  isAdmin,
  validationReqSchema([
    body('password').isString().withMessage('Password must be a string'),
    body('token').isString().withMessage('Token must be a string'),
  ]),
  userController.confirm
);

userRouter.put(
  '/users/:id',
  isAdmin,
  validationReqSchema([
    body('name').isString().optional(),
    body('enabled').isBoolean().optional(),
  ]),
  userController.update
);

// linkedin
userRouter.get('/auth/linkedin', passport.authenticate('linkedin'));

userRouter.get(
  '/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/' }),
  function (req, res) {
    // el campo req.user contiene el token res.send(req.user);
    res.redirect(`${process.env.FRONT_URL}/loginLinkedin/${req.user}`);
  }
);

export default userRouter;
