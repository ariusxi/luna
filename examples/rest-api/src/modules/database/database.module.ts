import { Module } from '@lunafw/core'
import { PrismaClient } from '@prisma/client'

export const PRISMA = 'PRISMA'

@Module({
  providers: [
    {
      provide: PRISMA,
      useFactory: () => new PrismaClient(),
    },
  ],
  exports: [PRISMA],
})
export class DatabaseModule {}
