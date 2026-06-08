import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

describe('IncidentsController', () => {
  let controller: IncidentsController;

  beforeEach(() => {
    controller = new IncidentsController({} as IncidentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
