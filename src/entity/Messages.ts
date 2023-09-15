import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { Chat } from './Chat';

@Entity()
export class Messages {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
   role: string;
   
   @Column()
   content: string;

	@ManyToOne(() => Chat, (chat) => chat.messages)
	@JoinColumn({ name: 'chat_id' })
	chat: Chat;
}
