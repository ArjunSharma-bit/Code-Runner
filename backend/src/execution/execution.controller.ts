import { InjectQueue } from '@nestjs/bull';
import { Body, Controller, Post } from '@nestjs/common';
import type { Queue } from 'bull';

@Controller('execute')
export class ExecutionController {
    constructor(@InjectQueue('code-execution') private executionQueue: Queue) { }

    @Post()
    async executeCode(@Body() body: { language: string; code: string }) {
        if (!body.code) return { error: 'Code is Required' };

        const job = await this.executionQueue.add('execute-job', {
            language: body.language,
            code: body.code,
        })

        return {
            message: 'Job queued successfully', jobId: job.id,
        }
    }
}
