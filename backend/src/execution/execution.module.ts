import { Module } from '@nestjs/common';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { BullModule } from '@nestjs/bull';
import { ExecutionProcessor } from './execution.processor';

@Module({
  imports: [BullModule.registerQueue({
    name: 'code-execution',
  }),
  ],
  controllers: [ExecutionController],
  providers: [ExecutionService, ExecutionProcessor]
})
export class ExecutionModule { }
