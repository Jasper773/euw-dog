import { spawn } from "node:child_process"
import { SpawnProcess } from "@/utils.js"

export default class YTDLP {
    #userAgent: string = "Mozilla/5.0 (X11 Linux x86_64 rv:140.0) Gecko/20100101 Firefox/140.0"
    #sleepRules = { interval: 2, max_interval: 6 }
    #singleVideo = true
    #cookies: string | undefined = undefined

    #onDataFunc: (data: string) => void = () => {}
    #onErrorFunc: (data: string) => void = () => {}

    constructor({ cookies, agent, singleVideo, interval, max_interval }: { cookies?: string, agent?: string, singleVideo?: boolean, interval?: number, max_interval?: number } = {}) {
        if (cookies) this.#cookies = cookies
        if (agent) this.#userAgent = agent
        if (interval) this.#sleepRules.interval = interval
        if (max_interval) this.#sleepRules.max_interval = max_interval
        if (singleVideo !== undefined) this.#singleVideo = singleVideo
    }

    onData(func: (data: string) => void) { this.#onDataFunc = func }
    onError(func: (data: string) => void) { this.#onErrorFunc = func }

    async download(link: string, outputPath: string) {
        const sp = new SpawnProcess("yt-dlp", [
            ...this.#buildParams(),
            "--newline",
            "--no-colors",
            "--js-runtimes", "deno:/home/server/.deno/bin/deno",
            "-f", "bestvideo+bestaudio/best",
            "--merge-output-format", "mp4",
            "--progress-template", "download:%(progress._percent_str)s of %(progress._total_bytes_str)s at %(progress._speed_str)s ETA %(progress._eta_str)s",
            "-o", outputPath,
            link
        ])

        sp.onData(this.#onDataFunc)
        sp.onError(this.#onErrorFunc)
        
        return await sp.run()
    }

    #buildParams() {
        return [
            this.#singleVideo ? ["--no-live-from-start", "--no-playlist", "--no-check-certificate"] : undefined,
            this.#cookies ? ["--cookies", this.#cookies] : undefined,
            this.#userAgent ? ["--user-agent", this.#userAgent] : undefined,
            this.#sleepRules.interval ? ["--sleep-interval", this.#sleepRules.interval] : undefined,
            this.#sleepRules.max_interval ? ["--max-sleep-interval", this.#sleepRules.max_interval] : undefined,
        ].filter(x => x !== undefined).flat().map(x => String(x)) as string[]
    }
}

/*
type YTDLPFormat = {
    ext: string,
    vcodec: string,
    acodec: string,
    format: string
    format_id: string,
    video_ext: string,
    audio_ext: string | "none",
    vbr: number | null,
    abr: number | null,
    tbr: number | null,
    filesize?: number,
    filesize_approx: number | null,
}


    async getBestFormat(link: string){
        const formats = await new Promise<YTDLPFormat[]>((resolve, reject) => {
            const p = spawn("yt-dlp", [
                ...this.#buildParams(),
                "-j",
                link
            ])
            let stdout = ""
            let stderr = ""

            p.stdout.on("data", chunk => {
                stdout += chunk
            })

            p.stderr.on("data", chunk => {
                stderr += chunk
            })

            p.on("close", code => {
                if (code !== 0) {
                    reject()
                }
                try {
                    const data = JSON.parse(stdout)
                    resolve(data.formats)
                } catch (e) {
                    reject(e)
                }
            })
        })
        let highestTBR = 0
        let targetFormat = "bestvideo+bestaudio/best"
        for(const format of formats){
            if(format.tbr == null || !format.format_id || format.tbr <= highestTBR) continue
            targetFormat = format.format_id
            highestTBR = format.tbr
        }
        return targetFormat
    }
*/