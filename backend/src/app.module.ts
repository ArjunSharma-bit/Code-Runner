import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExecutionModule } from './execution/execution.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [BullModule.forRoot({
    redis: {
      host: 'localhost',
      port: 6388,
    }
  }), ExecutionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
