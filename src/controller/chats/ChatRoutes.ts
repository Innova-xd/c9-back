import { ChatController } from './ChatController';

const express = require('express');
const chatRouter = express.Router();
const chatController = new ChatController();

chatRouter.post('/chats/students', chatController.ChatByStudent);

export default chatRouter;
