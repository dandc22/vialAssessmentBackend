import { FastifyInstance } from 'fastify'

import { Form } from '@prisma/client'

import prisma from '../db/db_client'
import { serializer } from './middleware/pre_serializer'
import { IEntityId, IFormInput } from './schemas/common'
import { ApiError } from '../errors'

async function formRoutes(app: FastifyInstance) {
  app.setReplySerializer(serializer)

  const log = app.log.child({ component: 'formRoutes' })

  app.get<{
    Params: IEntityId
    Reply: Form
  }>('/:id', {
    async handler(req, reply) {
      const { params } = req
      const { id } = params
      log.info('get form by id')
      try {
        const form = await prisma.form.findUniqueOrThrow({ where: { id } })
        reply.send(form)
      } catch (err: any) {
        log.error({ err }, err.message)
        throw new ApiError('failed to fetch form', 400)
      }
    },
  })

  app.post<{
    Body: IFormInput
    Reply: Form
  }>('/', {
    async handler(req, reply) {
      const { body } = req
      log.info('create form')
      try {
        const form = await prisma.form.create({
          data: {
            name: body.name,
            fields: body.fields,
          },
        })

        reply.status(201).send(form)
      } catch (err: any) {
        log.error({ err }, err.message)
        throw new ApiError('failed to create form', 400)
      }
    },
  })

  app.get<{
    Params: IEntityId
    Reply: IEntityId[]
  }>('/:id/source-record', {
    async handler(req, reply) {
      const { params } = req
      const { id } = params
      log.info('get form source record by id')
      try {
        const sourceRecords = await prisma.sourceRecord.findMany({
          where: { formId: id },
          select: {
            id: true,
          },
        })
        reply.send(sourceRecords)
      } catch (err: any) {
        log.error({ err }, err.message)
        throw new ApiError('failed to fetch form source record', 400)
      }
    },
  })

  app.put<{
    Params: IEntityId
    Body: IFormInput
    Reply: Form
  }>('/:id', {
    async handler(req, reply) {
      const { params, body } = req
      const { id } = params
      log.info('update form')
      try {
        const form = await prisma.form.update({
          where: { id },
          data: {
            name: body.name,
            fields: body.fields,
          },
        })

        reply.send(form)
      } catch (err: any) {
        log.error({ err }, err.message)
        throw new ApiError('failed to update form', 400)
      }
    },
  })
}
export default formRoutes
