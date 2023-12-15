# Readme

## Intro

This package helps working with multilingual text snippets and translation mappings.

## Example

```js
import Polyglot from "i18n-patch"

let library = new Polyglot()
const {has, add, patch, translate} = library // shotcuts for library.has, library.add, library.patch, library.translate

console.log(patch("Hello $1, how are you today?", "Eric")) // plain-text usage

console.log(has("Hello World Page Message", "en")) // translation doesn't exist yet

add("Hello World Page Message", "Hello $1, this is a 'Hello World' page.", "en") // add english translation
add("Hello World Page Message", "Hallo $1, das ist eine 'Hallo Welt' Seite.", "de") // add german translation

console.log(translate("Hello World Page Message", "en", "Eric")) // translated text usage

console.log(translate("Hello World Page Message", library.PREFERRED_LANGUAGE, "Eric")) // try using primary language (exactly same result as previous line because primary language is "en" by default)

console.log(library.DICTIONARY) // check dictionary contents
console.log(library.PREFERRED_LANGUAGE) // check primary language

//library.PREFERRED_LANGUAGE = "es" // NOTE: this will fail because there are default translations that lack the "es" translation

add("Missing Translation Error", "¡Traducción '$1' por '$2' faltante!", "es") // add missing spanish translation for existing dictionary entries
add("Hello World Page Message", "Hola $1, esta es una página de 'Hola Mundo'.", "es") // add spanish translation to our new translation too

library.PREFERRED_LANGUAGE = "es" // now reset the primary language (success)

console.log(translate("Hello World Page Message", undefined, "Eric")) // setting language to 'undefined' is exactly the same as using PREFERRED_LANGUAGE (as shown in example above), this time the translated test is spanish, because we changed the primary language
```

## Class properties

- **`DICTIONARY`** an object containing all of the translations
- **`INCOMPLETE_TRANSLATIONS`** list of missing translations (keys are translation identifiers and values are lists of missing 'spoken' languages for that particular translation)
- **`AVAILABLE_LANGUAGES`** languages that were found from the available translations of the `DICTIONARY` (this list is the *super*set of `PARTLY_SUPPORTED_LANGUAGES` and `FULLY_SUPPORTED_LANGUAGES`)
- **`PARTLY_SUPPORTED_LANGUAGES`** if all translations don't have the same 'spoken' langugages then this list will contain the ones that aren't common across all of the available translations (the list is a *sub*set of `AVAILABLE_LANGUAGES`)
- **`FULLY_SUPPORTED_LANGUAGES`** this list contains languages that are 'spoken' by all of the available translations (the list is a *sub*set of `AVAILABLE_LANGUAGES`)
- **`PREFERRED_LANGUAGE`** default is `'en'`

## Class methods

- **`patch(text, ...substitutions)`** takes any text and substitutes its placesholders with actual values
- **`translate(identifier, language, ...substitutions)`** takes an identifier to an existing translation, fetches its text and then runs `patch` over it to replace placeholders with values
- **`has(identifier, language)`** checks if a given translation exists for a particular language
- **`add(identifier, text, language, override = false)`** adds a new translation with for given language (if a translation exists, you may use `override = true` to forcefully override it)
