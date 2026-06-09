import { Test, TestingModule } from '@nestjs/testing';
import { IncidentRoomController } from './incident-room.controller';
import { IncidentRoomService } from './incident-room.service';

describe('IncidentRoomController', () => {
  let controller: IncidentRoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentRoomController],
      providers: [
        {
          provide: IncidentRoomService,
          useValue: {
            findMessages: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<IncidentRoomController>(IncidentRoomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
