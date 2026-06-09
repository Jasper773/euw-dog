import { ApplicationCommandOptionType } from "discord.js"

export default [{
        name: "link",
        description: "Video link",
        type: ApplicationCommandOptionType.String,
        required: true
    }, {
        name: "text",
        description: "Text content of the post",
        type: ApplicationCommandOptionType.String,
        required: false
    }, {
        name: "start_from",
        description: "Start timestamp (SS, MM:SS or %)",
        type: ApplicationCommandOptionType.String,
        required: false
    }, {
        name: "end_at",
        description: "End timestamp (SS, MM:SS or %)",
        type: ApplicationCommandOptionType.String,
        required: false
    }, {
        name: "borders",
        description: "Border removal",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
            { name: "Light", value: "lowest" },
            { name: "Aggressive", value: "highest" },
            { name: "Do not remove borders", value: "false" }
        ]
    }, {
        name: "speed",
        description: "Playback speed (0.1 - 2.0)",
        type: ApplicationCommandOptionType.String,
        required: false
    }, {
        name: "rotate",
        description: "Video rotation",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
            { name: "Right", value: "1" },
            { name: "Left", value: "2" },
            { name: "Upside Down", value: "3" }
        ]
    }, {
        name: "flip",
        description: "Flip video",
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: [
            { name: "Horizontal", value: "h" },
            { name: "Vertical", value: "v" },
            { name: "Both", value: "hv" }
        ]
    }
] as const