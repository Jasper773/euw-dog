class Instances {
    #instances: Set<number> = new Set()

    getFreeInstance() {
        let i = 0
        while(true){
            if(!this.#instances.has(i)){
                this.#instances.add(i)
                return i
            }
            i++
        }
    }

    freeInstance(i: number) {
        this.#instances.delete(i)
    }
}

export default Instances