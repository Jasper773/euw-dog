import { Events, ChatInputCommandInteraction } from "discord.js"
import { Event, EventFactory, EventObject } from "@/event.js"
import Bot from "@/bot.js"

export default ((bot: Bot) => {
    return {
        name: Events.InteractionCreate,
        once: false,
        exec: async function(interaction: ChatInputCommandInteraction) {
            if (!interaction.isCommand()) return
            const command = bot.getCommands().get(interaction.commandName)
            if (!command) return

            const usedIn = interaction.guild && !interaction.channel?.isDMBased() ? `${interaction.guild.name}, #${(interaction.channel as any).name}` : "DMs"
            console.log(`${interaction.user.username} used « ${interaction.commandName} » in ${usedIn}.`)
            
            try {
                await command.exec(interaction)
            } catch (error) {
                console.log(error)
                await command.onError(interaction, error)
            }
        },
        bot
    }
}) as EventFactory