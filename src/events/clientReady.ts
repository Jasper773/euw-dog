import { Client, Events, ActivityType, TextChannel } from "discord.js"
import { EventFactory } from "@/event.js"
import Bot from "@/bot.js"

import { directories } from "@/domain.js"
import path from "path"

export default ((bot: Bot) => ({
    name: Events.ClientReady,
    once: true,
    exec: async function(client: Client) {
        if (!client.user) throw new Error("Client user is undefined.")

        client.user.setPresence({
            activities: [{
                name: "gay negro porn",
                type: ActivityType.Streaming,
                url: "https://www.twitch.tv/lmao_u_gay"
            }],
            status: "dnd"
        })

        console.log(`Logged in as ${client.user.tag}`)
    },
    bot
})) as EventFactory