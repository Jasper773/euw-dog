import { ChatInputCommandInteraction, ChannelType, MessageFlags } from "discord.js"

import { Command } from "@/command.js"
import { directories } from "@/domain.js"
import Bot from "@/bot.js"

import fs from "fs"

const filePath = `${directories.db}/niggerhunt_stats.json`

export default (async ({ bot, commandDir }: { bot: Bot, commandDir: string }) => {
    return ({
        name: "niggerhunt",
        description: "Hunt a nigger",
        type: 1,
        options: [],
        bot,
        cmdDir: commandDir,
        group: "Entertainment",
        exec: async function(this: Command, interaction: ChatInputCommandInteraction) {
            if(!interaction.inGuild()) return await interaction.reply({ content: "❌ **This command cannot be ran in DMs.**" }).catch(e => console.error(e))
            const messageContent = "         " + Array.from({ length: 5 }, () => ":brown_square:").join("      ")
            const messageButtons = Array.from({ length: 5 }, (_, i) => ({
                type: 2,
                custom_id: i + 1,
                label: i + 1,
                style: 4
            }))
            await interaction.reply({
                content: messageContent,
                components: [{
                    type: 1,
                    components: messageButtons
                }]
            }).catch(e => console.error(e))
            const replyMessage = await interaction.fetchReply().catch(e => console.error(e))
            if (replyMessage === undefined) return
            if (replyMessage.channel.type !== ChannelType.GuildText) return
            const resultMessage = await replyMessage.channel.send(`Choose where to shoot.`).catch(e => console.error(e))
            if (resultMessage === undefined) return await interaction.reply({ content: "❌ **An error has occurred.**", flags: MessageFlags.Ephemeral }).catch(e => console.error(e))
            const nhStats = JSON.parse(fs.readFileSync(filePath, "utf-8"))
            replyMessage.createMessageComponentCollector().on("collect", async (component) => {
                if(interaction.user.id !== component.user.id) return
                const user = (() => {
                    const existingUser = nhStats.find((x: any) => x.id === interaction.user.id)
                    if(existingUser) return existingUser
                    else {
                        const newUser = {
                            id: interaction.user.id,
                            wins: 0,
                            loses: 0,
                            magic_bullet: false,
                        }
                        nhStats.push(newUser)
                        return newUser
                    }
                })()
                const input = parseInt(component.customId)
                const randomNumber = Math.random() <= 0.33 || user.magic_bullet ? input : Math.floor(Math.random() * (6 - 1) + 1)
                if(user.magic_bullet) user.magic_bullet = false
                const win = input === randomNumber
                if (win) user.wins += 1
                else user.loses += 1
                resultMessage.edit(new Array(5).fill(null).map((x, index) => index + 1 === input ? win ? "<:niggerFound:870346499010215996>" : "<:squareHit:870348818988826684>" : index + 1 === randomNumber ? "<a:niggerSteal:870346499362545695>" : ":brown_square:").join("         ")).catch(err => console.log(err))
                await replyMessage.edit({
                    content: win ? "You found the nigger and shot him to death <:niggerFound:870346499010215996>:boom: <:niggerKill:870346498708209715>" : "You missed the nigger and he stole your cash <:niggerEscaped:870346498876010547> <:niggerCashGrab:870346498678874163> :dollar:",
                    components: []
                }).catch(e => console.log(e))
            })
            fs.writeFileSync(filePath, JSON.stringify(nhStats, null, "\t"))
        },
        onError: () => {}
    })
})