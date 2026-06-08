import { fileURLToPath } from "url"
import path from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV === "development"
const baseDir = isDev ? "src" : "dist"
const extension = isDev ? ".ts" : ".js"

const directories = {
    root: path.join(__dirname, ".."),
    src: path.join(__dirname, "..", "src"),
    cmds: path.join(__dirname, "..", "src", "commands"),
    evs: path.join(__dirname, "..", "src", "events"),
    db: path.join(__dirname, "..", "db"),
    media: path.join(__dirname, "..", "media")
}

export { directories, isDev, baseDir, extension }

