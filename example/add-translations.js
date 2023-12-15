import Polyglot from "../polyglot.js"

const lib = new Polyglot()

// add translations one-by-one
const id = "first translation"
lib.add(id, "some shit", "en")
lib.add(id, "irgendein scheiss", "de")
lib.add(id, "какая-то хрень", "ru")

// bulk-add multiple translations at once
lib.add({
    ["second translation"]: {
        en: "this is a test",
        de: "das ist ein test",
        ru: "это тест"
    },
    ["3rd translation"]: {
        en: "three",
        ru: "три"
    }
})

// exactly the same as bulk-add
// this strange syntax is just a by-product of security that is required to prevent accidental overwriting of the entire dictionary
// (the internal setter will simply forward the value to the `add` method)
lib.DICTIONARY = {
    ["Your identifiers [may] use (some) specials chars too!"]: {
        en: "It doesn't get any better", // try uncomment this
        de: "Besser geht nicht",
        ru: "Лучше не бывает",
        fr: "On ne peut pas faire mieux"
    }
}

console.log(lib.has("3rd translation", "ru")) // check single

console.log(lib.DICTIONARY) // see all

console.log(lib.INCOMPLETE_TRANSLATIONS) // dictionary contains some translations, but are they all complete?
