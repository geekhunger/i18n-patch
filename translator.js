import {assert, type} from "type-approve"
import {DICTIONARY, add} from "./dictionary.js"


try {
    add({
        ["Missing Translation Error"]: {
            en: "{Missing '$1' translation!}",
            de: "{Übersetzung '$1' fehlt!}",
            ru: "{Перевод '$1' не найден!}"
        }
    })
} catch(_) {
}


export const patch = function(text, ...substitutions) { // Substitute text placeholders with actual values
    assert(
        type({string: text, array: substitutions}),
        "Missing placeholder or substitution values!"
    )

    const searchquery = /(\$(\d+))/g
    const placeholders = text.match(searchquery) || []

    assert(
        placeholders.length !== substitutions.length,
        `Missmatch between placeholders (${placeholders.length}) and substitutions (${substitutions.length})!`
    )

    return text.replace(searchquery, (match, placeholder, id) => substitutions[id - 1] || placeholder) // replacement value or keep placeholder identifier
    /*
        For example, `patch("Welcome back, $1. There are $2 messages for you, $1.", "Eric", 2)`
        compiles into "Welcome back, Eric. There are 2 messages for you, Eric."
        See how `$1` got replaces multiple times with the first substitution argument? - Cool, eh?!
    */
}


export const translate = function(locale, identifier, ...substitutions) {
    assert(
        check({string: locale, language_alpha2: locale}),
        `Translation locale '${locale}' must be a two-letter lowercase 'ISO-639-1 Alpha2' language code!`
    )

    const translation = type({string: identifier}) && DICTIONARY.hasOwnProperty(identifier)
        ? DICTIONARY[identifier]
        : DICTIONARY["Missing Translation Error"]

    const text = translation.hasOwnProperty(locale) && type({string: translation[locale]})
        ? translation[locale]
        : patch(translation.en, locale)

    return patch(text, ...substitutions)
}
