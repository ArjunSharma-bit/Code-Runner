import { OnQueueCompleted, OnQueueFailed, Processor } from "@nestjs/bull";
import { EventsGateway } from "./events.gateway";
import type { Job } from "bull";

@Processor('code-execution')
export class QueueListener {
    constructor(private readonly eventsGateway: EventsGateway) { }

    @OnQueueCompleted()
    async onCompleted(job: Job, result: any) {
        this.eventsGateway.notifyJobFinished(job.id.toString(), {
            status: 'completed', result: result,
        })
    }

    @OnQueueFailed()
    async onFailed(job: Job, error: Error) {
        this.eventsGateway.notifyJobFinished(job.id.toString(), {
            status: 'failed', error: error.message,
        })
    }
}