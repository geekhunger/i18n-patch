import Polyglot from "./polyglot.js"
const dict = new Polyglot()

const {DICTIONARY, has, add} = dict

console.log(Object.getOwnPropertyNames(dict))

console.log(DICTIONARY)

dict.add({ // or just `add({...})`
    ["first translation"]: {
        en: "some shit",
        de: "irgendein scheiss",
        ru: "какая-то хрень"
    },
    ["second translation"]: {
        en: "this is a test",
        de: "das ist ein test",
        ru: "это тест"
    },
    ["3rd translation"]: {
        en: "three",
        de: "drei",
        ru: "три"
    }
})

console.log(DICTIONARY)

console.log(has("first translation", "es"))

dict.DICTIONARY = {
    ["000-$/Some(weird)Identifier"]: {
        en: "It doesn't get any better", // try uncomment this
        de: "Besser geht nicht",
        ru: "Лучше не бывает",
        fr: "On ne peut pas faire mieux"
    }
}

dict.add("second translation", "foooooobarBAZ", "en", true)

console.log(DICTIONARY, dict.DICTIONARY, dict.PREFERRED_LANGUAGE)

dict.PREFERRED_LANGUAGE = "ru" // try changing this to "fr"

console.log(dict.FULLY_SUPPORTED_LANGUAGES, dict.PARTLY_SUPPORTED_LANGUAGES, dict.PREFERRED_LANGUAGE)

console.log(dict.INCOMPLETE_TRANSLATIONS)

console.log(dict.DICTIONARY)

console.log(dict.patch("This $01/$2 a test!", "is", undefined, "is not", "???"))

dict.add("Missing Translation Error", "Traducción '$1' por '$2' ¡faltan!", "es")

console.log(dict.print("first translation", "es")) // dict.PREFERRED_LANGUAGE
