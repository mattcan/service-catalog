import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from './../src/app.module'
import { mainConfig } from '../src/main.config'
import { Service } from '../src/services/entities/service.entity'
import { Version } from '../src/services/entities/version.entity'

describe('AppController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    mainConfig(app)
    await app.init()
  })

  beforeEach(async () => {
    const ds = app.get(DataSource)
    await ds.createQueryBuilder().delete().from(Version).execute()
    await ds.createQueryBuilder().delete().from(Service).execute()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/services (GET)', () => {
    it('empty results when there are no services', () => {
      return request(app.getHttpServer()).get('/services').expect(200).expect({
        services: [],
      })
    })

    it('pagination', async () => {
      for (let idx = 1; idx < 30; idx += 1) {
        await request(app.getHttpServer())
          .post('/services')
          .send({
            name: `Demo ${idx}`,
            description: 'This is a demo service',
            version: { tag: 'v1', description: 'And this is a version' },
          })
      }

      {
        const svcRes = await request(app.getHttpServer())
          .get('/services')
          .query({ page: 1, pageSize: 20 })

        expect(svcRes.status).toBe(200)
        expect(svcRes.body.services.length).toBe(20)
        expect(svcRes.headers['x-page']).toBe('1')
        expect(svcRes.headers['x-next-page']).toBe('2')
        expect(svcRes.headers['x-per-page']).toBe('20')
        expect(svcRes.headers['x-total']).toBe('29')
        expect(svcRes.headers['x-total-pages']).toBe('2')
      }

      {
        const svcRes = await request(app.getHttpServer())
          .get('/services')
          .query({ page: 'a', pageSize: 'rare' })

        expect(svcRes.status).toBe(400)
      }
    })

    it('search', async () => {
      // For search by name
      await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'Banana',
          description: 'This is a demo service',
          version: { tag: 'v1', description: 'And this is a version' },
        })

      // For search by description
      await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'Hellohellohello',
          description: 'Banned again',
          version: { tag: 'v1', description: 'And this is a version' },
        })

      // To verify results only include found items
      await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'SHOULD NOT SHOW UP',
          description: 'NO REALLY',
          version: { tag: 'v1', description: 'And this is a version' },
        })

      const svcRes = await request(app.getHttpServer())
        .get('/services')
        .query({ search: 'ban' })

      expect(svcRes.status).toBe(200)

      const { services } = svcRes.body

      {
        const svc = services.find((s) => s.name === 'Banana')
        expect(svc)
      }

      {
        const svc = services.find((s) => s.name === 'Hellohellohello')
        expect(svc)
      }

      {
        const svc = services.find((s) => s.name === 'SHOULD NOT SHOW UP')
        expect(svc).toBeFalsy()
      }
    })

    it('sorting', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'A',
          description: 'A',
          version: { tag: 'v1', description: 'And this is a version' },
        })
      await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'B',
          description: 'A',
          version: { tag: 'v1', description: 'And this is a version' },
        })
      await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'A',
          description: 'B',
          version: { tag: 'v1', description: 'And this is a version' },
        })

      {
        // Multi field, with markers
        const svcRes = await request(app.getHttpServer())
          .get('/services')
          .query({ sort: '+name,-description' })

        expect(svcRes.status).toBe(200)

        const { services } = svcRes.body
        expect(services[0]).toMatchObject({ name: 'A', description: 'B' })
        expect(services[1]).toMatchObject({ name: 'A', description: 'A' })
        expect(services[2]).toMatchObject({ name: 'B', description: 'A' })
      }

      {
        // Single field, no marker
        const svcRes = await request(app.getHttpServer())
          .get('/services')
          .query({ sort: 'name' })

        expect(svcRes.status).toBe(200)

        const { services } = svcRes.body
        expect(services[0]).toMatchObject({ name: 'A', description: 'A' })
        expect(services[1]).toMatchObject({ name: 'A', description: 'B' })
        expect(services[2]).toMatchObject({ name: 'B', description: 'A' })
      }
    })
  })

  it('/services (POST)', async () => {
    {
      await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'Demo',
          description: 'This is a demo service',
          version: { tag: 'v2.0.0', description: 'And this is a version' },
        })
        .expect(201)
        .expect('Location', /^\/services\/\d+$/)
        .expect((res) => expect(res.text).toBe(''))
    }

    {
      await request(app.getHttpServer()).post('/services').send({}).expect(400)
    }
  })

  describe('/services/:id (PATCH)', () => {
    it('patches detail fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'Demo',
          description: 'This is a demo service',
          version: { tag: 'v2.0.0', description: 'And this is a version' },
        })

      const location = response.headers['location']

      await request(app.getHttpServer())
        .patch(location)
        .send({ name: 'Blam' })
        .expect(200)
    })

    it('fails to patch unknown service', async () => {
      await request(app.getHttpServer())
        .patch('/services/0')
        .send({ name: 'Blam' })
        .expect(404)
    })

    it('fails to patch versions of service', async () => {
      const response = await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'Demo',
          description: 'This is a demo service',
          version: { tag: 'v2.0.0', description: 'And this is a version' },
        })

      const location = response.headers['location']

      {
        await request(app.getHttpServer())
          .patch(location)
          .send({
            version: { tag: 'v3.0.0', description: 'Third version' },
          })
          .expect(400)
      }

      {
        await request(app.getHttpServer())
          .patch(location)
          .send({
            versions: [{ tag: 'v3.0.0', description: 'Third version' }],
          })
          .expect(400)
      }
    })
  })

  it('/services/:id (GET)', async () => {
    const response = await request(app.getHttpServer())
      .post('/services')
      .send({
        name: 'Demo',
        description: 'This is a demo service',
        version: { tag: 'v2.0.0', description: 'And this is a version' },
      })

    const location = response.headers['location']

    return request(app.getHttpServer())
      .get(location)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toEqual('Demo')
        expect(res.body.description).toMatch(/demo service/)
        expect(res.body.versions).toHaveLength(1)
        expect(res.body.versions[0].tag).toEqual('v2.0.0')
        expect(res.body.versions[0].description).toMatch(/a version/)
      })
  })

  it('/services/:id/versions (GET)', async () => {
    const response = await request(app.getHttpServer())
      .post('/services')
      .send({
        name: 'Demo',
        description: 'This is a demo service',
        version: { tag: 'v2.0.0', description: 'And this is a version' },
      })

    const location = response.headers['location']

    return request(app.getHttpServer())
      .get(`${location}/versions`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body.versions).toHaveLength(1)
        expect(res.body.versions[0].tag).toEqual('v2.0.0')
        expect(res.body.versions[0].description).toMatch(/a version/)
      })
  })

  describe('/services/:id/versions (POST)', () => {
    it('create new version', async () => {
      const svcRes = await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'Demo',
          description: 'This is a demo service',
          version: { tag: 'v2.0.0', description: 'And this is a version' },
        })

      return request(app.getHttpServer())
        .post(`${svcRes.headers.location}/versions`)
        .send({
          tag: 'v2.2.2',
          description: 'Second version',
        })
        .expect('Location', /\/versions\/\d+$/)
        .expect(201)
    })

    it('fail when creating on an unknown service', () => {
      return request(app.getHttpServer())
        .post('/services/0/versions')
        .send({
          tag: 'v2.2.2',
          description: 'Second version',
        })
        .expect(404)
    })
  })

  describe('/services/:id (DELETE)', () => {
    it('delete service', async () => {
      const result = await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'A',
          description: 'A',
          version: { tag: 'v1', description: 'And this is a version' },
        })

      await request(app.getHttpServer())
        .delete(result.headers.location)
        .expect(200)

      await request(app.getHttpServer())
        .get(result.headers.location)
        .expect(404)
    })

    it('cannot delete non-existant service', async () => {
      return request(app.getHttpServer()).delete('/services/0').expect(404)
    })
  })

  describe('/services/:sid/versions/:vid (DELETE)', () => {
    it('delete version', async () => {
      const svc = await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'A',
          description: 'A',
          version: { tag: 'v1', description: 'And this is a version' },
        })

      const versions = await request(app.getHttpServer()).get(
        `${svc.headers.location}/versions`,
      )

      const versionPath = `${svc.headers.location}/versions/${versions.body.versions[0].id}`
      await request(app.getHttpServer()).delete(versionPath).expect(200)
      await request(app.getHttpServer()).get(versionPath).expect(404)

      const svcWithoutVersions = await request(app.getHttpServer()).get(
        svc.headers.location,
      )
      expect(svcWithoutVersions.body.versions.length).toBe(0)
    })

    it('can not delete non-existant version', async () => {
      const svc = await request(app.getHttpServer())
        .post('/services')
        .send({
          name: 'A',
          description: 'A',
          version: { tag: 'v1', description: 'And this is a version' },
        })

      return request(app.getHttpServer())
        .delete(`${svc.headers.location}/versions/0`)
        .expect(404)
    })
  })
})
