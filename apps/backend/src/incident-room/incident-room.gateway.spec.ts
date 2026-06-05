import { Test, TestingModule } from '@nestjs/testing';
import { IncidentRoomGateway } from './incident-room.gateway';

describe('IncidentRoomGateway', () => {
  let gateway: IncidentRoomGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidentRoomGateway],
    }).compile();

    gateway = module.get<IncidentRoomGateway>(IncidentRoomGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
