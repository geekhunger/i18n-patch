import {Polyglot} from "./polyglot.js"
const dict = new Polyglot()

console.log(dict.DICTIONARY, dict.PREFERRED_LANGUAGE)

dict.add({
    ["first translation"]: {
        en: "some shit",
        de: "irgendein scheiss",
        ru: "какая-то хрень"
    },
    ["second translation"]: {
        en: "this is a test",
        ru: "это тест"
    },
    ["3rd translation"]: {
        en: "three",
        ru: "три"
    }
})

dict.DICTIONARY = {
    ["000-$/Some(weird)Identifier"]: {
        en: "It doesn't get any better", // try uncomment this
        ru: "Лучше не бывает",
        fr: "On ne peut pas faire mieux"
    }
}

dict.add("second translation", "foooooobarBAZ", "en", true)

console.log(dict.DICTIONARY, dict.PREFERRED_LANGUAGE)

dict.PREFERRED_LANGUAGE = "ru" // try changing this to "fr"

console.log(dict.FULLY_SUPPORTED_LANGUAGES, dict.PARTLY_SUPPORTED_LANGUAGES, dict.PREFERRED_LANGUAGE)

console.log(dict.INCOMPLETE_TRANSLATIONS)

console.log(dict.put("first translation", dict.PREFERRED_LANGUAGE))

console.log(dict.patch("This $0001.1 a test!", "is not"))
