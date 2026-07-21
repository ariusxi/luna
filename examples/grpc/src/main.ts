import 'reflect-metadata'
import path from 'path'
import { LunaFactory } from '@lunafw/common'
import { GrpcAdapter } from '@lunafw/platform-grpc'
import { AppModule } from './app.module'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'

const bootstrap = async (): Promise<void> => {
  const adapter = new GrpcAdapter({
    port: 50051,
    protoPath: path.join(__dirname, 'proto', 'users.proto'),
    packageName: 'users',
  })

  const app = await LunaFactory.createApplication(AppModule, adapter)

  app.useGlobalInterceptors(new LoggingInterceptor())

  await app.start()

  console.log('gRPC → localhost:50051')
}

bootstrap()
