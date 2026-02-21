import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";

@Processor('code-execution')
export class ExecutionProcessor {

    @Process('execute-job')
    async handleExecution(job: Job) {
        console.log('Worker picked up job:', job.id)
        console.log('Code to run:', job.data.code)

        await new Promise((resolve) => setTimeout(resolve, 3000))

        console.log('Job Completed;', job.id)
        return { result: 'Hello World (Sim)' }
    }
}