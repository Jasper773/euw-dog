import { ChatInputCommandInteraction, DiscordAPIError } from "discord.js"

import { Command } from "@/command.js"
import Bot from "@/bot.js"

import { DownloadError } from "./classes/Errors.js"
import options from "./options.js"
import exec from "./function.js"

export default (async ({ bot, commandDir }: { bot: Bot, commandDir: string }) => {
    const func = exec({ bot, commandDir })

    return ({
        name: "postvid",
        description: "Upload video from website directly to Discord",
        type: 1,
        options,
        bot,
        cmdDir: commandDir,
        group: "Utility",
        exec: func,
        onError: async function(this: Command, interaction: ChatInputCommandInteraction, error: any) {
            let replyContent = `❌ **[UNKNOWN ERROR]:** ${error?.message}`
            if (error instanceof DiscordAPIError) {
                replyContent = `❌ **[DISCORD ERROR]:** ${error.message}`
            } else if (error instanceof DownloadError) {
                if(error.message.includes("No video formats found")) replyContent = "❌ **[DOWNLOADER ERROR]:** The downloader was not able to find any videos on that page. This usually means there are no videos or the website blocked the bot's access due to age restrictions or account requirements."
                else replyContent = `❌ **[DOWNLOADER ERROR]:** ${error.message}`
            }
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(replyContent)
            } else {
                await interaction.reply(replyContent)
            }
        }
    })
})

