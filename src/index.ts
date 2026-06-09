import { Partials, GatewayIntentBits } from "discord.js"
import { directories } from "./domain.js"
import Bot from "./bot.js"
import path from "path"
import dotenv from "dotenv"
dotenv.config()

const token = process.env.TOKEN
if (!token) throw new Error("TOKEN not found in environment variables.")

try {
    await Bot.create({
        token: token,
        commandsDirPath: path.join(directories.src, "commands"),
        eventsDirPath: path.join(directories.src, "events"),
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildExpressions,
            GatewayIntentBits.MessageContent
        ],
        partials: [
            Partials.Message,
            Partials.Reaction
        ]
    })
} catch (error) {
    console.error("[ERROR] Failed to start bot:", error);
}