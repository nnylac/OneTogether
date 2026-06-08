import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

describe('ResourcesController', () => {
  let controller: ResourcesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [
        {
          provide: ResourcesService,
          useValue: {
            findInventory: jest.fn(),
            findOutlet: jest.fn(),
            findOutlets: jest.fn(),
            findSummary: jest.fn(),
            syncResources: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ResourcesController>(ResourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
