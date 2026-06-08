import { Message, Events } from "discord.js"
import { EventFactory } from "@/event"
import Bot from "@/bot"

export default ((bot: Bot) => ({
    name: Events.MessageReactionAdd,
    once: false,
    exec: async function(message: Message) {
        // if (message.author.bot || !message.reference) return
        // const reference = await message.fetchReference().catch((e: Error) => console.error(e))
        // if (!reference || reference.author.id !== process.env.ID) return
        // try {
        //     const result = await databasePool.query(
        //         `SELECT * FROM postvid
        //          WHERE data->'discord_data'->>'messageId' = $1
        //          AND data->'discord_data'->>'guildId' = $2
        //          AND data->'discord_data'->>'channelId' = $3;`,
        //         [reference.id, message.guildId, message.channelId]
        //     )
        //     if (!result.rows.length) return
        //     const firstResult = result.rows[0].data.discord_data
        //     if (!firstResult) return
        //     if (firstResult.userId === message.author.id) {
        //         if(result.rows[0].data.info.complete) await reference.edit(message.content).catch(e => console.error(e))
        //         await databasePool.query(`
        //             UPDATE postvid
        //             SET data = jsonb_set(data, '{discord_data,inputs,text}', to_jsonb($1::text), true)
        //             WHERE id = $2`,
        //             [message.content, result.rows[0].id]
        //         )
        //         await message.delete().catch(e => console.error(e))
        //     } else {
        //         if(!("send" in message.channel)) return
        //         const notificationMessage = await message.channel.send(`<@${firstResult.userId}>`).catch(e => console.error(e))
        //         if(notificationMessage) await notificationMessage.delete().catch(e => console.error(e))
        //     }
        // } catch(e) {
        //     console.error(e)
        // }
    },
    bot
})) as EventFactory