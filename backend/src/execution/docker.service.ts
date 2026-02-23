import { Injectable } from "@nestjs/common";
import Docker from "dockerode";
import { Writable } from "stream";

@Injectable()
export class DockerService {
    private readonly docker: Docker;

    constructor() {
        this.docker = new Docker();
    }

    async runCode(language: string, code: string): Promise<{ stdout: string; stderr: string } | string> {
        const image = this.getImageForLang(language);
        const cmd = this.getCmd(language, code);

        const container = await this.docker.createContainer({
            Image: image,
            Cmd: cmd,
            Tty: false,
            NetworkDisabled: true,
            HostConfig: {
                Memory: 128 * 1024 * 1024,
                CpuPeriod: 100000,
                CpuQuota: 50000,
            }
        })

        try {
            await container.start();

            const logs = await container.logs({
                follow: true,
                stdout: true,
                stderr: true,
            })

            const output = await this.compileOutput(logs, container);
            return output;
        } catch (error) {
            console.error('Docker Error', error);
            return `Error exeecuting code: ${error.message}`;
        } finally {
            try {
                await container.remove({ force: true });
            } catch (e) {

            }
        }
    }

    private getImageForLang(lang: string): string {
        switch (lang) {
            case 'python': return 'python:alpine'
            case 'javascript': return 'node:alpine'
            default: throw new Error(`Unsupported Language: ${lang}`)
        }
    }

    private getCmd(lang: string, code: string): string[] {
        switch (lang) {
            case 'python': return ['python', '-c', code];
            case 'javascript': return ['node', '-e', code];
            default: return [];
        }
    }

    private async compileOutput(stream: any, container: any): Promise<{ stdout: string, stderr: string }> {
        return new Promise((resolve, reject) => {
            let stdoutBuffer = '';
            let stderrBuffer = '';

            const stdoutStream = new Writable({
                write(chunk, encoding, next) {
                    stdoutBuffer += chunk.toString();
                    next()
                }
            })

            const stderrStream = new Writable({
                write(chunk, encoding, next) {
                    stderrBuffer += chunk.toString();
                    next()
                }
            })
            container.modem.demuxStream(stream, stdoutStream, stderrStream);

            stream.on('end', async () => {

                await container.wait();
                resolve({ stdout: stdoutBuffer.trim(), stderr: stderrBuffer.trim() });
            });
        })
    }
}