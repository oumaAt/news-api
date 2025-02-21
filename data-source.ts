import { DataSource } from 'typeorm';
import * as mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { Logger } from '@nestjs/common';
config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['src/**/*.entity{.ts,.js}'],
  synchronize: false,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});

export const createDatabaseIfNotExists = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  });

  const result = await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DATABASE_NAME}\`;`,
  );
  Logger.log(`Database "${process.env.DATABASE_NAME}" checked/created.`);
  await connection.end();
};
