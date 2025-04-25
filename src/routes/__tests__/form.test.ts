'use strict'

import { test, before, after, describe } from 'node:test'
import * as assert from 'node:assert'
import { FastifyInstance } from 'fastify'
import { Form } from '@prisma/client'

import prisma from '../../db/db_client'
import build from '../../app'

describe('Form Routes', () => {
  let app: FastifyInstance
  let createdForm: Form

  before(async () => {
    app = build()
    await app.ready()
  })

  after(async () => {
    // Clean up test data
    if (createdForm) {
      await prisma.form.delete({
        where: { id: createdForm.id },
      })
    }
    await app.close()
  })

  test('POST / - should create a new form', async () => {
    const formData = {
      name: 'Test Form',
      fields: {
        name: {
          type: 'text',
          question: 'What is your name?',
          required: true,
        },
        age: {
          type: 'number',
          question: 'What is your age?',
        },
      },
    }

    const response = await app.inject({
      method: 'POST',
      url: '/form',
      payload: formData,
    })

    assert.equal(response.statusCode, 201)

    const responseJson = JSON.parse(response.body)
    assert.equal(responseJson.data.name, formData.name)

    // Verify fields structure
    assert.ok(typeof responseJson.data.fields === 'object')
    assert.equal(Object.keys(responseJson.data.fields).length, 2)
    assert.deepEqual(responseJson.data.fields.name, formData.fields.name)
    assert.deepEqual(responseJson.data.fields.age, formData.fields.age)

    // Verify in database
    const dbForm = await prisma.form.findUnique({
      where: { id: responseJson.data.id },
    })

    assert.notEqual(dbForm, null)
    assert.equal(dbForm?.name, formData.name)
    assert.ok(typeof dbForm?.fields === 'object')
    assert.deepEqual(dbForm?.fields, formData.fields)

    createdForm = responseJson.data
  })

  test('GET /:id - should return a form', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/form/${createdForm.id}`,
    })

    assert.equal(response.statusCode, 200)

    const responseJson = JSON.parse(response.payload)
    assert.equal(responseJson.data.id, createdForm.id)
    assert.equal(responseJson.data.name, createdForm.name)
    assert.ok(typeof responseJson.data.fields === 'object')
    assert.deepEqual(responseJson.data.fields, createdForm.fields)
  })

  test('GET /:id - should return 400 for non-existent form', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const response = await app.inject({
      method: 'GET',
      url: `/form/${nonExistentId}`,
    })

    assert.equal(response.statusCode, 400)
  })
})
