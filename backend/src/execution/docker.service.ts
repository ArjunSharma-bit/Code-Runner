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

            const timeOutMs = 5000;

            const timeOutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Time Limit exceeded')), timeOutMs)
            })

            const execPromise = (async () => {
                const logs = await container.logs({
                    follow: true,
                    stdout: true,
                    stderr: true,
                })

                const output = await this.compileOutput(logs, container);
                return output;
            })()

            const result = await Promise.race([execPromise, timeOutPromise])

            return result as string;
        } catch (error) {
            console.error('Docker Error', error);
            return `Error exeecuting code: ${error.message}`;
        } finally {
            try {
                await container.remove({ force: true });
            } catch (e) { }
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

            const Max_Buffer_Size = 10 * 1024;
            let stdoutTruncated = false;
            let stderrTruncated = false;


            const stdoutStream = new Writable({
                write(chunk, encoding, next) {
                    if (stdoutTruncated) return next()

                    const text = chunk.toString();
                    if (stdoutBuffer.length + text.length > Max_Buffer_Size) {
                        const remaining = Max_Buffer_Size - stdoutBuffer.length;
                        stdoutBuffer += text.slice(0, remaining)
                        stdoutBuffer += '\n...[Output truncated duuue to size Limit]';
                        stdoutTruncated = true;
                    } else {
                        stdoutBuffer += text;
                    }
                    next()
                }
            })

            const stderrStream = new Writable({
                write(chunk, encoding, next) {
                    if (stderrTruncated) return next()

                    const text = chunk.toString();
                    if (stderrBuffer.length + text.length > Max_Buffer_Size) {
                        const remaining = Max_Buffer_Size - stderrBuffer.length;
                        stderrBuffer += text.slice(0, remaining)
                        stderrBuffer += '\n...[Output truncated duuue to size Limit]';
                        stderrTruncated = true;
                    } else {
                        stderrBuffer += text;
                    }
                    next()
                }
            })


            container.modem.demuxStream(stream, stdoutStream, stderrStream);

            stream.on('end', async () => {
                try {
                    await container.wait();
                } catch (e) { }
                resolve({ stdout: stdoutBuffer.trim(), stderr: stderrBuffer.trim() });
            });
        })
    }
}