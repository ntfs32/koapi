const { server } = require('./lib/server')
const { restful, request } = require('../lib/test')
const Promise = require('bluebird')
const { describe, test, afterAll, expect } = global

afterAll(async () => {
  await Promise.promisify(server.close).call(server)
})

function addQuery (before = 'abc') {
  return req => req.query({before})
}

describe('Aggregate', () => {
  test('aggregate', async () => {
    const res = await request(server).get('/aggregate/posts')
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
  })

  test('aggregate filters', async () => {
    const res = await request(server).get('/aggregate/posts?filters[test1]=hehe&q=le')
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body[0].total).toBe('1')
  })

  test('aggregate filters', async () => {
    const res = await request(server).get('/aggregate/posts?filters[test1]=hehe&q=le')
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body[0].total).toBe('1')
  })
})

describe('search & filter', () => {
  test('search', async () => {
    const res = await request(server).get('/posts?before=abc&q=OnlyForSearch')
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body.length).toBe(1)
  })
  test('normal filter', async () => {
    const res = await request(server).get('/posts?before=abc&filters[user_id]=1000')
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body.length).toBe(0)
    const res1 = await request(server).get('/posts?before=abc&filters[user_id]=500')
    expect(res1.status).toBe(200)
    expect(res1.body).toBeInstanceOf(Array)
  })
  test('custom filter', async () => {
    const res = await request(server).get('/posts?before=abc&filters[tag]=A')
    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
    expect(res.body.length).toBe(1)
  })
})

describe('RESTful Tester Basic', () => {
  const posts = restful(server, '/posts', {teardown: false})
  posts.create({
    title: 'Basic',
    content: 'Basic Content',
    tags: ['c', 'd'],
    test1: 'haha'
  }, {
    use: addQuery(),
    assert (res, {success}) {
      success(res, false)
      expect(res.body.title).toBe('Hehe')
    }
  })
  posts.list(async ({req}) => {
    const items = await req.query({before: 'abc'}).send({
      title: 'Basic',
      content: 'Basic Content',
      tags: ['c', 'd'],
      test1: 'haha'
    })
    return items
  }, {
    use: addQuery(),
    assert (res) {
      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
    }
  })
  posts.item(async ({req}) => {
    const item = await req.query({before: 'abc'}).send({
      title: 'Basic',
      content: 'Basic Content',
      tags: ['c', 'd'],
      test1: 'haha'
    })
    return item
  }, {
    use: addQuery(),
    assert (res, {success, item}) {
      success(res)
      // TODO
    }
  })
  posts.update(async ({req}) => {
    const item = await req.query({before: 'abc'}).send({
      title: 'Basic',
      content: 'Basic Content',
      tags: ['c', 'd'],
      test1: 'haha'
    })
    return item
  }, {
    use: addQuery(),
    patch: {title: 'Patched'}
  })
  posts.destroy(async ({req}) => {
    const item = await req.query({before: 'abc'}).send({
      title: 'Basic',
      content: 'Basic Content',
      tags: ['c', 'd'],
      test1: 'haha'
    })
    return item
  }, { use: addQuery() })
})
describe('RESTful Tester Setup', () => {
  const posts = restful(server, '/posts', {teardown: false})
  posts.setup(async ({create}) => {
    const item = await create([{
      title: 'setup',
      content: 'setup content',
      tags: ['c', 'd'],
      test1: 'haha'
    }], {
      use: addQuery()
    })
    return item
  })
  posts.use(addQuery())
  posts.crud({patch: {title: 'patched'}})
})

describe('RESTful Tester Nested', () => {
  const comments = restful(server, ['/posts', '/comments'], {teardown: false})
  comments.setup(async ({create}) => {
    const item = await create([
      {
        title: 'abc',
        content: 'nested post',
        tags: ['c', 'd'],
        test1: 'haha'
      },
      {
        title: 'abc',
        content: 'nested comment',
        user_id: 1
      }
    ], {
      use: addQuery()
    })
    return item
  })
  comments.crud({patch: {title: 'patched comment'}})
})
