import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Question } from './Questions';
import { Region } from './Region';
import { City } from './City';
import { Category } from './Category';

/*
export enum CategoryTypes {
  TECNOLOGIA = 'Tecnología',
  CIENCIA = 'Ciencia',
  ENTRETENIMIENTO = 'Entretenimiento',
  ESPACIO = 'Espacio',
  GENERAL = 'General',
}
*/

@Entity('publications')
export class Publication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  slug: string;

  @Column({ type: 'text' })
  initialContent: string;

  @Column({ type: 'text' })
  finalContent: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Category, (category) => category.publications, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ default: false })
  published: boolean;

  @ManyToOne(() => User, (user) => user.publications, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Question, (question) => question.publication)
  questions: Question[];

  @ManyToOne(() => City, (city) => city.publications, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City;
}
