'use strict'

import { test, before, after, describe } from 'node:test'
import * as assert from 'node:assert'
import { FastifyInstance } from 'fastify'
import { SourceRecord, Form } from '@prisma/client'

import prisma from '../../db/db_client'
import build from '../../app'

describe('Source Record Routes', () => {
  let app: FastifyInstance
  let testForm: Form
  let testSourceRecord: SourceRecord

  before(async () => {
    app = build()
    await app.ready()

    // Create test data
    testForm = await prisma.form.create({
      data: {
        name: 'Test Form',
        fields: {
          name: {
            type: 'text',
            question: 'What is your name?',
            required: true,
          },
        },
      },
    })

    testSourceRecord = await prisma.sourceRecord.create({
      data: {
        formId: testForm.id,
        sourceData: {
          create: [
            {
              question: 'What is your name?',
              answer: 'John Doe',
            },
          ],
        },
      },
    })
  })

  after(async () => {
    // Clean up test data
    await prisma.sourceData.deleteMany({
      where: { sourceRecordId: testSourceRecord.id },
    })
    await prisma.sourceRecord.delete({
      where: { id: testSourceRecord.id },
    })
    await prisma.form.delete({ where: { id: testForm.id } })
    await app.close()
  })

  test('GET /:id - should return a source record', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/source-record/${testSourceRecord.id}`,
    })

    assert.equal(response.statusCode, 200)

    const responseJson = JSON.parse(response.payload)
    assert.equal(responseJson.data.id, testSourceRecord.id)
    assert.equal(responseJson.data.formId, testForm.id)

    // Verify sourceData is included
    assert.ok(Array.isArray(responseJson.data.sourceData))
    assert.equal(responseJson.data.sourceData.length, 1)
    assert.equal(responseJson.data.sourceData[0].question, 'What is your name?')
    assert.equal(responseJson.data.sourceData[0].answer, 'John Doe')
  })

  test('GET /:id - should return 400 for non-existent source record', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const response = await app.inject({
      method: 'GET',
      url: `/source-record/${nonExistentId}`,
    })

    assert.equal(response.statusCode, 400)
  })

  test('POST / - should create a source record with valid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/source-record',
      payload: {
        formId: testForm.id,
        sourceData: {
          name: 'Jane Doe',
        },
      },
    })

    assert.equal(response.statusCode, 201)

    const responseJson = JSON.parse(response.payload)
    assert.equal(responseJson.data.formId, testForm.id)

    // Verify sourceData was created correctly
    assert.ok(Array.isArray(responseJson.data.sourceData))
    assert.equal(responseJson.data.sourceData.length, 1)
    assert.equal(responseJson.data.sourceData[0].question, 'What is your name?')
    assert.equal(responseJson.data.sourceData[0].answer, 'Jane Doe')

    // Clean up created record
    await prisma.sourceData.deleteMany({
      where: { sourceRecordId: responseJson.data.id },
    })
    await prisma.sourceRecord.delete({
      where: { id: responseJson.data.id },
    })
  })

  test('POST / - should return 400 for missing required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/source-record',
      payload: {
        formId: testForm.id,
        sourceData: {},
      },
    })

    assert.equal(response.statusCode, 400)
    const responseJson = JSON.parse(response.payload)
    assert.match(responseJson.message, /Missing required field/)
  })

  test('POST / - should return 400 for non-existent form', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const response = await app.inject({
      method: 'POST',
      url: '/source-record',
      payload: {
        formId: nonExistentId,
        sourceData: {
          name: 'Jane Doe',
        },
      },
    })

    assert.equal(response.statusCode, 400)
  })
})
