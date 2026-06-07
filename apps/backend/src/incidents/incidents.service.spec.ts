import { IncidentsService } from './incidents.service';

describe('IncidentsService', () => {
  let service: IncidentsService;

  beforeEach(() => {
    service = new IncidentsService({} as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
