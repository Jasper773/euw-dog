import { Client, Partials, GatewayIntentBits, REST, Routes, ClientEvents } from "discord.js"
import { Event, EventsMap, loadEventFromFile } from "./event.js"
import { Command, CommandsMap } from "./command.js"
import { pathToFileURL } from "url"
import path from "path"
import fs from "fs"

class Bot {
    #client: Client
    #rest: REST
    #commandsMap: CommandsMap = new Map()
    #clientEventsMap: EventsMap = new Map()

    private constructor(client: Client, rest: REST){
        this.#client = client
        this.#rest = rest
    }

    getClient = () => this.#client
    getCommands = () => this.#commandsMap
    getName = () => this.#client?.user?.username

    async #loadCommands(commandsDir: string){
        this.#commandsMap = await Command.createFromDirectory({ bot: this, commandsDir })
    }

    async #loadEvents(eventsDir: string){
        const eventsSet: Set<Event> = new Set()
        for (const [cmdName, command] of this.#commandsMap){
            for(const [evName, event] of command.getEvents()){
                eventsSet.add(event)
            }
        }
        for await (const eventFile of fs.readdirSync(eventsDir)) {
            const event = await Event.createFromFile({ eventPath: path.join(eventsDir, eventFile), bot: this })
            this.#clientEventsMap.set(event.getName(), event)
            eventsSet.add(event)
        }

        for (const event of eventsSet) {
            const execEvent = (...args: any[]) => {
                const clientEvent = this.#clientEventsMap.get(event.getName())
                if (clientEvent) {
                    clientEvent.exec(...args)
                }

                this.#commandsMap.forEach(async command => {
                    const cmdEvents = command.getEvents()
                    const cmdEv = cmdEvents.get(event.getName())
                    if (cmdEv) {
                        cmdEv.exec(...args)
                    }
                })
            }
            if (event.onlyRunsOnce()) this.#client.once(event.getName(), execEvent)
            else this.#client.on(event.getName(), execEvent)
        }
    }

    async #start(token: string){
        await this.#client.login(token)
        await this.#rest.put(Routes.applicationCommands(this.#client.user!.id), {
            body: Array.from(this.#commandsMap, ([key, command]) => {
                return {
                    name: command.getName(),
                    description: new Set([2, 3]).has(command.getType()) ? "" : command.getDescription(),
                    options: command.getOptions(),
                    type: command.getType()
                }
            })
        })
    }

    static async create({ token, commandsDirPath, eventsDirPath, intents, partials } : { token: string, commandsDirPath: string, eventsDirPath: string, intents: GatewayIntentBits[], partials: Partials[] }){
        const client = new Client({ intents, partials })
        const rest = new REST({ version: "10" }).setToken(token)
        const bot = new Bot(client, rest)
        await bot.#loadCommands(commandsDirPath)
        await bot.#loadEvents(eventsDirPath)
        await bot.#start(token)
        return bot
    }
}

export default Bot