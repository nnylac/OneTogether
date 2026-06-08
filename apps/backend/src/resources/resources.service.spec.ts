import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesRepository } from './resources.repository';
import { ResourcesService } from './resources.service';

describe('ResourcesService', () => {
  let service: ResourcesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        {
          provide: ResourcesRepository,
          useValue: {
            findInventory: jest.fn(),
            findOutletById: jest.fn(),
            findOutlets: jest.fn(),
            upsertInventory: jest.fn(),
            upsertOutlet: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
