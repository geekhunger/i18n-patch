import Polyglot from "../polyglot.js"

const lib = new Polyglot()

// Lets add some translations
lib.add("HelloWorld", "Hallo World!", "en")
lib.add("HelloWorld", "Hallo Wereld!", "nl")

// Use added translations
console.log("English translation:", lib.translate("HelloWorld", "en"))
console.log("Dutch translation:", lib.translate("HelloWorld", "nl"))

// Lets move the 'World' word into its own translation...
lib.add("World", "World", "en")
lib.add("World", "Wereld", "nl")

// Use that word inside of another translation as a placeholder!
try {
    lib.add("HelloWorld", "Hallo $1!", "en")
} catch({message}) {
    console.warn(message)
    console.info("Forcing override of existing translation definition.")
    lib.add("HelloWorld", "Hallo $1!", "en", true)
    lib.add("HelloWorld", "Hallo $1!", "nl", true)
}

console.log(
    "Dutch translation, including the new placeholder:",
    lib.translate(
        "HelloWorld", // use the 'HelloWorld' translation
        "nl", // take the dutch version of it: 'Hallo $1!'
        lib.translate("World", "nl") // fetch 'nl' translation of 'World' (= 'Wereld') and replace $1 with it
    )
)

// Lets use the primary language instead of passing the language argument
// Set 'nl' as the new primary (default fallback) language
lib.PREFERRED_LANGUAGE = "nl"

// Btw, do you see that warning saying that the default translation with identifier 'Missing Translation Error' is missing a 'nl' translation?
// You should always try to keep all of your translations in sync!
// So, lets add it.
lib.add("Missing Translation Error", "Vertaling '$1' voor '$2' ontbreekt!", "nl")

console.log("Dutch translation derived from PREFERRED_LANGUAGE:",
    lib.translate(
        "HelloWorld",
        undefined, // omit language (falls back onto PREFERRED_LANGUAGE)
        lib.translate("World") // same here
    )
)
