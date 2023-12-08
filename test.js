import {Polyglot} from "./polyglot.js"
import {type, assert} from "type-approve"
import {exit} from "process"

let i18n = new Polyglot()

try {
    console.info("[v] Executed unit tests.")

    assert(i18n instanceof Polyglot, "Subclass is not an instance of the Superclass!")
    console.log("[v] Verified class inheritance.")
    
    const properties = Object.getOwnPropertyNames(Object.getPrototypeOf(i18n))
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
        "put",
    ]
    const unknown = properties.filter(name => !known.includes(name))
    assert(unknown.length < 1, `Class has undocumented properties ${JSON.stringify(unknown)}!`)
    console.log("[v] Checked class methods and properties.")

    //TODO

    console.info("[v] All tests have passed.")
    exit(0) // resolve
} catch({message}) {
    console.error("[x] Test failure: " + message)
    console.info("[x] Some tests have failed!")
    exit(1) // reject
}
