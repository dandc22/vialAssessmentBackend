import { FastifyInstance } from 'fastify'

import { Form } from '@prisma/client'

import prisma from '../db/db_client'
import { serializer } from './middleware/pre_serializer'
import { IEntityId, IFormInput } from './schemas/common'
import { ApiError } from '../errors'

async function formRoutes(app: FastifyInstance) {
  app.setReplySerializer(serializer)

  const log = app.log.child({ component: 'formRoutes' })

  /**
   * @swagger
   * /forms:
   *   get:
   *     tags:
   *       - forms
   *     summary: List all forms
   *     description: Retrieves a list of all available forms
   *     responses:
   *       200:
   *         description: List of forms retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Form'
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
    Reply: Form[]
  }>('/', {
    async handler(req, reply) {
      log.info('list all forms')
      try {
        const forms = await prisma.form.findMany()
        reply.send(forms)
      } catch (err: any) {
        log.error({ err }, err.message)
        throw new ApiError('failed to fetch forms', 400)
      }
    },
  })

  /**
   * @swagger
   * /forms/{id}:
   *   get:
   *     tags:
   *       - forms
   *     summary: Get a form by ID
   *     description: Retrieves a single form by its unique identifier
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Unique identifier of the form
   *     responses:
   *       200:
   *         description: Form found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Form'
   *       400:
   *         description: Bad request or form not found
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

  /**
   * @swagger
   * /forms:
   *   post:
   *     tags:
   *       - forms
   *     summary: Create a new form
   *     description: Creates a new form with the specified name and fields
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - fields
   *             properties:
   *               name:
   *                 type: string
   *                 description: Name of the form
   *               fields:
   *                 type: object
   *                 additionalProperties:
   *                   type: object
   *                   properties:
   *                     type:
   *                       type: string
   *                       description: Type of the field
   *                     question:
   *                       type: string
   *                       description: Question text for the field
   *                     required:
   *                       type: boolean
   *                       description: Whether the field is required
   *     responses:
   *       201:
   *         description: Form created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Form'
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

  /**
   * @swagger
   * /forms/{id}/source-record:
   *   get:
   *     tags:
   *       - forms
   *     summary: Get source record IDs for a form
   *     description: Retrieves a list of source record IDs associated with the specified form
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID of the form to get source records for
   *     responses:
   *       200:
   *         description: List of source record IDs
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     format: uuid
   *       400:
   *         description: Bad request or form not found
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

  /**
   * @swagger
   * /forms/{id}:
   *   put:
   *     tags:
   *       - forms
   *     summary: Update a form
   *     description: Updates an existing form with new name and fields
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID of the form to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - fields
   *             properties:
   *               name:
   *                 type: string
   *                 description: New name for the form
   *               fields:
   *                 type: object
   *                 additionalProperties:
   *                   type: object
   *                   properties:
   *                     type:
   *                       type: string
   *                       description: Type of the field
   *                     question:
   *                       type: string
   *                       description: Question text for the field
   *                     required:
   *                       type: boolean
   *                       description: Whether the field is required
   *     responses:
   *       200:
   *         description: Form updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Form'
   *       400:
   *         description: Bad request, validation error, or form not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   */
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
