import { ChatInputCommandInteraction, MessageFlags } from "discord.js"

import Bot from "@/bot.js"
import { Command } from "@/command.js"
import { directories } from "@/domain.js"

import { DownloadError } from "./classes/Errors.js"
import Instances from "./classes/InstancesManager.js"
import Cookies from "./classes/CookiesManager.js"
import VideoProcessor from "./classes/FFMPEG.js"
import YTDLP from "./classes/YTDLP.js"
import { genProgrBar } from "@/utils.js"

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

        const instance = instancesManager.getFreeInstance()
        const instanceDirectory = path.join(directories.media, "temporary", "postvid", instance.toString())
        if (fs.existsSync(instanceDirectory)) fs.rmdirSync(instanceDirectory, { recursive: true })
        fs.mkdirSync(instanceDirectory)
        const outputPath = path.join(instanceDirectory, "video.mp4")

        const progressAnimator = new ProgressAnimator(interaction)

        const YTDLPProcessor = new YTDLP({ cookies: cookiesManager.getByLink(inputs.get("link")) })
        YTDLPProcessor.onData(async data => await progressAnimator.animate({ text: "DOWNLOADING VIDEO", type: "ytdlp", frames: -1, dataBuffer: data }))
        await YTDLPProcessor.download(inputs.get("link"), outputPath)
        progressAnimator.resetProgress()

        const videoProcessor = new VideoProcessor({ videoPath: outputPath })
        const totalFrames = videoProcessor.getVideoMetadata().totalFrames

        videoProcessor.onData(async data => await progressAnimator.animate({ text: "NERFING VIDEO", type: "ffmpeg", dataBuffer: data, frames: totalFrames }))
        await videoProcessor.execProcess("nerf")
        progressAnimator.resetProgress()

        videoProcessor.onData(async data => await progressAnimator.animate({ text: "COMPRESSING VIDEO", type: "ffmpeg", dataBuffer: data, frames: totalFrames }))
        await videoProcessor.execProcess("compress")

        await replyMessage.edit({
            content: inputs.get("text") || " ",
            files: [outputPath]
        })
        instancesManager.freeInstance(instance)
    })
})

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

        text += ` (${Math.floor(this.#progressRatio * 100)}%)`
        const progressBar = genProgrBar(this.#progressRatio, 20)
        const spacing = " ".repeat(Math.floor(((22 * 1.95) - text.length) / 2))

        await this.#interaction.editReply(`\`\`\`ansi\n${spacing}${text}\n${progressBar}\`\`\``)
    }

    resetProgress(){
        this.#progressRatio = 0
        this.#timestamp = -Infinity
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