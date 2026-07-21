import { ConfigModule } from '@lunafw/config'

ConfigModule.load()

import { LunaFactory } from '@lunafw/common'
import { ExpressAdapter } from '@lunafw/platform-express'
import { AppModule } from './app.module'

const bootstrap = async (): Promise<void> => {
  const port = Number(process.env.PORT ?? 3000)

  const adapter = new ExpressAdapter({ port })
  const app = await LunaFactory.createApplication(AppModule, adapter)

  await app.start()

  console.log(`REST API → http://localhost:${adapter.getPort()}`)
}

bootstrap()
