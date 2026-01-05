import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from '../services/audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditService = {
    getAllAuditLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockAuditService }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return audit logs', async () => {
    mockAuditService.getAllAuditLogs.mockResolvedValue([{ id: 1 }]);

    const result = await controller.findAll({});

    expect(result).toEqual([{ id: 1 }]);
    expect(service.getAllAuditLogs).toHaveBeenCalledWith(100);
  });
});
