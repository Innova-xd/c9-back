import { body, param } from "express-validator";
import validateReqSchema from "../middlewares/validations";
import { MessagesController } from "./MessagesController";
const express = require('express');
const messageRouter = express.Router();
const messageController = new MessagesController();

messageRouter.post('/api/chat_message',
   validateReqSchema([
      body("message").isString(),
      body("publication_slug").isString(),
   ]),
   messageController.save);

   messageRouter.get('/api/chat_message/:publication_slug',
   validateReqSchema([
      param("publication_slug").isString(),
   ]),
   messageController.getBySlug);

export default messageRouter;
