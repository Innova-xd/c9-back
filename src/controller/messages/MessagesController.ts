import { Request, Response } from 'express';
import { AppDataSource } from '../../data-source';
import { Chat } from '../../entity/Chat';
import { Messages } from '../../entity/Messages';
import { Publication } from '../../entity/Publication';
import { User } from '../../entity/User';
import jwt = require('jsonwebtoken');
import { JWTData } from '../../types/JWTData';

const JWT_SECRET = process.env.JWT_SECRET;

export class MessagesController {
	private chatRepository = AppDataSource.getRepository(Chat);
	private messagesRepository = AppDataSource.getRepository(Messages);
	private publicationRepository = AppDataSource.getRepository(Publication);
	private userRepository = AppDataSource.getRepository(User);

	public save = async (request: Request, response: Response) => {
		try {
			const authHeader = request.header('Authorization');
			const token = authHeader && authHeader.split(' ')[1];
			if (!token) {
				return response
					.status(401)
					.json({ message: 'No token, authorization denied' });
			}
			const decoded = jwt.verify(token, JWT_SECRET) as JWTData;

			const { message, publication_slug } = request.body;

			const username = decoded.username;
			const user = await this.userRepository.findOne({
				where: { name: username },
			});

			const publication = await this.publicationRepository.findOne({
				where: { slug: publication_slug },
			});

			let chat = await this.chatRepository.findOne({
				where: { publication_id: publication?.id, user_id: user?.id },
			});
			if (!chat) {
				// crea un nuevo chat si es que no hay
				chat = new Chat();
				chat.user_id = user?.id;
				chat.publication_id = publication?.id;
				await this.chatRepository.save(chat);
			}

			const newMessage = new Messages();
			newMessage.role = 'user'; // por defecto
			newMessage.content = message;
			newMessage.chat = chat;

			await this.messagesRepository.save(newMessage);
			return response.status(201).json(newMessage);
		} catch (error) {
			return response.status(500).json({
				message: 'An error occurred while saving a message: ',
				error: error.message,
			});
		}
	};

	public getBySlug = async (request: Request, response: Response) => {
		try {
			const authHeader = request.header('Authorization');
			const token = authHeader && authHeader.split(' ')[1];
			if (!token) {
				return response
					.status(401)
					.json({ message: 'No token, authorization denied' });
			}
			const decoded = jwt.verify(token, JWT_SECRET) as JWTData;

			const username = decoded.username;
			const user = await this.userRepository.findOne({
				where: { name: username },
			});
			if (!user) {
				return response.status(404).json({ message: 'User not found.' });
			}

			const publication_slug = request.params.publication_slug;
			const publication = await this.publicationRepository.findOne({
				where: { slug: publication_slug },
			});
			if (!publication) {
				return response.status(404).json({ message: 'Publication not found.' });
			}

			let chat = await this.chatRepository.findOne({
				where: { publication_id: publication.id, user_id: user.id },
			});
			if (!chat) {
				return response.status(404).json({ message: 'Chat not found.' });
			}

			let messages = await this.messagesRepository.find({
				where: { chat: chat },
				order: { id: 'ASC' },
			});

			if (messages.length === 0) {
				return response
					.status(200)
					.json({ message: 'No messages found for this chat.' });
			}

			return response.status(200).json(messages);
		} catch (error) {
			return response.status(500).json({
				message: 'An error occurred while getting messages: ',
				error: error.message,
			});
		}
	};
}
