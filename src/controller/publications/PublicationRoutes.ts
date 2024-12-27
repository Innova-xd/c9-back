import { PublicationController } from "./PublicationController";
import { body, param } from "express-validator";
const express = require("express");
const publicationRouter = express.Router();
const publicationController = new PublicationController();
import validateReqSchema from "../middlewares/validations";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { isAdmin } from "../middlewares/isAdmin";

/**
 * Publicaciones
 * @swagger
 * /publications/{slug}:
 *    get:
 *      tags:
 *        - publicaciones
 *      summary: Obtener una publicación por su slug
 *      description: Este endpoint se utiliza para obtener los detalles de una publicación específica utilizando su slug como parámetro.
 *      operationId: getPublication
 *      parameters:
 *        - in: path
 *          name: slug
 *          required: true
 *          schema:
 *            type: string
 *          description: Slug de la publicación
 *      responses:
 *        '200':
 *          description: Retorna la publicación correspondiente al slug proporcionado.
 *        '404':
 *          description: Publicación no encontrada.
 *
 * /publications:
 *    get:
 *      tags:
 *        - publicaciones
 *      summary: Obtener todas las publicaciones
 *      description: Este endpoint se utiliza para obtener todas las publicaciones disponibles.
 *      responses:
 *        '200':
 *          description: Retorna todas las publicaciones existentes.
 *
 *    post:
 *      tags:
 *        - publicaciones
 *      summary: Crear una nueva publicación
 *      description: Este endpoint se utiliza para crear una nueva publicación.
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Publications"
 *      responses:
 *        '200':
 *          description: La publicación ha sido creada exitosamente.
 *        '422':
 *          description: Error de validación.
 *
 *    put:
 *      tags:
 *        - publicaciones
 *      summary: Actualizar una publicación existente
 *      description: Este endpoint se utiliza para actualizar una publicación existente utilizando su slug como parámetro.
 *      operationId: updatePublication
 *      parameters:
 *        - in: path
 *          name: slug
 *          required: true
 *          schema:
 *            type: string
 *          description: Slug de la publicación
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/Publications"
 *      responses:
 *        '200':
 *          description: La publicación ha sido actualizada exitosamente.
 *        '404':
 *          description: Publicación no encontrada.
 *        '422':
 *          description: Error de validación.
 *
 *    delete:
 *      tags:
 *        - publicaciones
 *      summary: Eliminar una publicación existente
 *      description: Este endpoint se utiliza para eliminar una publicación existente utilizando su slug como parámetro.
 *      operationId: deletePublication
 *      parameters:
 *        - in: path
 *          name: slug
 *          required: true
 *          schema:
 *            type: string
 *          description: Slug de la publicación
 *      responses:
 *        '200':
 *          description: La publicación ha sido eliminada exitosamente.
 *        '404':
 *          description: Publicación no encontrada.
 */

// Validation: none
publicationRouter.get("/publications", publicationController.allPublished);
publicationRouter.get("/admin_publications", publicationController.all);
publicationRouter.get(
  "/publications/:slug",
  validateReqSchema([param("slug").isString()]),
  publicationController.one
);

// Validation: isAdmin
publicationRouter.post(
  "/publications",
  isAuthenticated,
  validateReqSchema([
    body("name").isString(),
    body("slug").isString(),
    body("initialContent").isString(),
    body("finalContent").isString(),
    body("user_id").optional(),
  ]),
  publicationController.save
);

publicationRouter.post(
  "/publication/:slug/visit",
  validateReqSchema([param("slug").isString()]),
  publicationController.addVisit
);

publicationRouter.put(
  "/publications/published",
  isAuthenticated,
  validateReqSchema([
    body("publicationsIdsToUpdate").isArray({ min: 1 }),
    body("isPublished").isBoolean(),
  ]),
  publicationController.publishOrUnpublish
);

publicationRouter.put(
  "/publications/:slug",
  isAuthenticated,
  validateReqSchema([
    param("slug").isString(),
    body("name").isString(),
    body("initialContent").isString(),
    body("finalContent").isString(),
    body("user_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("The minimum user_id must be positive integer"),
  ]),
  publicationController.update
);

publicationRouter.delete(
  "/publications/:slug",
  isAuthenticated,
  validateReqSchema([param("slug").isString()]),
  publicationController.remove
);

publicationRouter.get(
  "/publications/allByKeyword/:keyword",
  publicationController.getByKeyword
);
publicationRouter.get(
  "/publications/category/:category",
  publicationController.getByCategory
);
publicationRouter.get(
  "/publications/region/:regionId",
  publicationController.getByRegionId
);

publicationRouter.get("/categories", publicationController.getAllCategories);
publicationRouter.get("/regions", publicationController.getAllRegions);

export default publicationRouter;
