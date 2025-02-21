import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Bienvenue au scraping d\'un site d\'actualités';
  }
}
