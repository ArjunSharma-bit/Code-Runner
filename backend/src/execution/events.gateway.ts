import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";


@WebSocketGateway({
    cors: {
        origin: '*'
    },
})
export class EventsGateway {
    @WebSocketServer()
    server: Server;

    notifyJobFinished(jobId: string, result: any) {
        console.log(`Emitting Event For Job ${jobId}`)

        this.server.emit(`Job: ${jobId}`, result)
    }
}