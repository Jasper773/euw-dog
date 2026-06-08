import { ApplicationCommandType, ContextMenuCommandInteraction, MessageFlags } from "discord.js"
import { directories } from "@/domain.js"
import { Command } from "@/command.js"
import Bot from "@/bot.js"
import fs from "fs"

const filePath = `${directories.db}/niggerhunt_stats.json`
const nhStats = JSON.parse(fs.readFileSync(`${directories.db}/niggerhunt_stats.json`, "utf-8"))

export default (async ({ bot, commandDir }: { bot: Bot, commandDir: string }) => {
    return ({
        name: "Magic Bullet",
        description: "Guarantee the next shot hits on Nigger Hunt.",
        type: ApplicationCommandType.User,
        options: [],
        bot,
        cmdDir: commandDir,
        group: "Entertainment",
        exec: async function(this: Command, interaction: ContextMenuCommandInteraction) {
            const id = interaction.targetId
            const existingUser = nhStats.find((x: any) => x.id === id)
            if(existingUser){
                existingUser.magic_bullet = true
            }
            else {
                const newuser = {
                    id: interaction.user.id,
                    wins: 0,
                    loses: 0,
                    magic_bullet: true,
                }
                nhStats.push(newuser)
            }
            fs.writeFileSync(filePath, JSON.stringify(nhStats, null, "\t"))
            await interaction.reply({
                content: `✅ Magic bullet loaded for <@${id}>!`,
                flags: MessageFlags.Ephemeral
            }).catch(e => console.error(e))
        },
        onError: () => {}
    })
})