import { NumberOptions, StringOptions, Type } from '@sinclair/typebox'

export const Uuid = (options: Omit<StringOptions, 'format'> = {}) =>
  Type.String({
    format: 'uuid',
    ...options,
  })

// export const Email = (options: Omit<StringOptions, 'format'> = {}) =>
//   Type.String({
//     format: 'email',
//     ...options,
//   })

// export const DateString = (options: Omit<StringOptions, 'format'> = {}) =>
//   Type.String({
//     format: 'date-time',
//     ...options,
//   })

// export const Integer = (options: NumberOptions = {}) =>
//   Type.Integer({
//     ...options,
//   })

// export const Float = (options: NumberOptions = {}) =>
//   Type.Number({
//     ...options,
//   })
