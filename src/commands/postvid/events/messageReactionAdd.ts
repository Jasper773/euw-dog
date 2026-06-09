import { User, MessageReaction, Events, PartialMessageReaction, PartialUser, MessageReactionEventDetails } from "discord.js"
import { EventFactory } from "@/event.js"
import Bot from "@/bot.js"

export default ((bot: Bot) => ({
    name: Events.MessageReactionAdd,
    once: false,
    exec: async function(reaction: MessageReaction, user: User, details: MessageReactionEventDetails) {
        const isReactionValid = reaction.emoji.name === "❌"
        if (!isReactionValid) return
        const reactionMessage = await reaction.message.fetch()
        const interactionMetadata = reactionMessage.interactionMetadata
        if (!interactionMetadata) return console.log(interactionMetadata)
        const reactionUsers = await reaction.users.fetch()
        const didInteractionCreatorReact = reactionUsers.has(user.id)
        if (!didInteractionCreatorReact) return
        await reaction.message.delete()
    },
    bot
})) as EventFactory

