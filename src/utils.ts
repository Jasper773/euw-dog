import { spawn, ChildProcessWithoutNullStreams } from "node:child_process"

class SpawnProcess {
    private process!: ChildProcessWithoutNullStreams
    private onDataFunc: (data: string) => void = () => {}
    private onErrorFunc: (data: string) => void = () => {}

    constructor(private exec: string, private params: string[]) {}

    run(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.process = spawn(this.exec, this.params, { env: process.env })

            this.process.stdout.on("data", (data: Buffer) => {
                const str = data.toString()
                this.onDataFunc(str)
            })

            this.process.stderr.on("data", (data: Buffer) => {
                const str = data.toString()
                this.onErrorFunc(str)
            })

            this.process.on("close", (code) => {
                if (code !== 0) reject()
                resolve()
            })
        })
    }

    onData(func: (data: string) => void) { this.onDataFunc = func; }
    onError(func: (data: string) => void) { this.onErrorFunc = func; }
}

export { SpawnProcess }