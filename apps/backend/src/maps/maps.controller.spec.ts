import { Test, TestingModule } from '@nestjs/testing';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';

describe('MapsController', () => {
  let controller: MapsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MapsController],
      providers: [
        {
          provide: MapsService,
          useValue: { getIncidentMap: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<MapsController>(MapsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates to the service', async () => {
    const snapshot = { incident: {}, resources: [], summary: {} };
    const service = controller['mapsService'] as { getIncidentMap: jest.Mock };
    service.getIncidentMap.mockResolvedValue(snapshot);

    await expect(
      controller.getIncidentMap('00000000-0000-0000-0000-000000000001'),
    ).resolves.toBe(snapshot);
    expect(service.getIncidentMap).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
    );
  });
});
