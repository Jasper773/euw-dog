import { ApplicationCommandOptionType, ChatInputCommandInteraction, MessageFlags, DiscordAPIError } from "discord.js"

import { Command } from "@/command.js"
import { directories } from "@/domain.js"
import Bot from "@/bot.js"

import { DownloadError } from "./classes/Errors.js"
import Instances from "./classes/InstancesManager.js"
import Cookies from "./classes/CookiesManager.js"
import VideoProcessor from "./classes/FFMPEG.js"
import YTDLP from "./classes/YTDLP.js"

import fs from "fs"
import path from "path"

const options = [{
        name: "link",
        description: "Video link",
        type: ApplicationCommandOptionType.String,
        required: true
    }, {
        name: "text",
        description: "Text content of the post",
        type: ApplicationCommandOptionType.String,
        required: false
    }, {
        name: "start_from",
        description: "Start timestamp (SS, MM:SS or %)",
        type: ApplicationCommandOptionType.String,
        required: false
    }, {
        name: "end_at",
        description: "End timestamp (SS, MM:SS or %)",
        type: ApplicationCommandOptionType.String,
        required: false
    }, {
        name: "borders",
        description: "Border removal",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
            { name: "Light", value: "lowest" },
            { name: "Aggressive", value: "highest" },
            { name: "Do not remove borders", value: "false" }
        ]
    }, {
        name: "speed",
        description: "Playback speed (0.1 - 2.0)",
        type: ApplicationCommandOptionType.String,
        required: false
    }, {
        name: "rotate",
        description: "Video rotation",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
            { name: "Right", value: "1" },
            { name: "Left", value: "2" },
            { name: "Upside Down", value: "3" }
        ]
    }, {
        name: "flip",
        description: "Flip video",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
            { name: "Horizontal", value: "h" },
            { name: "Vertical", value: "v" },
            { name: "Both", value: "hv" }
        ]
    }
] as const

type Inputs = {
    [K in typeof options[number]["name"]]: string | undefined
} & { link: string }

let instancesManager = new Instances()

export default (async ({ bot, commandDir }: { bot: Bot, commandDir: string }) => {
    return ({
        name: "postvid",
        description: "Upload video from website directly to Discord",
        type: 1,
        options,
        bot,
        cmdDir: commandDir,
        group: "Utility",
        exec: async function(this: Command, interaction: ChatInputCommandInteraction) {
            await interaction.reply({ content: "```Loading...```", flags: MessageFlags.SuppressEmbeds, withResponse: true })
            const replyMessage = await interaction.fetchReply()
            const inputs = this.getInteractionOptions<Inputs>(interaction)

            const instance = instancesManager.getFreeInstance()
            const instanceDirectory = path.join(directories.media, "temporary", "postvid", instance.toString())
            if (fs.existsSync(instanceDirectory)) fs.rmdirSync(instanceDirectory, { recursive: true })
            fs.mkdirSync(instanceDirectory)
            const outputPath = path.join(instanceDirectory, "video.mp4")

            const cookiesManager = new Cookies(path.join(commandDir, "cookies"))
            const animateProgress = new AnimateProgress({ interaction })

            const YTDLPProcessor = new YTDLP({ cookies: cookiesManager.getByLink(inputs.get("link")) })
            YTDLPProcessor.onData(async data => await animateProgress.animate({ text: "DOWNLOADING VIDEO", type: "ytdlp", frames: -1, data: data.toString() }))
            YTDLPProcessor.onError(data => console.log(`[YTDLP ERROR]: ${data.toString()}`))
            try {
                await YTDLPProcessor.download(inputs.get("link"), outputPath)
            } catch(error) {
                let errorMessage = "The downloader encountered a problem."
                if((error as string).includes("No video formats found")) errorMessage = "The downloader was not able to find any videos on that page. This usually means there are no videos or the website blocked the bot's access due to age restrictions or account requirements."
                throw new DownloadError(errorMessage)
            }

            const videoProcessor = new VideoProcessor({ videoPath: outputPath })
            const totalFrames = videoProcessor.getVideoMetadata().totalFrames

            videoProcessor.onData(async data => await animateProgress.animate({ text: "NERFING VIDEO", type: "ffmpeg", data: data, frames: totalFrames }))
            animateProgress.resetProgress()
            await videoProcessor.execProcess("nerf")
            animateProgress.resetProgress()

            videoProcessor.onData(async data => await animateProgress.animate({ text: "COMPRESSING VIDEO", type: "ffmpeg", data: data, frames: totalFrames }))
            await videoProcessor.execProcess("compress")

            await replyMessage.edit({
                content: inputs.get("text") || " ",
                files: [outputPath]
            })
            instancesManager.freeInstance(instance)
        },
        onError: async function(this: Command, interaction: ChatInputCommandInteraction, error: any) {
            let replyContent = `❌ **[UNKNOWN ERROR]:** ${error?.message}`
            if (error instanceof DiscordAPIError) {
                replyContent = `❌ **[DISCORD ERROR]:** ${error.message}`
            } else if (error instanceof DownloadError) {
                replyContent = `❌ **[DOWNLOADER ERROR]:** ${error.message}`
            }
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(replyContent)
            } else {
                await interaction.reply(replyContent)
            }
        }
    })
})

class AnimateProgress {
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
            if (Number.isNaN(processPercentage)) return
            newRatio = processPercentage / 100
        } else if (type === "ffmpeg"){
            const processedFrames = parseFloat(data.split("=")[1].trim())
            if (Number.isNaN(processedFrames)) return
            newRatio = processedFrames / frames
        }
        if(newRatio < this.#progressRatio) return
        this.#progressRatio = newRatio

        if(Date.now() - this.#timestamp < 1000) return
        this.#timestamp = Date.now()

        const colorCode = this.#progressRatio === 1 ? 32 : 34
        const progressBars = new Array(40).fill("#")
        const index = Math.floor(39 * this.#progressRatio)
        progressBars[index] = index === 0 ? `[0m${progressBars[index]}` : `${progressBars[index]}[0m`
        const spacing = " ".repeat((42 - text.length) / 2)
        const string = `\`\`\`ansi\n${spacing}${text}\n[[${colorCode}m${progressBars.join("")}[0m]\`\`\``
        await this.#interaction.editReply(string)
    }

    resetProgress(){
        this.#progressRatio = 0
        this.#timestamp = -Infinity
    }

}