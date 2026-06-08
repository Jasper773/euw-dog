import { ChatInputCommandInteraction, StringSelectMenuInteraction, ComponentType, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, StringSelectMenuComponent } from "discord.js"

import { Command } from "@/command.js"
import Bot from "@/bot.js"

const pastas = [`\`\`\`js
    ━━╮
    ╰┃ ┣▇━▇
     ┃ ┃  ╰━▅╮
     ╰┳╯ ╰━━┳╯ BRUV KEK \😎
      ╰╮ ┳━━╯ SUPER EASY \🤙
     ▕▔▋ ╰╮╭━╮NICE TUTORIAL \😂
    ╱▔╲▋╰━┻┻╮╲╱▔▔▔╲
    ▏  ▔▔▔▔▔▔▔  O O┃
    ╲╱▔╲▂▂▂▂╱▔╲▂▂▂╱
     ▏╳▕▇▇▕ ▏╳▕▇▇▕
     ╲▂╱╲▂╱ ╲▂╱╲▂╱\`\`\``,
    `\`\`\`js
        ‏‎‍‌​     
    ▬▬▬.◙.▬▬▬
    ═▂▄▄▓▄▄▂
    ◢◤ █▀▀████▄▄▄▄◢◤
    █▄ █  ███▀▀▀▀▀▀▀╬
    ◥█████◤
    ══╩══╩══
      ╬═╬
      ╬═╬☻/  LOL NERDS 🤣
      ╬═╬/▌  GIGA EASY 👋
      ╬═╬/ \\ EZ TUTORIAL 😎\`\`\``,
    `\`\`\`js
    🚩
          ▄▌▐▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▌
       ▄▄██▌█ YOUR TEARS\✅
    ▄▄▄▌▐██▌█ YOUR LP\✅
    ███████▌█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▌
    ▀(⊙)▀▀▀▀▀▀▀(⊙)(⊙)▀▀▀▀▀▀▀▀▀▀(⊙)\`\`\``,
    `\`\`\`js
        ‏‎‍‌​     
     ┃╭╮╭╮┃
    ╭┫▕▎▕▎┣╮
    ╰┓┳╰╯┳┏╯ For You
    ╭┛╰━━╯┗━━━╮
    ┃┃    ┏━╭╰╯╮
    ┃┃    ┃┏┻━━┻┓
    ╰┫ ╭╮ ┃┃-20LP\⬇️┃
     ┃ ┃┃ ┃╰━━━━╯
    ╭┛ ┃┃ ┗-╮\`\`\``,
    `\`\`\`js
        ‏‎‍‌​     
    ░█▀▀▀░█▀▀▀░░█▀▀░▀▀█░
    ░█░▄▄░█░▄▄░░█■■ ░▄■▀░
    ░█▄▄█░█▄▄█░░█▄▄░█▄▄░
    ／ﾌﾌ 　　　　　　　ム｀ヽ
    / ノ) 　　　　　　　　）　ヽ
    / ｜　　( ͡° ͜ʖ ͡°）ノ⌒（ゝ._,ノ
    /　ﾉ⌒7⌒ヽーく　 ＼　／
    丶＿ ノ ｡　　 ノ､　｡|/
    　　 \`ヽ \`ー-'_人\`ーﾉ
    　　　 丶 ￣ _人'彡ﾉ\` \`\`\``,
    `\`\`\`js
        ‏‎‍‌​     
    ╭━━━━━━━╮
    ┃         ●  ══      ┃
    ┃██████████┃
    ┃██████████┃
    ┃██████████┃
    ┃█"ur adopted"█┃
    ┃█ -Mum & Dad█┃
    ┃██████████┃
    ┃██████████┃
    ┃██████████┃
    ┃           ○           ┃
    ╰━━━━━━━╯
    \`\`\``,
    `\`\`\`js
        ‏‎‍‌​    
    \⚪\⚪\⚪\⚫\⚫\⚪\⚪\⚪\⚪\⚪
    \⚪\⚪\⚫\⚫\⚪\⚪\⚪\⚫\⚪\⚪
    \⚪\⚫\⚫\⚪\⚪\⚪\⚫\⚫\⚫\⚪
    \⚪\⚪\⚫\⚫\⚪\⚫\⚫\⚪\⚫\⚫
    \⚪\⚪\⚪\⚫\⚫\⚫\⚪\⚪\⚪\⚫
    \⚫\⚪\⚪\⚪\⚫\⚫\⚫\⚪\⚪\⚪
    \⚫\⚫\⚪\⚫\⚫\⚪\⚫\⚫\⚪\⚪
    \⚪\⚫\⚫\⚫\⚪\⚪\⚪\⚫\⚫\⚪
    \⚪\⚪\⚫\⚪\⚪\⚪\⚫\⚫\⚪\⚪
    \⚪\⚪\⚪\⚪\⚪\⚫\⚫\⚪\⚪\⚪\`\`\``
]

export default (async ({ bot, commandDir }: { bot: Bot, commandDir: string }) => {
    return ({
        name: "pastas",
        description: "Post BM pastas",
        type: 1,
        options: [],
        bot,
        cmdDir: commandDir,
        group: "Entertainment",
        exec: async function(this: Command, interaction: ChatInputCommandInteraction) {
            await interaction.reply({ components: [{
                type: 1,     
                components: [{ type: 3, custom_id: 'select', placeholder: 'Select a pasta', options: [
                        { label: 'DOG', description: 'BRUV KEK 😎 SUPER EASY 🤙 NICE TUTORIAL 😂', value: '0' },
                        { label: 'HELICOPTER', description: 'LOL NERDS 🤣 GIGA EASY 👋 EZ TUTORIAL 😎', value: '1' },
                        { label: 'TRUCK', description: 'YOUR TEARS✅ YOUR LP✅', value: '2' },
                        { label: 'SUITCASE', description: 'FOR YOU: -20 LP⬇️', value: '3' },
                        { label: 'GG EZ', description: 'GG EZ ( ͡° ͜ʖ ͡°)', value: '4' },
                        { label: 'UR ADOPTED', description: 'UR ADOPTED 📱', value: '5' },
                        { label: 'NAZI SYMBOL', description: '⚪ 卐 ⚫', value: '6' }
                    ]
                }
                ]
            }] })
            const replyMessage = await interaction.fetchReply()
            replyMessage.createMessageComponentCollector({ componentType: ComponentType.StringSelect }).on("collect", async (interaction: StringSelectMenuInteraction) => {
                await interaction.deferUpdate()

                const selectedValue = interaction.values[0];
                const content = pastas[parseInt(selectedValue)]
                await replyMessage.edit({ 
                    content: `Click the Copy (📄) Icon on the very right -------------------------↘ \n${content}` 
                })
            })
        },
        onError: () => {}
    })
})
