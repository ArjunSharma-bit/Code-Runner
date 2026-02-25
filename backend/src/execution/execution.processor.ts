import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { DockerService } from "./docker.service";

@Processor('code-execution')
export class ExecutionProcessor {
    constructor(private readonly dockerService: DockerService) { }

    @Process({ name: 'execute-job', concurrency: 3 })
    async handleExecution(job: Job) {
        console.log('Worker picked up job:', job.id)

        const { language, code } = job.data

        const output = await this.dockerService.runCode(language, code)

        console.log('Job Completed:', job.id)
        console.log('=-=-=-=-=-=-=-=-=-=-=-=-=')
        console.log(output)
        console.log('=-=-=-=-=-=-=-=-=-=-=-=-=')

        return { result: output }
    }
}