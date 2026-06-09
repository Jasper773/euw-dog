import { ChatInputCommandInteraction, MessageFlags, GuildMemberRoleManager } from "discord.js"

import { Command } from "@/command.js"
import Bot from "@/bot.js"

const options = [{
        name: "name",
        description: "Enter the new name for your role.",
        type: 3,
        required: true
    }
] as const

type Inputs = {
    [K in typeof options[number]["name"]]: string | undefined
}

export default (async ({ bot, commandDir }: { bot: Bot, commandDir: string }) => {
    return ({
        name: "rolename",
        description: "Change your role's name.",
        type: 1,
        options: options,
        bot,
        cmdDir: commandDir,
        group: "Entertainment",
        exec: async function(this: Command, interaction: ChatInputCommandInteraction) {
            if(!interaction.inGuild() || !interaction.guild) return await interaction.reply({ content: "❌ **This command cannot be ran in DMs.**", flags: MessageFlags.Ephemeral }).catch(e => console.error(e))
            const newRoleName = this.getInteractionOptions<Inputs>(interaction).get("name")?.toUpperCase()
            if (!newRoleName) return await interaction.reply({ content: "❌ **Unable to read the new name for your role.**", flags: MessageFlags.Ephemeral }).catch(e => console.error(e))
            const rolesList = interaction.member.roles as GuildMemberRoleManager
            const highestRole = rolesList.highest
            if(highestRole.name === "@everyone") return await interaction.reply({ content: "❌ **You don't have a role.**", ephemeral: true })
            try{
                await highestRole.edit({
                    name: newRoleName
                })
                await interaction.reply({ content: `✅ Your role's name has been changed to __${newRoleName}__.`, ephemeral: true })
            }
            catch(e){
                await interaction.reply({ content: `**❌ An error prevented the change of your role's name. Possible causes: the name is too long / your role is above mine.**`, ephemeral: true })
            }
        },
        onError: () => {}
    })
})
