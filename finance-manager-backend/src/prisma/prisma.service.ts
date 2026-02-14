import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

    constructor() {
        const adapter = new PrismaPg({
          connectionString: process.env.DATABASE_URL as string,
        });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async enableShutdownHooks() {
        process.on('beforeExit', async () => {
          await this.$disconnect();
        });
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}