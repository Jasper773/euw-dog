import { User, MessageReaction, Events, PartialMessageReaction, PartialUser } from "discord.js"
import { Event, EventFactory } from "@/event"
import Bot from "@/bot"

export default ((bot: Bot) => ({
    name: Events.MessageReactionAdd,
    once: false,
    exec: async function(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
        // const reactionDelete = reaction.emoji.name === "❌"
        // const reactionLog = reaction.emoji.name === "⚠️"
        // const reactionDebug = reaction.emoji.name === "🐞"
        // const reactionRetry = reaction.emoji.name === "🔄"

        // const isReactionValid = reactionDelete || reactionLog || reactionDebug || reactionRetry
        // if (!isReactionValid) return

        // const reactionErrors = reactionLog || reactionDebug

        // const dbTask = await databasePool.query(
        //     `SELECT * FROM postvid
        //      WHERE data->'discord_data'->>'userId' = $1
        //      AND data->'discord_data'->>'messageId' = $2
        //      AND data->'discord_data'->>'guildId' = $3
        //      AND data->'discord_data'->>'channelId' = $4;`,
        //     [user.id, reaction.message.id, reaction.message.guildId, reaction.message.channelId]
        // )
        // const removeReaction = await reaction.users.remove(user.id).catch(e => console.error(e))

        // if (dbTask.rows.length === 0) return
        // const task = dbTask.rows[0]
        // const taskData = dbTask.rows[0].data as PartialWithInfo<TaskData>
        // const discordData = await fetchDiscordDataFromTaskData(taskData)
        // if (!discordData) return

        // if (reactionDelete) {
        //     const isTaskComplete = taskData.info.complete
        //     if (!isTaskComplete) return

        //     const deleteMesage = await discordData.message.delete().catch(e => console.error(e))
        //     try {
        //         await  databasePool.query(`DELETE FROM postvid WHERE id = $1`, [task.id])
        //     } catch(e) {
        //         console.error(e)
        //     }
        // } else if (reactionErrors) {
        //     if (taskData.info.failure.showingRawErrors) {
        //         await discordData.message.edit(unemptyString(taskData.info.text)).catch(e => console.error(e))
        //     } else {
        //         await discordData.message.edit(taskData.info.text + "\n\n" + errorUtils.buildErrorsString(taskData.info.logs, reactionLog)).catch(e => console.error(e))
        //     }
        //     taskData.info.failure.showingRawErrors = !taskData.info.failure.showingRawErrors
        //     try {
        //         await  databasePool.query("UPDATE postvid SET data = $1 WHERE id = $2;", [taskData, task.id])
        //     } catch(e) {
        //         console.error(e)
        //     }
        // } else if (reactionRetry) {
        //     processTask(taskData as PartialWithInfo<TaskData>)
        // }
    },
    bot
})) as EventFactory

