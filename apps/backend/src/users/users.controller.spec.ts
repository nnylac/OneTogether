import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const user: UserResponseDto = {
    id: '50000000-0000-0000-0000-000000000001',
    username: 'citizen_amy',
    email: 'amy.tan@example.sg',
    firstName: 'Amy',
    lastName: 'Tan',
    phone: '+6590000001',
    isVerified: true,
    role: 'user',
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    lastLogin: null,
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list users', async () => {
    const query: UserQueryDto = { role: 'user' };
    service.findAll.mockResolvedValue([user]);

    await expect(controller.findAll(query)).resolves.toEqual([user]);
    expect(service.findAll.mock.calls[0]).toEqual([query]);
  });

  it('should get one user', async () => {
    service.findOne.mockResolvedValue(user);

    await expect(controller.findOne(user.id)).resolves.toEqual(user);
    expect(service.findOne.mock.calls[0]).toEqual([user.id]);
  });

  it('should update one user', async () => {
    const dto: UpdateUserDto = { firstName: 'Amelia' };
    service.update.mockResolvedValue({ ...user, firstName: 'Amelia' });

    await expect(controller.update(user.id, dto)).resolves.toMatchObject({
      firstName: 'Amelia',
    });
    expect(service.update.mock.calls[0]).toEqual([user.id, dto]);
  });
});
