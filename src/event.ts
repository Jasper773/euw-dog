import { ClientEvents, Events } from "discord.js"
import { pathToFileURL } from "url"
import Bot from "@/bot.js"

type EventsMap = Map<keyof ClientEvents, Event>
type EventFactory = (bot: Bot) => EventObject
type EventParameters = { name: keyof ClientEvents, once: boolean, bot: Bot, exec: (...args: any[]) => Promise<void> | void }
type EventObject = {
    name: Events,
    once: boolean,
    exec: (...args: any[]) => void | Promise<void>,
    bot: Bot
}

class Event {
    #name: keyof ClientEvents
    #once: boolean
    protected bot: Bot
    exec: (...args: any[]) => Promise<void> | void

    constructor({ name, once, bot, exec }: EventParameters){
        this.bot = bot
        this.#name = name
        this.#once = once
        this.exec = exec.bind(this)
    }

    static async createFromFile({ bot, eventPath }: { bot: Bot, eventPath: string }){
        const eventFactory = (await import(eventPath)).default
        const eventData = await eventFactory(bot)
        return await new Event({
            name: eventData.name,
            once: eventData.once,
            bot: eventData.bot,
            exec: eventData.exec
        })
    }

    getName = () => this.#name
    onlyRunsOnce = () => this.#once
}

async function loadEventFromFile(eventPath: string, bot: Bot): Promise<Event> {
    const eventFn = (await import(eventPath)).default
    return eventFn(bot)
}

export { Event, EventsMap, EventFactory, EventObject, loadEventFromFile }