import Polyglot from "../polyglot.js"

const lib = new Polyglot()

try {
    console.log("Default preferred language:", lib.PREFERRED_LANGUAGE)
    lib.PREFERRED_LANGUAGE = "es" // failure!
} catch(_) {
    console.warn("Ups, missing spanish ('es') translation for dictionary entry with identifier 'Missing Translation Error'! Going to add it now.")
    lib.add("Missing Translation Error", "Traducción '$1' por '$2' ¡faltan!", "es") // add the missing translations
    lib.PREFERRED_LANGUAGE = "es" // success
} finally {
    console.log("Preferred langugage set to:", lib.PREFERRED_LANGUAGE)
}
