import { ChatInputCommandInteraction, MessageFlags, ComponentType, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js"

import { Command } from "@/command.js"
import Bot from "@/bot.js"

const links = [
    [
        "https://cdn.discordapp.com/attachments/862034393119326249/1086779738619642057/thanos1.png",
        "https://cdn.discordapp.com/attachments/862034393119326249/1086779737906626591/thanos2.png",
        "https://cdn.discordapp.com/attachments/862034393119326249/1086779738288300064/thanos3.png",
    ],
    [
        "https://cdn.discordapp.com/attachments/862034393119326249/1086779759461154856/thanos_1.png",
        "https://cdn.discordapp.com/attachments/862034393119326249/1086779759696019536/thanos_2.png",
        "https://cdn.discordapp.com/attachments/862034393119326249/1086779759981236295/thanos_3.png",
    ],
    [
        "https://cdn.discordapp.com/attachments/862034393119326249/1086779776473247754/thanos_cock_1.png",
        "https://cdn.discordapp.com/attachments/862034393119326249/1086779776754270259/thanos_cock_2.png",
        "https://cdn.discordapp.com/attachments/862034393119326249/1086779777035272263/thanos_cock_3.png",
    ],
    [
        "https://cdn.discordapp.com/attachments/862034393119326249/1409569012509049013/thanoscock_1.png?ex=68addaf1&is=68ac8971&hm=069b8b46d0842ad8e7292df7a65e7ddd8d001bfa397a937c74eb97c1ac96d7ca&",
        "https://cdn.discordapp.com/attachments/862034393119326249/1409569013729853531/thanoscock_2.png?ex=68addaf1&is=68ac8971&hm=091cbb02901e2e75f22cef897b5f63dc92119f8f59da18cc3ca08d8dc9af57c6&",
        "https://cdn.discordapp.com/attachments/862034393119326249/1409569014828634182/thanoscock_3.png?ex=68addaf1&is=68ac8971&hm=4f180e155be44bd56e37e8ca222123a17c3434d146eff37e0e89939e6b26de67&"
    ],
    [
        "https://cdn.discordapp.com/attachments/862034393119326249/1408761647857795133/thanos_1.png?ex=68aaeb06&is=68a99986&hm=8cf10eadd3c0055d3a6f2a1d76cb3146d7f2030609d07d9be7278b49be5558aa&",
        "https://cdn.discordapp.com/attachments/862034393119326249/1408761648809906309/thanos_2.png?ex=68aaeb06&is=68a99986&hm=0875a9ced027b534783fd458c7a525a126fac78e7c823ca314059e51abd88e94&",
        "https://cdn.discordapp.com/attachments/862034393119326249/1408761649615208488/thanos_3.png?ex=68aaeb06&is=68a99986&hm=f8c100941438f7529604bc73c31bbd4880667d3c6bea0e89d5baa3fa9bd1850d&"
    ],
    [
        "https://cdn.discordapp.com/attachments/514451233293991957/1086492011558883410/2Q.png"
    ],
]


export default (async ({ bot, commandDir }: { bot: Bot, commandDir: string }) => {
    return ({
        name: "thanos",
        description: "Images of Thanos's huge veiny succulent COCK.",
        type: 1,
        options: [],
        bot,
        cmdDir: commandDir,
        group: "Entertainment",
        exec: async function(this: Command, interaction: ChatInputCommandInteraction) {

        const select = new StringSelectMenuBuilder()
            .setCustomId("select")
            .setPlaceholder("Select a pasta")
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel("COCKE NUMERO UNO ╭ᑎ╮")
                    .setDescription("😡 THANOS COCK I 😡")
                    .setValue("0"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("COCKALAKA TWO ╰⋃╯")
                    .setDescription("🥵 THANOS COCK II 🥵")
                    .setValue("1"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("COCKZAURUS REX 8===D")
                    .setDescription("😈 THANOS COCK III 😈")
                    .setValue("2"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("GLORIOUS BING-BONG 𓂸")
                    .setDescription("🍆 THANOS COCK IV 🍆")
                    .setValue("3"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("BOOSTY THANO-CURVES 💦")
                    .setDescription("🍑 THANOS ASS POSE HOT 🍑")
                    .setValue("4"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("COCK-A-CLAUS 🌟")
                    .setDescription("🎄 THANOS COCK V. X-MAS 🎄")
                    .setValue("5")
            )

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)

            await interaction.reply({
                components: [row]
            })

            const replyMessage = await interaction.fetchReply().catch(e => console.error(e))
            if (replyMessage === undefined) return
            replyMessage.createMessageComponentCollector({ componentType: ComponentType.StringSelect }).on("collect", async (component) => {

                if(component.user.id !== interaction.user.id) return await component.reply({ content: "❌ **You cannot make a choice for someone else.**", flags: [MessageFlags.Ephemeral] }).catch(e => console.error(e))

                const selectedIndex = parseInt(component.values[0], 10)
                if (!links[selectedIndex]) return await component.reply({ content: "❌ **Your choice could not be processed. Try again.**", flags: [MessageFlags.Ephemeral] }).catch(e => console.error(e))

                await replyMessage.edit({ content: links[selectedIndex].join("\n"), components: [] })
                await component.deferUpdate().catch(e => console.error(e))
            })
        },
        onError: () => {}
    })
})
