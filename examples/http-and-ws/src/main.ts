import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { WsAdapter } from '@lunafw/platform-ws'
import { AppModule } from './app.module'
import { DomainExceptionFilter } from './common/filters/domain-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'

const bootstrap = async (): Promise<void> => {
  const app = await LunaFactory.createApplication(AppModule, [
    new ExpressAdapter({ port: 3000 }),
    new WsAdapter({ port: 3001 }),
  ])

  app
    .useGlobalInterceptors(new LoggingInterceptor())
    .useGlobalFilters(new DomainExceptionFilter())

  await app.start()

  console.log('HTTP  → http://localhost:3000')
  console.log('WS    → ws://localhost:3001')
}

bootstrap()
