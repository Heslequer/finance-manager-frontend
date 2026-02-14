import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { IncomesModule } from './incomes/incomes.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CategoriesModule } from './categories/categories.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthMiddleware } from './auth/middlewares/jwt-auth.middleware';
import { PrismaService } from './prisma/prisma.service';


@Module({
  imports: [
    AuthModule,
    JwtModule.register({}),
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    IncomesModule,
    ExpensesModule,
    CategoriesModule,
    SubcategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes('*');
  }
}
