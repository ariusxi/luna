import { LunaFactory } from '@lunafw/core'

import { AppModule } from './app.module'

const bootstrap = async () => {
  const app = await LunaFactory.create(AppModule)

  await app.start()
}
bootstrap()