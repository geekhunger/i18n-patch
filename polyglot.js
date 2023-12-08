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

    has(identifier, language) {
        assert(check({object: this.#dictionary}), "Missing dictionary object!")
        assert(check({language_alpha2: language}), `Invalid language code '${language}'!`)
        assert(check({translation_id: identifier}), `Invalid translation identifier '${identifier}'!`)
        return (
            this.#dictionary.hasOwnProperty(identifier) &&
            check({object: this.#dictionary[identifier]}) &&
            this.#dictionary[identifier].hasOwnProperty(language) &&
            check({string: this.#dictionary[identifier][language]})
        )
    }

    add(identifier, translation, language, override = false) {
        if(check({nils: [translation, language], object: identifier})) {
            for(let [new_identifier, new_dictionary] of Object.entries(identifier)) {
                for(let [new_language, new_translation] of Object.entries(new_dictionary)) {
                    this.add(new_identifier, new_translation, new_language, override) // recursive call will check for existing entries
                }
            }
        } else {
            assert(
                override === true ||
                !this.has(identifier, language),
                `Conflicting translation with identifier '${identifier}' and language '${language}'!`
            )
            assert(
                check({string: translation}),
                `Malformed translation value ${JSON.stringify(translation)}!`
            )
            if(this.has(identifier, language) && !this.FULLY_SUPPORTED_LANGUAGES.includes(language)) { // reuse assert checks of has()
                assert(Object.values(this.#dictionary).every(translations => Object.keys(translations).includes(language)), [
                    "Explicit override of",
                    JSON.stringify({[identifier]: {[language]: this.#dictionary[identifier][language]}}),
                    `reports other missing translations for '${language}' on existing entries`,
                    JSON.stringify(this.#findIncompleteTranslations([language])) + "!"
                ].join(" "))
            }
            if(this.#dictionary.hasOwnProperty(identifier)) {
                assert(check({object: this.#dictionary[identifier]}), `Invalid translations object '${identifier}'!`)
            } else {
                this.#dictionary[identifier] = {}
            }
            this.#dictionary[identifier][language] = translation // save new entry
            return translation
        }
    }

    patch(text, ...substitutions) { // substitute text placeholders with actual values
        assert(
            check({string: text, array: substitutions}),
            `Invalid value ${JSON.stringify(text)} for substitution!`
        )
        const searchquery = /(\$(\d+))/g
        const placeholders = [...new Set(text.match(searchquery))].sort()
        assert(
            placeholders.length < 1 ||
            placeholders.length <= substitutions.length &&
            placeholders.every(id => parseInt(id.slice(1)) > 0),
            `Missmatch between placeholders ${JSON.stringify(placeholders)} and substitutions ${JSON.stringify(substitutions)}! Numbering of placeholders must start with '$1'. Substitutions quantity must equal (or be larger) than the count of placeholders.`
        )
        return text.replace(searchquery, (match, placeholder, id) => substitutions[id - 1] || placeholder) // replace values or keep existing placeholder identifiers
        /*
            An interesting coincidence is that you could nest `patch` requests.
            `const value = patch("Hello, $1 are you feeling $2?", "Alex")` will compile into "Hello, Alex are you feeling $2?"
            See how the second placeholder remained untouched?
            Another `patch(value, undefined, "good")` will finally compile into "Hello, Alex are you feeling good?"
            As you can tell, you can set some substitutions purposely to `undefined` and therefore skip their replacement
            in order to proccess the compilation over multiple steps.

            Another fun fact is `patch("Welcome back, $1. There are $2 messages for you, $1.", "Eric", 2)`
            which will compiles into "Welcome back, Eric. There are 2 messages for you, Eric."
            See how all occurrences of `$1` got replaced with the same value from the first substitution in the list?
            Cool, eh?! ;)
        */
    }

    put(identifier, language, ...substitutions) {
        try {
            assert(this.has(identifier, language), "Translation not found!")
            return this.patch(this.#dictionary[identifier][language], ...substitutions)
        } catch(_) {
            identifier = "Missing Translation Error"
            if(this.has(identifier, language)) {
                return this.patch(this.#dictionary[identifier][language], language, identifier)
            }
            assert(
                this.has(identifier, this.PREFERRED_LANGUAGE),
                `Missing translations for '${this.PREFERRED_LANGUAGE}' on existing entries ${JSON.stringify(this.#findIncompleteTranslations([language]))}!`
            )
            return this.patch(this.#dictionary[identifier][this.PREFERRED_LANGUAGE], language, identifier)
        }
    }

    constructor() {
        this.add({
            ["Missing Translation Error"]: {
                en: "Translation '$1' for '$2' missing!",
                de: "Übersetzung '$1' für '$2' fehlt!",
                ru: "Перевод '$1' для '$2' отсутствует!"
            }
        })
        this.PREFERRED_LANGUAGE = "en"
    }
}

export default new Polyglot() // default shared namespace
