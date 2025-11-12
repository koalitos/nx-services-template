import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getHealth', () => {
    it('should return a healthy payload', () => {
      const response = service.getHealth();
      expect(response.status).toEqual('ok');
      expect(response.service).toEqual('template-supa');
      expect(response).toHaveProperty('timestamp');
    });
  });
});
