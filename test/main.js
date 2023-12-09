import {type, assert} from "type-approve"
import {exit} from "process"

const queue = [
    "class",
    "dictionary"
]

!async function() {
    try {
        console.info("[v] Executed unit tests.")
    
        let units = []
        for(let unit of queue) {
            const filename = unit
                .replace(/^(\.\/)?/, "./")
                .replace(/(\.js)?$/, ".js")
            const value = await import(filename)
            units.push(value.default)
        }

        const separator = "\n\t - "
        const failures = separator + units
            .filter(message => type({string: message}) && message.length > 0)
            .join(separator)

        assert(units.every(test => !test), failures)
    
        console.info("[v] All unit tests have passed.")
        exit(0) // resolve

    } catch({message}) {
        if(type({string: message}) && message.length > 0) {
            console.error("[x] Failures: " + message.replace(/assertion error: /gi, ""))
        }

        console.info("[x] Some unit tests have failed!")
        exit(1) // reject
    }
}()
