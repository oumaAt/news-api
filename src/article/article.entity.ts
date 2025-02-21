import { Comment } from '../comment/comment.entity';
import { User } from '../user/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index('idx_article_title', { fulltext: true })
  title: string;

  @Column({ unique: true })
  url?: string;

  @Column({})
  source?: string;

  @Column({ type: 'timestamp' })
  publishedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne(() => User, (author) => author.articles, {
    nullable: true,
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => Comment, (comment) => comment.article)
  comments: Comment[];
}
