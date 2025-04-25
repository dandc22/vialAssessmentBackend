import fastify from 'fastify'

import formRoutes from './routes/form'
import sourceRecordRoutes from './routes/source_record'
import errorHandler from './errors'

function build(opts = {}) {
  const app = fastify(opts)

  app.register(formRoutes, { prefix: '/form' })
  app.register(sourceRecordRoutes, { prefix: '/source-record' })

  app.setErrorHandler(errorHandler)

  return app
}
export default build
