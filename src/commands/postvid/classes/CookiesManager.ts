import fs from "fs"
import path from "path"

type CookiesType = {
    "aliases": string[]
    "data": string
    "path": string
}

class Cookies {
    #list: CookiesType[] = []

    constructor(cookiesFolder: string){
        const cookieFiles = fs.readdirSync(cookiesFolder)
        for(const fileName of cookieFiles){
            if(fileName[0] === ".") continue
            const fileData = fs.readFileSync(path.join(cookiesFolder, fileName))
            const cookieAliases = fileName.split(",")
            this.#list.push({
                "aliases": cookieAliases,
                "data": fileData.toString(),
                "path": path.join(cookiesFolder, fileName)
            })
        }
    }

    getByLink(link: string){
        const websiteName = link.match(/^.+(?:www)?([a-z]+)\.[a-z]+/i)?.[1]
        if(websiteName === undefined) return undefined
        return this.#list.find(x => x.aliases.some(alias => alias.includes(websiteName)))?.path
    }
}

export default Cookies