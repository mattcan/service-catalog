import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { FindOperator } from 'typeorm'
import { Service } from './entities/service.entity'
import { ServicesService } from './services.service'

const mockServiceRepo = {
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(() => ([])),
  update: jest.fn(),
  softDelete: jest.fn(),
}

describe('ServicesService', () => {
  let service: ServicesService
  let repo

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepo,
        },
      ],
    }).compile()

    service = module.get<ServicesService>(ServicesService)
    repo = module.get(getRepositoryToken(Service))
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('base', async () => {
      await service.findAll({})
      expect(repo.findAndCount).toHaveBeenCalledWith({
        relations: { versions: true },
      })
    })

    it('sort', async () => {
      await service.findAll({ sort: { name: 'ASC' } })
      expect(repo.findAndCount).toHaveBeenCalledWith({
        relations: { versions: true },
        order: { name: 'ASC' },
      })
    })

    it('pagination', async () => {
      await service.findAll({ page: 2, pageSize: 10 })
      expect(repo.findAndCount).toHaveBeenCalledWith({
        relations: { versions: true },
        skip: 10,
        take: 10,
      })
    })

    it('search', async () => {
      await service.findAll({ search: 'ban' })
      expect(repo.findAndCount).toHaveBeenCalledWith({
        relations: { versions: true },
        where: [
          { name: expect.objectContaining({ _value: '%ban%' }) },
          { description: expect.objectContaining({ _value: '%ban%' }) },
        ],
      })
    })

    it('all options', async () => {
      await service.findAll({
        search: 'ban',
        page: 1,
        pageSize: 5,
        sort: { name: 'DESC' },
      })
      expect(repo.findAndCount).toHaveBeenCalledWith({
        relations: { versions: true },
        where: [
          { name: expect.objectContaining({ _value: '%ban%' }) },
          { description: expect.objectContaining({ _value: '%ban%' }) },
        ],
        order: { name: 'DESC' },
        skip: 0,
        take: 5,
      })
    })
  })
})
