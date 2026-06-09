import { ChatInputCommandInteraction, MessageFlags } from "discord.js"

import Bot from "@/bot.js"
import { Command } from "@/command.js"
import { directories } from "@/domain.js"

import { DownloadError } from "./classes/Errors.js"
import Instances from "./classes/InstancesManager.js"
import Cookies from "./classes/CookiesManager.js"
import VideoProcessor from "./classes/FFMPEG.js"
import YTDLP from "./classes/YTDLP.js"

import options from "./options.js"

import fs from "fs"
import path from "path"

type Inputs = {
    [K in typeof options[number]["name"]]: string | undefined
} & { link: string }

let instancesManager = new Instances()

export default (({ bot, commandDir }: { bot: Bot, commandDir: string }) => {
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

        const progressAnimator = new ProgressAnimator({ interaction })

        const YTDLPProcessor = new YTDLP({ cookies: cookiesManager.getByLink(inputs.get("link")) })
        YTDLPProcessor.onData(async data => await progressAnimator.animate({ text: "DOWNLOADING VIDEO", type: "ytdlp", frames: -1, data: data.toString() }))
        YTDLPProcessor.onError(data => console.log(`[YTDLP ERROR]: ${data.toString()}`))
        try {
            await YTDLPProcessor.download(inputs.get("link"), outputPath)
            progressAnimator.resetProgress()
        } catch(error) {
            if (error instanceof Error){
                throw new DownloadError(error.message)
            } else {
                throw new DownloadError("The downloader encountered a problem.")
            }
        }

        const videoProcessor = new VideoProcessor({ videoPath: outputPath })
        const totalFrames = videoProcessor.getVideoMetadata().totalFrames

        videoProcessor.onData(async data => await progressAnimator.animate({ text: "NERFING VIDEO", type: "ffmpeg", data: data, frames: totalFrames }))
        await videoProcessor.execProcess("nerf")
        progressAnimator.resetProgress()

        videoProcessor.onData(async data => await progressAnimator.animate({ text: "COMPRESSING VIDEO", type: "ffmpeg", data: data, frames: totalFrames }))
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
    constructor({ interaction }: { interaction: ChatInputCommandInteraction }){
        this.#interaction = interaction
    }

    async animate({ text, type, data, frames }: { text: string, type: "ffmpeg" | "ytdlp", data: string, frames: number }){
        if (data === undefined) return

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

        const progressBars = new Array(40).fill("#")
        const spacing = " ".repeat((42 - text.length) / 2)

        const index = Math.floor(39 * this.#progressRatio)
        const colorCode = index == 39 ? 32 : 34
        progressBars[index] = index === 0 ? `[0m${progressBars[index]}` : `${progressBars[index]}[0m`

        await this.#interaction.editReply(`\`\`\`ansi\n${spacing}${text}\n[[${colorCode}m${progressBars.join("")}[0m]\`\`\``)
    }

    resetProgress(){
        this.#progressRatio = 0
        this.#timestamp = -Infinity
    }

}