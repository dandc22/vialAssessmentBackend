import { FastifyInstance } from 'fastify'
import { SourceRecord } from '@prisma/client'

import prisma from '../db/db_client'
import { serializer } from './middleware/pre_serializer'
import {
  GetByFormIdParams,
  IEntityId,
  IGetByFormIdParams,
  ISourceRecordInput,
  SourceRecordInput,
  SourceRecordDataOutput,
} from './schemas/common'
import { ApiError } from '../errors'

async function sourceRecordRoutes(app: FastifyInstance) {
  app.setReplySerializer(serializer)

  const log = app.log.child({ component: 'sourceRecordRoutes' })

  /**
   * @swagger
   * /source-records/{id}:
   *   get:
   *     tags:
   *       - source-records
   *     summary: Get a source record by ID
   *     description: Retrieves a single source record by its unique identifier
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Unique identifier of the source record
   *     responses:
   *       200:
   *         description: Source record found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SourceRecord'
   *       400:
   *         description: Bad request or record not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   */
  app.get<{
    Params: IEntityId
    Reply: SourceRecord
  }>('/:id', {
    schema: {
      querystring: GetByFormIdParams,
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            formId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            sourceData: {
              type: 'array',
              items: SourceRecordDataOutput,
            },
          },
        },
        400: {
          description: 'Bad request or record not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    async handler(req, reply) {
      const { params } = req
      const { id } = params
      log.info('get source record by id')
      try {
        const sourceRecord = await prisma.sourceRecord.findUniqueOrThrow({
          where: { id },
          include: {
            sourceData: true,
          },
        })
        reply.send(sourceRecord)
      } catch (err: any) {
        log.error({ err }, err.message)
        throw new ApiError('failed to fetch source record', 400)
      }
    },
  })

  /**
   * @swagger
   * /source-records:
   *   get:
   *     tags:
   *       - source-records
   *     summary: Get all source records for a form
   *     description: Retrieves all source records associated with a specific form
   *     parameters:
   *       - in: query
   *         name: formId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID of the form to get records for
   *     responses:
   *       200:
   *         description: List of source records
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/SourceRecord'
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   */
  app.get<{
    Querystring: IGetByFormIdParams
    Reply: SourceRecord[]
  }>('/', {
    schema: {
      querystring: GetByFormIdParams,
      response: {
        200: {
          description: 'Successful response',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              formId: { type: 'string', format: 'uuid' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              sourceData: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    answer: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Bad request',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    async handler(req, reply) {
      const { formId } = req.query
      log.info('get source records by formId')
      try {
        const sourceRecords = await prisma.sourceRecord.findMany({
          where: { formId },
          include: {
            sourceData: true,
          },
        })
        reply.send(sourceRecords)
      } catch (err: any) {
        log.error({ err }, err.message)
        throw new ApiError('failed to fetch source records', 400)
      }
    },
  })

  /**
   * @swagger
   * /source-records:
   *   post:
   *     tags:
   *       - source-records
   *     summary: Create a new source record
   *     description: Creates a new source record with the provided form data
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - formId
   *               - sourceData
   *             properties:
   *               formId:
   *                 type: string
   *                 format: uuid
   *                 description: ID of the form this record belongs to
   *               sourceData:
   *                 type: object
   *                 additionalProperties:
   *                   type: string
   *                 description: Key-value pairs of form field answers
   *     responses:
   *       201:
   *         description: Source record created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SourceRecord'
   *       400:
   *         description: Bad request or validation error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   */
  app.post<{
    Body: ISourceRecordInput
    Reply: SourceRecord
  }>('/', {
    schema: {
      body: SourceRecordInput,
      response: {
        201: {
          description: 'Source record created successfully',
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            formId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            sourceData: {
              type: 'array',
              items: SourceRecordDataOutput,
            },
          },
        },
        400: {
          description: 'Bad request or validation error',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    async handler(req, reply) {
      const { body } = req
      log.info('create source record')

      try {
        const form = await prisma.form.findUniqueOrThrow({
          where: { id: body.formId },
        })

        const formFields = form.fields as Record<
          string,
          { type: string; question: string; required: boolean }
        >

        // Validate required fields
        for (const [fieldId, field] of Object.entries(formFields)) {
          if (field.required && !body.sourceData[fieldId]) {
            throw new ApiError(`Missing required field: ${field.question}`, 400)
          }
        }

        // Create source record and its data
        const sourceRecord = await prisma.sourceRecord.create({
          data: {
            formId: body.formId,
            sourceData: {
              create: Object.entries(body.sourceData).map(
                ([fieldId, answer]) => ({
                  question: formFields[fieldId].question,
                  answer,
                })
              ),
            },
          },
          include: {
            sourceData: true,
          },
        })

        reply.status(201).send(sourceRecord)
      } catch (err: any) {
        log.error({ err }, err.message)
        if (err instanceof ApiError) {
          throw err
        }
        throw new ApiError('failed to create source record', 400)
      }
    },
  })
}

export default sourceRecordRoutes
