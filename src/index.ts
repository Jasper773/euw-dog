import { Partials, GatewayIntentBits } from "discord.js"
import { directories } from "./domain.js"
import Bot from "./bot.js"
import path from "path"
import dotenv from "dotenv"
dotenv.config()

const token = process.env.TOKEN
if (!token) throw new Error("TOKEN not found in environment variables.")

try {
    await Bot.create(token, path.join(directories.src, "commands"), path.join(directories.src, "events"), [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.MessageContent
    ], [
        Partials.Message,
        Partials.Reaction
    ])
} catch (error) {
    console.error("Failed to start bot:", error);
}