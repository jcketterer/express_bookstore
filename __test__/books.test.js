process.env.NODE_ENV = 'test'

const request = require('supertest')
const app = require('../app')
const db = require('../db')

let book_isbn

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO books (
      isbn,
      amazon_url,
      author,
      language,
      pages,
      publisher,
      title,
      year
    )
    VALUES (
      '123456789',
      'https://www.amazon.com/booky-book-book',
      'Old Gregg',
      'English',
      500,
      'Baileys Shoes Press',
      'Motha-licka',
      2004
    )
    RETURNING isbn
  `)
  book_isbn = result.rows[0].isbn
})

describe('POST /books', function () {
  test('Creating a book', async function () {
    const res = await request(app).post(`/books`).send({
      isbn: '987654321',
      amazon_url: 'https://www.amazon.com/book-bookity',
      author: 'Petey',
      language: 'English',
      pages: 420,
      publisher: 'Jerod Letuce Press',
      title: 'Attack Helicopter',
      year: 2022
    })
    expect(res.statusCode).toBe(201)
    expect(res.body.book).toHaveProperty('isbn')
  })
  test('Prevents creating a book with out a required title', async () => {
    const res = await request(app).post(`/books`).send({ year: 2022 })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /books', function () {
  test('Getting a list of 1 book', async function () {
    const res = await request(app).get(`/books`)
    const oneBook = res.body.books
    expect(oneBook).toHaveLength(1)
    expect(oneBook[0]).toHaveProperty('isbn')
    expect(oneBook[0]).toHaveProperty('amazon_url')
  })
})

describe('GET /books/:isnb', function () {
  test('Pulls one book', async function () {
    const res = await request(app).get(`/books/${book_isbn}`)
    expect(res.body.book).toHaveProperty('isbn')
    expect(res.body.book.isbn).toBe(book_isbn)
  })
  test('Responds with 404 when book is not found', async function () {
    const res = await request(app).get('/books/900000')
    expect(res.statusCode).toBe(404)
  })
})

describe('PUT /books/:id', function () {
  test('Updates book entry', async function () {
    const res = await request(app).put(`/books/${book_isbn}`).send({
      amazon_url: 'https://www.amazon.com/book-bookity',
      author: 'Petey',
      language: 'English',
      pages: 420,
      publisher: 'Jerod Letuce Press',
      title: 'ATTACK! Helicopter',
      year: 2022
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.book).toHaveProperty('isbn')
    expect(res.body.book.title).toBe('ATTACK! Helicopter')
  })
  test('Prevents Bad Update', async function () {
    const res = await request(app).put(`/books/${book_isbn}`).send({
      isbn: '987654321',
      amazon_url: 'https://www.amazon.com/book-bookity',
      author: 'Petey',
      language: 'English',
      pages: 420,
      publisher: 'Jerod Letuce Press',
      title: 'ATTACK! Helicopter',
      year: 2022
    })
    expect(res.statusCode).toBe(400)
  })
  test('Responds with 404 when isbn not found', async function () {
    await request(app).delete(`/books/${book_isbn}`)
    const res = await request(app).delete(`/books/${book_isbn}`)
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /books/:id', function () {
  test('Deletes a book', async function () {
    const res = await request(app).delete(`/books/${book_isbn}`)
    expect(res.body.message).toEqual('Book deleted')
  })
})

afterEach(async function () {
  await db.query('DELETE FROM BOOKS')
})

afterAll(async function () {
  await db.end()
})
