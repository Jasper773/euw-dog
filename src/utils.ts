import { spawn, ChildProcessWithoutNullStreams } from "node:child_process"

class SpawnProcess {
    private process!: ChildProcessWithoutNullStreams
    private onDataFunc: (data: Buffer) => void = () => {}
    private onErrorFunc: (data: Buffer) => void = () => {}

    constructor(private exec: string, private params: string[]) {}

    run(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.process = spawn(this.exec, this.params, { env: process.env })

            let stderr = ""

            this.process.stdout.on("data", (data: Buffer) => {
                this.onDataFunc(data)
            })

            this.process.stderr.on("data", (data: Buffer) => {
                const str = data.toString()
                stderr += str
                if (stderr.length > 1000) stderr = stderr.slice(100)
                this.onErrorFunc(data)
            })

            this.process.on("close", (code) => {
                if (code !== 0) reject(new Error(stderr))
                resolve()
            })
        })
    }

    onData(func: (data: Buffer) => void) { this.onDataFunc = func; }
    onError(func: (data: Buffer) => void) { this.onErrorFunc = func; }
}

function genProgrBar(progress: number, length: number){
    const progressFull = progress === 1
    let passedProgress = false
    let progressColor = progressFull ? "[32m" : progress > 0.6 ? "[36m" : "[31m"
    let points = ""
    for(let i = 0; i <= length; i++){
        const lastPoint = i === length
        const pointReachedProgress = i/length >= progress
        if((lastPoint && !progressFull || !lastPoint) && pointReachedProgress && !passedProgress){
            passedProgress = !passedProgress
            points += "[0m"
        }
        points += "⬤"
    }
    return `❮${progressColor}${points}[0m❯`
}

export { SpawnProcess, genProgrBar }