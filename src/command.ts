import { ChatInputCommandInteraction, ApplicationCommandOptionType, ClientEvents } from "discord.js"
import { EventsMap } from "@/event.js"
import { pathToFileURL } from "url"
import { loadEventFromFile } from "@/event.js"
import { Event } from "@/event.js"
import Bot from "./bot.js"
import path from "path"
import fs from "fs"

type CommandFactory = (bot: Bot, commandDir: string) => Promise<CommandParameters>

type CommandOption = {
    name: string
    description: string
    type: ApplicationCommandOptionType
    required: boolean
    min_length?: number
    max_length?: number
}

interface CommandParameters {
    bot: Bot;
    cmdDir: string;
    name: string;
    description: string;
    type: number;
    options: CommandOption[];
    cooldown?: number;
    group: string;
    enabled?: boolean;
    exec: (interaction: ChatInputCommandInteraction) => any | Promise<any>;
    onError: (interaction: ChatInputCommandInteraction) => any | Promise<any>;
}

type CommandsMap = Map<string, Command>

class Command {
    #bot: Bot
    #cmdDir: string
    #name: string
    #description: string
    #type: number
    #cooldown: number
    #group: string
    #enabled: boolean
    #options: CommandOption[]
    #events: EventsMap
    exec: (interaction: ChatInputCommandInteraction) => any | Promise<any>
    onError: (interaction: ChatInputCommandInteraction, error: unknown) => any | Promise<any>

    private constructor({ bot, cmdDir, name, description, type, options, cooldown = 5, group, enabled = true, exec, onError }: CommandParameters){
        this.#bot = bot
        this.#cmdDir = cmdDir
        this.#name = name
        this.#description = description
        this.#type = type
        this.#cooldown = cooldown
        this.#group = group
        this.#enabled = enabled
        this.#options = options
        this.#events = new Map()
        this.exec = exec.bind(this)
        this.onError = onError.bind(this)
    }

    static async create({ bot, cmdDir, name, description, type, options, cooldown = 5, group, enabled = true, exec, onError }: CommandParameters){
        const command = new Command({ bot, cmdDir, name, description, type, options, cooldown, group, enabled, exec, onError })
        await command.#loadEvents()
        return command
    }

    static async createFromFile({ bot, commandPath }: { commandPath: string, bot: Bot }): Promise<Command> {
        const cmdFactory = (await import(commandPath)).default
        const cmdDir = commandPath.slice(0, commandPath.lastIndexOf("/"))
        const cmdData = await cmdFactory({ bot: bot, commandDir: cmdDir })
        console.log(cmdData.name)
        return await Command.create({
            name: cmdData.name,
            description: cmdData.description,
            type: cmdData.type,
            options: cmdData.options,
            bot,
            cmdDir: cmdDir,
            group: cmdData.group,
            exec: cmdData.exec,
            onError: cmdData.onError
        })
    }

    static async createFromDirectory({ bot, commandsDir }: { bot: Bot, commandsDir: string }){
        const commandsMap: Map<string, Command> = new Map()
        const commandsFolders = fs.readdirSync(commandsDir)
        
        for await (const cmdFolder of commandsFolders) {
            const cmd = await Command.createFromFile({ bot: bot, commandPath: path.join(commandsDir, cmdFolder, "index.js") })
            commandsMap.set(cmd.getName(), cmd)
        }
        return commandsMap
    }

    async #loadEvents(){
        const eventsDir = path.join(this.#cmdDir, "events")
        if (!fs.existsSync(eventsDir)) return
        for await (const eventFile of fs.readdirSync(eventsDir)){
            const event = await Event.createFromFile({ eventPath: path.join(eventsDir, eventFile), bot: this.#bot })
            this.#events.set(event.getName(), event)
        }
    }


    getName = () => this.#name
    getType = () => this.#type
    getDescription = () => this.#description
    getOptions = () => this.#options

    getEvents(){
        return this.#events
    }

    getInteractionOptions<T>(interaction: ChatInputCommandInteraction){
        const optionsMap: Map<keyof T, any> = new Map()
        for(const option of this.#options){
            const o = interaction.options.get(option.name)
            optionsMap.set(option.name as any, o?.value)
        }
        return optionsMap
    }

}

export { Command, CommandOption, CommandsMap, CommandFactory, CommandParameters }