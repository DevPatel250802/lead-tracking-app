import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { LeadsModule } from './leads/leads.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './leads/health/health.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    
  imports: [

    ConfigModule.forRoot({
      isGlobal: true, // with this we can access the .env through the configmodule any where without there importing ...
    }),

    TypeOrmModule.forRoot({ // note : forRoot will establish the connection b/w ORM and database..
      type: 'better-sqlite3',
      database: 'database.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
    LeadsModule,
    AuthModule
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {} // note : entry point class of the application
