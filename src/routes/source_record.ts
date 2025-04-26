import { FastifyInstance } from 'fastify'
import { SourceRecord } from '@prisma/client'
import { Static, Type } from '@sinclair/typebox'

import prisma from '../db/db_client'
import { serializer } from './middleware/pre_serializer'
import { IEntityId, ISourceRecordInput } from './schemas/common'
import { ApiError } from '../errors'

async function sourceRecordRoutes(app: FastifyInstance) {
  app.setReplySerializer(serializer)

  const log = app.log.child({ component: 'sourceRecordRoutes' })

  app.get<{
    Params: IEntityId
    Reply: SourceRecord
  }>('/:id', {
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

  const GetByFormIdParams = Type.Object({
    formId: Type.String({ format: 'uuid' }),
  })

  type IGetByFormIdParams = Static<typeof GetByFormIdParams>

  app.get<{
    Querystring: IGetByFormIdParams
    Reply: SourceRecord[]
  }>('/', {
    schema: {
      querystring: GetByFormIdParams,
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

  app.post<{
    Body: ISourceRecordInput
    Reply: SourceRecord
  }>('/', {
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
