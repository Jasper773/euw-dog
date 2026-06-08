import { ChatInputCommandInteraction, ChannelType, MessageFlags, GuildMemberRoleManager } from "discord.js"

import { Command } from "@/command.js"
import pool from "@/database.js"
import Bot from "@/bot.js"

const options = [{
        name: "color",
        description: "Color in HEX format.",
        type: 3,
        min_length: 6,
        max_length: 7,
        required: true
    }
] as const

type Inputs = {
    [K in typeof options[number]["name"]]: string | undefined
}

export default (async ({ bot, commandDir }: { bot: Bot, commandDir: string }) => {
    return ({
        name: "namecolor",
        description: "Change your name's color.",
        type: 1,
        options: options,
        bot,
        cmdDir: commandDir,
        group: "Entertainment",
        exec: async function(this: Command, interaction: ChatInputCommandInteraction) {
            if(!interaction.inGuild() || !interaction.guild) return await interaction.reply({ content: "❌ **This command cannot be ran in DMs.**", flags: MessageFlags.Ephemeral })
        
            const input = this.getInteractionOptions<Inputs>(interaction).get("color")
            if (!input) return await interaction.reply({ content: "❌ **Unable to retrieve the color value.**", flags: MessageFlags.Ephemeral })
            
            if (input === "!!!DELALL"){
                const result = await pool.query(`
                    SELECT * FROM namecolor_roles
                    WHERE guild_id = $1
                `, [interaction.guild.id])
        
                const databaseRoles = result.rows
                const guild = interaction.guild
        
                const roles = databaseRoles.map(dbrole => guild.roles.cache.get(dbrole.role_id)).filter(role => role !== undefined)
        
                for await(const role of roles){
                    await role.delete()
                }
                return
            }
        
            const hexColor = input.match(/(0x|#)?([0-9A-F]{6})/i)?.[2].toUpperCase()
            if(!hexColor) return await interaction.reply({ content: "❌ **Invalid HEX color format.\n\nYou can visit https://www.google.com/search?q=color+picker to choose a color and retrieve its HEX value.**", flags: MessageFlags.Ephemeral })
            
            const desiredColor = HEX2HSV(hexColor)
            if(!desiredColor) return await interaction.reply({ content: "❌ **Invalid HEX color format.\n\nYou can visit https://www.google.com/search?q=color+picker to choose a color and retrieve its HEX value.**", flags: MessageFlags.Ephemeral })
        
            const result = await pool.query(`
                SELECT * FROM namecolor_roles
                WHERE guild_id = $1
            `, [interaction.guild.id])
        
            const databaseRoles = result.rows
            const guild = interaction.guild
        
            const roles = databaseRoles.map(dbrole => guild.roles.cache.get(dbrole.role_id)).filter(role => role !== undefined)
        
            const memberRoles = interaction.member.roles as GuildMemberRoleManager
        
            let rolesToBeDeleted = []
        
            for await(const role of roles){
                if(!memberRoles.cache.has(role.id)) continue
                await memberRoles.remove(role)
                if(Array.from(role.members).length === 0){
                    rolesToBeDeleted.push(role.id)
                }
            }
        
            function areValuesClose(a: number, b: number, range: number, hue: boolean = false){
                if(hue){
                    const difference = Math.abs(a - b)
                    const distance = Math.min(difference, 360 - difference)
                    return distance <= range
                } else {
                    return Math.abs(a - b) <= range
                }
            }
        
            const existentRoleWithSimilarColor = roles.find(role => {
                const roleColor = HEX2HSV(role.hexColor)
                if(roleColor === undefined) return false
                return (
                    areValuesClose(roleColor.hue, desiredColor.hue, 5, true) &&
                    areValuesClose(roleColor.saturation, desiredColor.saturation, 5) &&
                    areValuesClose(roleColor.value, desiredColor.value, 5)
                ) 
            })
        
            const highestRole = memberRoles.highest
            const highestRolePosition = highestRole.position
        
            const colorName = getColorName(hexColor) as string
            // let numberOfRolesWithSameName = 0
            // for(const role of roles){
            //     if(role.name.startsWith(colorName)){
            //         numberOfRolesWithSameName += 1
            //     }
            // }
            // const roleIdentifier = numberOfRolesWithSameName > 0 ? `#${numberOfRolesWithSameName}` : ``
            const roleName = colorName// + " " + roleIdentifier
        
            const client = await pool.connect()
        
            let roleToBeMoved = undefined
        
            if(existentRoleWithSimilarColor){
                await memberRoles.add(existentRoleWithSimilarColor)
                if(existentRoleWithSimilarColor.position < highestRolePosition){
                    roleToBeMoved = existentRoleWithSimilarColor
                }
            } else {
        
                const newRole = await guild.roles.create({
                    name: `COLOR: ${roleName}`,
                    color: `#${hexColor}`,
                    hoist: false,
                    permissions: []
                })
        
                try {
                    await pool.query('BEGIN')
        
                    const addRoleToDatabase = await pool.query(
                        "INSERT INTO namecolor_roles (role_id, guild_id, color, name) VALUES ($1, $2, $3, $4);",
                        [newRole.id, guild.id, hexColor, roleName]
                    )
        
                    await pool.query('COMMIT')
                } catch(e) {
                    await pool.query('ROLLBACK')
                    console.error(e)
                } finally {
                    client.release()
                }
        
                const memberRoles = interaction.member.roles as GuildMemberRoleManager
                await memberRoles.add(newRole)
        
                roleToBeMoved = newRole
            }
            if(roleToBeMoved) await roleToBeMoved.setPosition(highestRolePosition + 1)
            
            try {
                await pool.query('BEGIN')
        
                await pool.query(`
                    INSERT INTO rolecolor (userId, guildId, colorName, hexColor, createdAt)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (userId, guildId, hexColor)
                    DO UPDATE SET
                        colorName = EXCLUDED.colorName,
                        hexColor = EXCLUDED.hexColor,
                        createdAt = NOW();
                `, [interaction.user.id, interaction.guild.id, colorName, hexColor])
        
                await pool.query(`
                    DELETE FROM rolecolor
                    WHERE id IN (
                        SELECT id FROM rolecolor
                        WHERE userId = $1 AND guildId = $2
                        ORDER BY createdAt DESC
                        OFFSET 15
                    );
                `, [interaction.user.id, interaction.guild.id]);
        
                const result = await pool.query(`
                    SELECT * FROM rolecolor
                    WHERE userId = $1 AND guildId = $2
                    ORDER BY createdAt DESC;
                `, [interaction.user.id, interaction.guild.id])
        
                await pool.query('COMMIT')
        
                const colorsHistory: {
                    colors: string[],
                    values: string[],
                    dates: string[]
                } = {
                    colors: [],
                    values: [],
                    dates: []
                }
        
                function formatTimestamp(timestamp: Date): string {
                    const date = new Date(timestamp)
        
                    const pad = (n: number): string => n.toString().padStart(2, '0')
        
                    const day = pad(date.getDate())
                    const month = pad(date.getMonth() + 1)
                    const year = date.getFullYear()
        
                    const hours = pad(date.getHours())
                    const minutes = pad(date.getMinutes())
                    const seconds = pad(date.getSeconds())
        
                    return `${day}/${month}/${year}` // | ${hours}:${minutes}:${seconds}
                }
        
                for (const row of result.rows) {
                    colorsHistory.colors.push(row.colorname)
                    colorsHistory.values.push(row.hexcolor)
                    colorsHistory.dates.push(formatTimestamp(row.createdat))
                }
        
                const embed = {
                    color: parseInt(hexColor, 16),
                    title: `✅ Your name's color has been changed to ${colorName} (#${hexColor})!`,
                    description: `${hexColor === "000000" ? "⚠️ Beware that pure black **#000000** acts as **transparent** in Discord. If you actually desired the color black, set it to **#000001** instead.\n\n" : ""}ℹ️ Here are the last **15 colors** you used in this server:`,
                    fields: [
                        {
                            name: "Color",
                            value: colorsHistory.colors.join("\n"),
                            inline: true,
                        },
                        {
                            name: "Value",
                            value: colorsHistory.values.join("\n"),
                            inline: true,
                        },
                        {
                            name: "Date",
                            value: colorsHistory.dates.join("\n"),
                            inline: true,
                        }
                    ]
                }
        
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
            } catch (e) {
                await pool.query('ROLLBACK')
                console.error(e)
            } finally {
                client.release()
            }
        },
        onError: () => {}
    })
})

function HEX2HSV(hex: string): { hue: number; saturation: number; value: number } | undefined {
    hex = hex.replace(/^#/, '')
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('')
    }
    if (hex.length !== 6) {
        return undefined
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    let h = 0
    if (delta !== 0) {
        if (max === r) {
            h = ((g - b) / delta + (g < b ? 6 : 0))
        } else if (max === g) {
            h = ((b - r) / delta + 2)
        } else {
            h = ((r - g) / delta + 4)
        }
        h *= 60
    }

    const s = max === 0 ? 0 : delta / max
    const v = max

    return {
        hue: Math.round(h),
        saturation: Math.round(s * 100),
        value: Math.round(v * 100),
    }
}

const originalColors: string[] = [
    "Red", "Scarlet", "Orange", "Amber",
    "Yellow", "Chartreuse", "Lime", "Spring",
    "Green", "Emerald", "Jade", "Mint",
    "Cyan", "Aqua", "Blue", "Cobalt",
    "Navy", "Cerulean", "Purple", "Lavender",
    "Magenta", "Fuchsia", "Rose", "Crimson", "Red"
]

const step = Math.floor(360 / originalColors.length)

const colorList: [number, string][] = originalColors.map((color, index) => {
    const hue = step * index
    return [hue === 0 ? hue : hue - 1, color]
})

function getColorName(hex: string): string | undefined {
    const HSV = HEX2HSV(hex)
    if(!HSV) return undefined
    if(HSV.value === 0 && HSV.saturation === 0) return "Transparent"
    if(HSV.value <= 5) return "Black"
    if(HSV.saturation <= 5 && HSV.value >= 90) return "White"
    if(HSV.saturation <= 5 && HSV.value <= 90 && HSV.value >= 5) return "Grey"
    let formattedPrefixes = ""

    let prefixes: string[] = []
    if(HSV.value <= 62) prefixes.push("Dark")
    if(HSV.saturation <= 62) prefixes.push("Pale")
    
    if(prefixes.length > 0) formattedPrefixes = prefixes.join(" ") + " "
    const closestColorToHue = colorList.sort((a, b) => Math.abs(HSV.hue - a[0]) - Math.abs(HSV.hue - b[0]))[0][1]
    const colorName = formattedPrefixes + closestColorToHue
    return colorName
}