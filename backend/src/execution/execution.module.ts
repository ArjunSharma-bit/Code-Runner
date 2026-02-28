import { Module } from '@nestjs/common';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { BullModule } from '@nestjs/bull';
import { ExecutionProcessor } from './execution.processor';
import { DockerService } from './docker.service';
import { EventsGateway } from './events.gateway';
import { QueueListener } from './queue.listener';

@Module({
  imports: [BullModule.registerQueue({
    name: 'code-execution',
  }),
  ],
  controllers: [ExecutionController],
  providers: [ExecutionService, ExecutionProcessor, DockerService, EventsGateway, QueueListener]
})
export class ExecutionModule { }
