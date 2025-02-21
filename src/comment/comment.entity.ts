import { Article } from '../article/article.entity';
import { User } from '../user/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'timestamp' })
  publishedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => User, (author) => author.comments, {
    nullable: true,
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ManyToOne(() => Article, (article) => article.comments, {
    nullable: true,
  })
  @JoinColumn({ name: 'articleId' })
  article: Article;
}
