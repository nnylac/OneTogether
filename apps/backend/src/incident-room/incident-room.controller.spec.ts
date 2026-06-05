import { Test, TestingModule } from '@nestjs/testing';
import { IncidentRoomController } from './incident-room.controller';

describe('IncidentRoomController', () => {
  let controller: IncidentRoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentRoomController],
    }).compile();

    controller = module.get<IncidentRoomController>(IncidentRoomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
