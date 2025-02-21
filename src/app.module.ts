import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { ScrapingModule } from './scraping/scraping.module';
import { ArticleModule } from './article/article.module';
import { UserModule } from './user/user.module';
import { CommentModule } from './comment/comment.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: false,
      migrations: ['dist/migrations/*.js'],
    }),
    ScrapingModule,
    ArticleModule,
    UserModule,
    CommentModule,
    ElasticsearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
