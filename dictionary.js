/*
    Module for working with multilingual text and translation mappings.
    There are various helpers for filling out text templates with placeholder, build url paths that are fully multilingual or translate text snippets.
    For more information, inspect the `./translations.json` file.
*/

import {assert, check, add as type} from "type-approve"

type("language_alpha2", "languages_alpha2", value => /^[a-z]{2,2}$/.test(value))

export const DICTIONARY = {}

export const has = function(locale, identifier) { // check if dictionary contains a translation for given identifier and locale
    assert(check({object: DICTIONARY}), "Missing a dictionary object!")
    assert(check({strings: [locale, identifier], language_alpha2: locale}), `Can't check dictionary with identifier '${identifier}' and locale '${locale}' because of malformed values!`)
    return (
        DICTIONARY.hasOwnProperty(identifier) &&
        DICTIONARY[identifier].hasOwnProperty(locale) &&
        check({string: DICTIONARY[identifier][locale]})
    )
}

export const add = function(locale, identifier, text, override = false) {
    assert(check({object: DICTIONARY}), "Missing a dictionary object!")
    if(check({nils: [identifier, text], object: locale})) {
        for(let [name, translations] of Object.entries(translations)) {
            for(let [language, translation] of Object.entries(value)) {
                add(language, name, translation) // recursive call (will also check for existing entries)
            }
        }
    } else {
        assert(override === true || !has(locale, identifier), `Dictionary entry with identifier '${identifier}' and locale '${locale}' already exists!`)
        assert(check({string: text}), `Can't extend dictionary for identifier '${identifier}' on locale '${locale}' with text '${text}' because of malformed values!`)
        DICTIONARY[identifier][locale] = text // save new entry
    }
}

export default {
    DICTIONARY,
    has,
    add
}
