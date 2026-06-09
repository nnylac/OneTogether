import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentRoomService } from './incident-room.service';

describe('IncidentRoomService', () => {
  let service: IncidentRoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentRoomService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<IncidentRoomService>(IncidentRoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
