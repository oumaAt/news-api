import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './dto/createUser.dto';

interface UserData {
  username: string;
}
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createMany(users: UserData[]) {
    // Validate input data using DTO
    const validationPromises = users.map(async (user) => {
      const userDto = plainToClass(CreateUserDto, user);
      const errors = await validate(userDto);
      if (errors.length > 0) {
        throw new ConflictException(
          `Validation failed for user with username: ${user.username}`,
        );
      }
    });

    await Promise.all(validationPromises);

    // Vérifier quels utilisateurs existent déjà en base (recherche par username)
    const existingUsers = await this.userRepository.find({
      where: { username: In(users.map((user) => user.username)) },
    });

    const existingUsernames = new Set(
      existingUsers.map((user) => user.username),
    );

    // Filtrer les nouveaux utilisateurs (ceux qui n'existent pas encore)
    const newUsers = users.filter(
      (user) => !existingUsernames.has(user.username),
    );

    Logger.log('New users to insert:', newUsers.length);

    if (newUsers.length === 0) {
      Logger.log('All users already exist, nothing to insert.');
    }

    // Insérer uniquement les nouveaux utilisateurs
    const createdUsers = await this.userRepository.save(newUsers);
    return [...existingUsers, ...createdUsers];
  }
}
