import { FastifyInstance } from 'fastify'
import { SourceRecord } from '@prisma/client'

import prisma from '../db/db_client'
import { serializer } from './middleware/pre_serializer'
import { IEntityId } from './schemas/common'
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
}

export default sourceRecordRoutes
