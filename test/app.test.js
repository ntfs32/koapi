const { Koapi, router, middlewares } = require('../lib')
const request = require('supertest')
const internal = []
const path = require('path')
const fs = require('fs')
const { afterAll, describe, it, expect } = global

afterAll(() => internal.forEach(server => server.close()))

const setup = (config) => {
  const app = new Koapi()
  app.use(middlewares.compress())
  config(app)
  const server = app.listen(null)
  internal.push(server)
  return {app, server}
}

describe('basic', () => {
  const {server} = setup(app => app)
  it('server should get 404 not found', () => {
    const res = request(server).get('/').set('Accept', 'application/json').then(res => expect(res.status).toBe(404))
    return res
  })
})

describe('advanced', () => {
  let { server } = setup(app => {
    app.use(middlewares.jsonError({emit: false}))
    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (e) { throw e }
    })
    app.use(middlewares.routers([
      router.define(router => router.get('/', async ctx => { ctx.body = 'Hello World' })),
      router.define(router => {
        router.post('/upload', async ctx => { ctx.status = 201 })
        router.get('/test', async ctx => { ctx.body = 'test' })
        router.get('/error', async ctx => { throw new Error('error') })
      })
    ]))
  })
  it('should get 200 ok', () =>
    request(server)
      .get('/')
      .then(res => {
        expect(res.status).toBe(200)
        expect(res.text).toBe('Hello World')
      })
  )
  it('should get 500 ok', () => request(server)
                                .get('/error')
                                .then(res => {
                                  expect(res.status).toBe(500)
                                  expect(res.body.message).toBe('error')
                                }))
  it('should get 200 ok', () => request(server)
                                .get('/test')
                                .then(res => {
                                  expect(res.status).toBe(200)
                                  expect(res.text).toBe('test')
                                }))
  it('should upload 201 created', () => request(server)
                                  .post('/upload')
                                  .attach('file', fs.readFileSync(path.resolve(__dirname, 'lib/upload.txt')))
                                  .then(res => {
                                    expect(res.status).toBe(201)
                                  }))
})

describe('haha', () => {
  let { server } = setup(app => {
    app.use(middlewares.routers([
      middlewares.subdomain('api.*', router.define(router => router.get('/', ctx => { ctx.body = 'api' })).routes()),
      router.define(router => router.get('/', ctx => { ctx.body = 'index' }))
    ]))
  })

  it('subdomain should get index', () => request(server)
                                .get('/')
                                .then(res => {
                                  expect(res.text).toBe('index')
                                  expect(res.status).toBe(200)
                                }))
  it('subdomain should get api', () => request(server)
                              .get('/')
                              .set('Host', 'api.test.com')
                              .then(res => {
                                expect(res.status).toBe(200)
                                expect(res.text).toBe('api')
                              }))
})
