import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('health', () => {
    it('should return status info', () => {
      const appController = app.get<AppController>(AppController);
      const response = appController.health();
      expect(response.status).toEqual('ok');
      expect(response.service).toEqual('template-supa');
    });
  });
});
