import { spawn, ChildProcessWithoutNullStreams } from "node:child_process"

class SpawnProcess {
    private process!: ChildProcessWithoutNullStreams
    private onDataFunc: (data: Buffer) => void = () => {}
    private onErrorFunc: (data: Buffer) => void = () => {}

    constructor(private exec: string, private params: string[]) {}

    run(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.process = spawn(this.exec, this.params, { env: process.env })

            let stdout = ""
            let stderr = ""

            this.process.stdout.on("data", (data: Buffer) => {
                stdout += data.toString()
                this.onDataFunc(data)
            })

            this.process.stderr.on("data", (data: Buffer) => {
                stderr += data.toString()
                this.onErrorFunc(data)
            })

            this.process.on("close", (code) => {
                if (code !== 0) reject(new Error(stderr))
                resolve(stdout)
            })
        })
    }

    onData(func: (data: Buffer) => void) { this.onDataFunc = func; }
    onError(func: (data: Buffer) => void) { this.onErrorFunc = func; }
}

function genProgrBar(progress: number, length: number){
    const progressFull = progress === 1
    let passedProgress = false
    let progressColor = progressFull ? "[32m" : progress <= 0.37 ? "[31m" : progress <= 0.68 ? "[33m" : "[36m"
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