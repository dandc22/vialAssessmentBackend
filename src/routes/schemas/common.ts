import { Static, Type } from '@sinclair/typebox'

import { Uuid } from './typebox_base'

export const EntityId = Type.Object({
  id: Uuid(),
})

export type IEntityId = Static<typeof EntityId>

export const SourceRecordDataOutput = Type.Object({
  question: Type.String(),
  answer: Type.String(),
})

export const FormInput = Type.Object({
  name: Type.String(),
  fields: Type.Record(
    Type.String(),
    Type.Object({
      type: Type.String(),
      question: Type.String(),
      required: Type.Optional(Type.Boolean()),
    })
  ),
})

export type IFormInput = Static<typeof FormInput>

export const SourceRecordInput = Type.Object({
  formId: Type.String({ format: 'uuid' }),
  sourceData: Type.Record(Type.String(), Type.String()),
})

export type ISourceRecordInput = Static<typeof SourceRecordInput>

export const GetByFormIdParams = Type.Object({
  formId: Type.String({ format: 'uuid' }),
})

export type IGetByFormIdParams = Static<typeof GetByFormIdParams>