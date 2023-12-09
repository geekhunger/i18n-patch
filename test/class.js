import Polyglot from "../polyglot.js"
import {assert} from "type-approve"

let dict = new Polyglot()
let failure = false

try {
    assert(dict instanceof Polyglot, "Subclass is not an instance of the Superclass!")
    console.log("[v] Verified class inheritance.")

    const properties = Object.getOwnPropertyNames(Object.getPrototypeOf(dict))
    const known = [
        "constructor",
        "DICTIONARY",
        "INCOMPLETE_TRANSLATIONS",
        "PREFERRED_LANGUAGE",
        "FULLY_SUPPORTED_LANGUAGES",
        "PARTLY_SUPPORTED_LANGUAGES",
        "AVAILABLE_LANGUAGES",
        "has",
        "add",
        "patch",
        "translate",
    ]
    const unknown = properties.filter(name => !known.includes(name))
    assert(unknown.length < 0, `Class has undocumented properties ${JSON.stringify(unknown)}!`)
    console.log("[v] Checked required class methods and properties.")
} catch({message}) {
    failure = message
}

export default failure
