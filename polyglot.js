/*
    Module for working with multilingual text and translation mappings.
    There are various helpers for filling out text templates with placeholder, build url paths that are fully multilingual or translate text snippets.
    For more information, inspect the `./translations.json` file.
*/

import {assert, type as check, add as type, validate} from "type-approve"

type("language_alpha2", "languages_alpha2", value => /^[a-z]{2,2}$/.test(value))
type("translation_id", value => /\w{3,}/i.test(value))

export const Polyglot = class {
    #dictionary = {}
    #preferred_language = undefined

    get DICTIONARY() {
        return this.#dictionary
    }

    set DICTIONARY(value) {
        return this.add(value)
    }

    #findIncompleteTranslations(languages) { // get an object of identifiers with a list of missing languages
        assert(
            check({array: languages}) &&
            languages.every(validate("language_alpha2")),
            `Malformed list of languages ${JSON.stringify(languages)}!`
        )
        return Object.assign(
            {}, // fallback value
            ...Object // unpack array of objects
            .entries(this.#dictionary)
            .map(([identifier, entries]) => {
                const translations = Object.keys(entries)
                const list = languages.filter(lang => !translations.includes(lang))
                if(list.length > 0) {
                    return {[identifier]: list}
                }
                return null
            })
            .filter(Boolean)
        )
    }

    get INCOMPLETE_TRANSLATIONS() { // read-only
        return this.#findIncompleteTranslations(this.AVAILABLE_LANGUAGES)
    }

    get AVAILABLE_LANGUAGES() { // read-only
        return [...new Set(
            Object
            .values(this.#dictionary)
            .map(Object.keys)
            .flat()
        )]
    }

    get PARTLY_SUPPORTED_LANGUAGES() { // read-only
        const translations = Object.values(this.#dictionary).map(Object.keys)
        const languages = [...new Set(translations.flat())]
        return languages.filter(lang => translations.some(list => !list.includes(lang)))
    }

    get FULLY_SUPPORTED_LANGUAGES() { // read-only
        const translations = Object.values(this.#dictionary).map(Object.keys)
        const languages = [...new Set(translations.flat())]
        return languages.filter(lang => translations.every(list => list.includes(lang)))
    }

    get PREFERRED_LANGUAGE() {
        if(!this.AVAILABLE_LANGUAGES.includes(this.#preferred_language)) {
            return undefined
        }
        return this.#preferred_language
    }

    set PREFERRED_LANGUAGE(value) {
        assert(check({language_alpha2: value}), `Invalid language code '${value}'!`)
        assert(check(this.FULLY_SUPPORTED_LANGUAGES.includes(value)), `Missing translations for '${value}' on existing entries ${JSON.stringify(this.#findIncompleteTranslations([value]))}!`)
        this.#preferred_language = value
        return value
    }

    has(language, identifier) {
        assert(check({object: this.#dictionary}), "Missing dictionary object!")
        assert(check({language_alpha2: language}), `Invalid language code '${language}'!`)
        assert(check({translation_id: identifier}), `Invalid translation identifier '${identifier}'!`)
        return (
            this.#dictionary.hasOwnProperty(identifier) &&
            this.#dictionary[identifier].hasOwnProperty(language) &&
            check({string: this.#dictionary[identifier][language]})
        )
    }

    add(language, identifier, translation, override = false) {
        if(check({nils: [identifier, translation], object: language})) {
            for(let [new_identifier, new_dictionary] of Object.entries(language)) {
                for(let [new_language, new_translation] of Object.entries(new_dictionary)) {
                    this.add(new_language, new_identifier, new_translation, override) // NOTE: This recursive call will check for existing entries too.
                }
            }
        } else {
            assert(
                override === true ||
                !this.has(language, identifier),
                `Conflicting translation with identifier '${identifier}' and language '${language}'!`
            )
            assert(
                check({string: translation}),
                `Malformed translation value ${JSON.stringify(translation)}!`
            )
            if(this.has(language, identifier) && !this.FULLY_SUPPORTED_LANGUAGES.includes(language)) { // reuse some assert checks of has()
                assert(Object.values(this.#dictionary).every(translations => Object.keys(translations).includes(language)), [
                    "Explicit override of",
                    JSON.stringify({[identifier]: {[language]: this.#dictionary[identifier][language]}}),
                    `reports other missing translations for '${language}' on existing entries`,
                    JSON.stringify(this.#findIncompleteTranslations([language])),
                    "!"
                ].join(" "))
            }
            if(!this.#dictionary.hasOwnProperty(identifier)) {
                this.#dictionary[identifier] = {}
            }
            this.#dictionary[identifier][language] = translation // save new entry
            return translation
        }
    }

    patch(text, ...substitutions) { // substitute text placeholders with actual values
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
        return text.replace(searchquery, (match, placeholder, id) => substitutions[id - 1] || placeholder) // replace values or keep existing placeholder identifiers
        /*
            For example, `patch("Welcome back, $1. There are $2 messages for you, $1.", "Eric", 2)`
            compiles into "Welcome back, Eric. There are 2 messages for you, Eric."
            See how `$1` got replaces multiple times with the first substitution argument? - Cool, eh?!
        */
    }

    translate(locale, identifier, ...substitutions) {
        assert(
            check({object: this.#dictionary}),
            "Missing dictionary object!"
        )
        assert(
            check({language_alpha2: locale}),
            `Invalid language code '${language}'!`
        )
        const translation = type({translation_id: identifier}) && this.#dictionary.hasOwnProperty(identifier)
            ? this.#dictionary[identifier]
            : this.#dictionary["Missing Translation Error"]
        const text = translation.hasOwnProperty(locale) && type({string: translation[locale]})
            ? translation[locale]
            : patch(translation.en, locale)
        return patch(text, ...substitutions)
    }

    constructor() {
        this.add({
            ["Missing Translation Error"]: {
                en: "{Missing '$1' translation!}",
                de: "{Übersetzung '$1' fehlt!}",
                ru: "{Перевод '$1' не найден!}"
            }
        })
        this.PREFERRED_LANGUAGE = "en"
    }
}

export default Polyglot
