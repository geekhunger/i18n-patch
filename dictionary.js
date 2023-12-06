/*
    Module for working with multilingual text and translation mappings.
    There are various helpers for filling out text templates with placeholder, build url paths that are fully multilingual or translate text snippets.
    For more information, inspect the `./translations.json` file.
*/

import {assert, type} from "type-approve"

export const DICTIONARY = {}

export const has = function(locale, identifier) { // check if dictionary contains a translation for given identifier and locale
    assert(type({object: DICTIONARY}), "Missing a dictionary object!")
    assert(type({strings: [locale, identifier]}), `Can't check dictionary for identifier '${identifier}' at locale '${locale}' because arguments are malformed!`)
    return (
        DICTIONARY.hasOwnProperty(identifier) &&
        DICTIONARY[identifier].hasOwnProperty(locale) &&
        type({string: DICTIONARY[identifier][locale]})
    )
}

export const add = function(locale, identifier, text) {
    assert(type({object: DICTIONARY}), "Missing a dictionary object!")
    if(type({nils: [identifier, text], object: locale})) {
        for(let [name, translations] of Object.entries(translations)) {
            for(let [language, translation] of Object.entries(value)) {
                add(language, name, translation) // recursive call (will also check for existing entries)
            }
        }
    } else {
        assert(!has(locale, identifier), `Translation with identifier '${identifier}' and locale '${locale}' already exists!`)
        assert(type({string: text}), `Can't extend dictionary for identifier '${identifier}' on locale '${locale}' with text '${text}' because of malformed values!`)
        DICTIONARY[identifier][locale] = text // save new entry
    }
}

export default {
    DICTIONARY,
    has,
    add
}
