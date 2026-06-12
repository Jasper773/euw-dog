import { ChatInputCommandInteraction, MessageFlags } from "discord.js"

import { directories } from "@/domain.js"
import { Command } from "@/command.js"
import Bot from "@/bot.js"

import { genProgrBar } from "@/utils.js"
import { SpawnProcess } from "@/utils.js"
import Instances from "./classes/InstancesManager.js"
import Cookies from "./classes/CookiesManager.js"
import VideoProcessor from "./classes/FFMPEG.js"
import YTDLP from "./classes/YTDLP.js"

import options from "./options.js"

import fs from "fs"
import path from "path"

type Inputs = {
    [K in typeof options[number]["name"]]: string | undefined
}

export default (({ bot, commandDir }: { bot: Bot, commandDir: string }) => {
    const instancesManager = new Instances()
    const cookiesManager = new Cookies(path.join(commandDir, "cookies"))

    return (async function(this: Command, interaction: ChatInputCommandInteraction) {
        await interaction.reply({ content: "```Loading...```", flags: MessageFlags.SuppressEmbeds, withResponse: true })
        const replyMessage = await interaction.fetchReply()
        const inputs = this.getInteractionOptions<Inputs>(interaction)

        const redirectSolver = new SpawnProcess("curl", ["-Ls", "-o", "/dev/null", "-w", "%{url_effective}", inputs.get("link")])
        const link = await redirectSolver.run()

        const instance = instancesManager.getFreeInstance()
        const instanceDirectory = path.join(directories.media, "temporary", "postvid", instance.toString())
        if (fs.existsSync(instanceDirectory)) fs.rmdirSync(instanceDirectory, { recursive: true })
        fs.mkdirSync(instanceDirectory)
        const outputPath = path.join(instanceDirectory, "video.mp4")

        const progressAnimator = new ProgressAnimator(interaction)

        const YTDLPProcessor = new YTDLP({ cookies: cookiesManager.getByLink(link) })
        YTDLPProcessor.onData(async data => await progressAnimator.update({ text: "DOWNLOADING VIDEO", type: "ytdlp", frames: -1, dataBuffer: data }))
        await YTDLPProcessor.download(link, outputPath)
        progressAnimator.resetProgress()

        const videoProcessor = new VideoProcessor({ videoPath: outputPath })
        const totalFrames = videoProcessor.getVideoMetadata().totalFrames

        videoProcessor.onData(async data => await progressAnimator.update({ text: "NERFING VIDEO", type: "ffmpeg", dataBuffer: data, frames: totalFrames }))
        await videoProcessor.execProcess("nerf")
        progressAnimator.resetProgress()

        videoProcessor.onData(async data => await progressAnimator.update({ text: "COMPRESSING VIDEO", type: "ffmpeg", dataBuffer: data, frames: totalFrames }))
        await videoProcessor.execProcess("compress")
        progressAnimator.stop()

        await replyMessage.edit(`\`\`\`\
      ⬆️ UPLOADING VIDEO ⬆️

You can react with ❌ to delete it.
\`\`\``)
        await replyMessage.edit({
            content: inputs.get("text") || " ",
            files: [outputPath]
        })
        instancesManager.freeInstance(instance)
    })
})

class ProgressAnimator {
    #interaction: ChatInputCommandInteraction
    #lastProgress: number = 0
    #newProgress: number = 0
    #text: string = ""
    #interval: NodeJS.Timeout | undefined
    constructor(interaction: ChatInputCommandInteraction){
        this.#interaction = interaction
        this.#interval = setInterval(async () => {
            if(this.#lastProgress < this.#newProgress){
                this.#lastProgress = this.#newProgress
                const progressBar = genProgrBar(this.#newProgress, 20)
                const spacing = " ".repeat(Math.floor(((22 * 1.95) - this.#text.length) / 2))
                await this.#interaction.editReply(`\`\`\`ansi\n${spacing}${this.#text}\n${progressBar}\`\`\``)
            }
        }, 1500)
    }

    async update({ text, type, dataBuffer, frames }: { text: string, type: "ffmpeg" | "ytdlp", dataBuffer: Buffer, frames: number }){
        if (this.#interval === undefined) return

        if (dataBuffer === undefined) return
        const data = dataBuffer.toString()
    
        switch (type) {
            case "ytdlp":
                const processPercentage = parseInt(data.split("%")[0].trim())
                if (!Number.isNaN(processPercentage)) this.#newProgress = processPercentage / 100
                break
            case "ffmpeg":
                const processedFrames = parseFloat(data.split("=")[1].trim())
                if (!Number.isNaN(processedFrames)) this.#newProgress = processedFrames / frames
                break
        }

        this.#text = text
    }

    resetProgress(){
        this.#lastProgress = 0
        this.#newProgress = 0
    }

    stop(){
        this.#interval?.close()
        this.#interval = undefined
    }
}

/*
class ProgressAnimator {
    #interaction: ChatInputCommandInteraction
    #timestamp: number = -Infinity
    #progressRatio: number = 0
    constructor(interaction: ChatInputCommandInteraction){
        this.#interaction = interaction
    }

    async animate({ text, type, dataBuffer, frames }: { text: string, type: "ffmpeg" | "ytdlp", dataBuffer: Buffer, frames: number }){
        if (dataBuffer === undefined) return
        const data = dataBuffer.toString()

        let newRatio = 0.0
        if (type === "ytdlp") {
            const processPercentage = parseInt(data.split("%")[0].trim())
            if (!Number.isNaN(processPercentage)) newRatio = processPercentage / 100
        } else if (type === "ffmpeg"){
            const processedFrames = parseFloat(data.split("=")[1].trim())
            if (!Number.isNaN(processedFrames)) newRatio = processedFrames / frames
        }
        if(newRatio >= this.#progressRatio) this.#progressRatio = newRatio

        if(Date.now() - this.#timestamp < 1500) return
        this.#timestamp = Date.now()

        const progressBarLength = 40
        const progressBars = new Array(progressBarLength).fill("#")
        const spacing = " ".repeat(((progressBarLength + 2) - text.length) / 2)

        const index = Math.floor((progressBarLength - 1) * this.#progressRatio)
        const colorCode = index == (progressBarLength - 1) ? 32 : 34
        progressBars[index] = index === 0 ? `[0m${progressBars[index]}` : `${progressBars[index]}[0m`

        await this.#interaction.editReply(`\`\`\`ansi\n${spacing}${text}\n[[${colorCode}m${progressBars.join("")}[0m]\`\`\``)
    }

    resetProgress(){
        this.#progressRatio = 0
        this.#timestamp = -Infinity
    }

}
*/