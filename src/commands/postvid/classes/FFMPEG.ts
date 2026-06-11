import { promisify } from "node:util"
import { spawn, exec, execSync } from "node:child_process"
import { SpawnProcess } from "@/utils.js"
import path from "path"
import fs from "fs"

interface Metadata {
    duration: number
    width: number
    height: number
    frameRate: number
    totalFrames: number
    codec: string
    videoBitrate: number
    audioBitrate: number
}

// 10485760 MiB
class VideoProcessor {
    #videoPath: string
    #targetVideoPath: string
    #stats: Metadata
    #busy: boolean = false
    #count: number = 0

    #onDataFunc: (data: Buffer) => void = () => {}
    #onErrorFunc: (data: Buffer) => void = () => {}

    constructor({ videoPath }: { videoPath: string }) {
        this.#videoPath = videoPath
        this.#targetVideoPath = videoPath + "-"
        this.#stats = VideoProcessor.getMetadata(videoPath)
    }

    onData(func: (data: Buffer) => void) { this.#onDataFunc = func }
    onError(func: (data: Buffer) => void) { this.#onErrorFunc = func }

    getVideoMetadata = () => this.#stats

    #startProcess(){
        if(fs.existsSync(this.#targetVideoPath)){
            fs.rmSync(this.#targetVideoPath)
        }
        if(fs.existsSync(this.#videoPath)){
            fs.renameSync(this.#videoPath, this.#targetVideoPath)
        }
        this.#busy = true
    }

    #cancelProcess(){
        if(fs.existsSync(this.#videoPath)) fs.rmSync(this.#videoPath)
        fs.renameSync(this.#targetVideoPath, this.#videoPath)
        this.#busy = false
    }

    static getMetadata(videoPath: string): Metadata {
        const cmd = `ffprobe -v error -show_entries format=duration,bit_rate:stream=width,height,codec_name,r_frame_rate,bit_rate,nb_frames -select_streams v:0 -of json "${videoPath}"`
        const output = JSON.parse(execSync(cmd).toString())

        const stream = output.streams[0]
        const format = output.format

        const [num, den] = stream.r_frame_rate.split('/').map(Number)
        const frameRate = num / den
        
        const totalFrames = stream.nb_frames ? parseInt(stream.nb_frames) : Math.round(parseFloat(format.duration) * frameRate)

        return {
            duration: parseFloat(format.duration),
            width: stream.width,
            height: stream.height,
            frameRate: frameRate,
            totalFrames: totalFrames,
            codec: stream.codec_name,
            videoBitrate: parseInt(stream.bit_rate),
            audioBitrate: parseInt(format.bit_rate) - parseInt(stream.bit_rate)
        }
    }

    async execProcess(process: "nerf" | "compress"){
        this.#startProcess()
        if(process == "nerf") await this.#nerfFunc()
        else if(process == "compress") await this.#compressFunc()
    }

    async #nerfFunc() {
        const sizeMiB = fs.statSync(this.#targetVideoPath).size / Math.pow(2, 20)
        if (sizeMiB <= 10.01358) return this.#cancelProcess()
        
        const newResolution = VideoProcessor.lowerResolution({ width: this.#stats.width, height: this.#stats.height })
        const sp = new SpawnProcess("ffmpeg", [
            "-i", this.#targetVideoPath,
            "-vf", `fps=30,hqdn3d,scale=${newResolution.width}:${newResolution.height}`,
            "-g", "240", "-keyint_min", "240",
            "-x264-params", "keyint=240:min-keyint=240:scenecut=0",
            "-profile:v", "baseline", "-level", "3.0",
            "-pix_fmt", "yuv420p", "-tune", "film",
            "-c:a", "aac", "-b:a", "96k", "-ac", "1", "-ar", "24000",
            "-map_metadata", "-1", "-preset", "ultrafast",
            "-movflags", "+faststart", "-progress", "-", "-y",
            this.#videoPath
        ])

        sp.onData(this.#onDataFunc)
        sp.onError(this.#onErrorFunc)

        return await sp.run()
    }

    async #compressFunc() {
        const sizeMiB = fs.statSync(this.#targetVideoPath).size / Math.pow(2, 20)
        if (sizeMiB <= 10.01358) return this.#cancelProcess()

        const totalBits = 10.01358 * 1024 * 1024 * 8
        const bitrateKbps = Math.floor((totalBits / this.#stats.duration) / 1000) - 96
        this.#count += 1
        const logName = `ffmpeg2pass-${this.#count}`

        try {
            const pass1 = new SpawnProcess("ffmpeg", [
                "-y", "-i", this.#targetVideoPath,
                "-c:v", "libx264", "-b:v", `${bitrateKbps}k`,
                "-maxrate", `${bitrateKbps * 0.9}k`, "-bufsize", `${bitrateKbps * 2}k`,
                "-pass", "1", "-passlogfile", logName, "-preset", "ultrafast",
                "-progress", "-", "-f", "null", "/dev/null"
            ])
            pass1.onData(this.#onDataFunc)
            pass1.onError(this.#onErrorFunc)

            await pass1.run()

            const pass2 = new SpawnProcess("ffmpeg", [
                "-y", "-i", this.#targetVideoPath,
                "-c:v", "libx264", "-b:v", `${bitrateKbps}k`,
                "-maxrate", `${bitrateKbps * 0.9}k`, "-bufsize", `${bitrateKbps * 2}k`,
                "-c:a", "aac", "-preset", "ultrafast", "-progress", "-",
                "-pass", "2", "-passlogfile", logName, this.#videoPath
            ])
            pass2.onData(this.#onDataFunc)
            pass2.onError(this.#onErrorFunc)

            await pass2.run()
        } finally {
            for (const file of [`${logName}-0.log`, `${logName}-0.log.mbtree`]) {
                if (fs.existsSync(file)) fs.rmSync(file)
            }
        }
    }

    static lowerResolution({ width, height } : { width: number, height: number }){
        const biggestResolution = Math.max(width, height)
        const resolutionPoints = [640, 720, 1280]

        if(biggestResolution < resolutionPoints[0]) return {
            width: Math.floor(width),
            height: Math.floor(height)
        }

        let closestDownResolution = VideoProcessor.getHighestLowerNumber(biggestResolution, resolutionPoints)

        return {
            width: Math.floor(VideoProcessor.scaleDownResolution(width, biggestResolution, closestDownResolution)),
            height: Math.floor(VideoProcessor.scaleDownResolution(height, biggestResolution, closestDownResolution))
        }
    }

    static getHighestLowerNumber(target: number, list: number[]){
        let lowestDifference = Infinity
        let result = target
        for (const number of list) {
            const difference = Math.abs(target - number)
            if (difference < lowestDifference) {
                lowestDifference = difference
                result = number
            }
        }
        return result
    }

    static scaleDownResolution(resolution: number, biggestResolution: number, targetResolution: number) {
        const aspectRatio = targetResolution / biggestResolution 
        if(resolution == biggestResolution) return targetResolution
        return resolution * aspectRatio
    }
}

export default VideoProcessor