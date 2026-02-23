import Docker from 'dockerode';

const docker = new Docker();

async function main() {
    console.log("Connecting to Docker.'.'.'. ");
    const image = 'alpine:latest'
    try {
        console.log("Alpining...");
        await new Promise((resolve, reject) => {
            docker.pull(image, (err: any, stream: any) => {
                if (err) return reject(err);

                docker.modem.followProgress(stream, onFinished);

                function onFinished(err: any, output: any) {
                    if (err) return reject(err);
                    console.log('\nImaging...');
                    resolve(output);
                }
            });
        });

        console.log("Containering...");
        const container = await docker.createContainer({
            Image: image,
            Cmd: ['echo', 'Heyyy'], Tty: false,
        });

        console.log("Executing...");

        await container.start();
        const stream = await container.logs({
            follow: true, stderr: true, stdout: true,
        });

        container.modem.demuxStream(stream, process.stdout, process.stderr);

        await container.wait();
        await container.remove();
        console.log("\nContainering Done.");
    } catch (error) {
        console.error('Error:', error)
    }
}
main()