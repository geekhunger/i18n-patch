/*
    Module for working with multilingual text and translation mappings.
    There are various helpers for filling out text templates with placeholder, build url paths that are fully multilingual or translate text snippets.
    For more information, inspect the `./translations.json` file.
*/

import {assert, type as check, add as type, validate} from "type-approve"

type("language_alpha2", "languages_alpha2", value => /^[a-z]{2,2}$/.test(value))
type("translation_id", value => /^[a-z-0-9\u0020\u00A0\(\)\[\]\?!\-\.,_:]{3,}$/ui.test(value.trim()))

export default class Polyglot {
    #dictionary = {}
    #preferred_language = undefined

    get DICTIONARY() {
        return this.#dictionary
    }

    set DICTIONARY(value) { // just a fancy gimmick `DICTIONARY = {"translation id": {"en": "text value"}}` is the same as `add({...})`
        return this.#addTranslation(value)
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

    #hasTranslation(identifier, language) {
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

    #addTranslation(identifier, translation, language, /*optional*/ override = false) {
        if(check({nils: [translation, language], object: identifier})) {
            for(let [new_identifier, new_dictionary] of Object.entries(identifier)) {
                for(let [new_language, new_translation] of Object.entries(new_dictionary)) {
                    this.#addTranslation(new_identifier, new_translation, new_language, override) // recursive call will check for existing entries
                }
            }
        } else {
            assert(
                override === true ||
                !this.#hasTranslation(identifier, language),
                `Conflicting translation with identifier '${identifier}' and language '${language}'!`
            )
            assert(
                check({string: translation}),
                `Malformed translation value ${JSON.stringify(translation)}!`
            )
            if(this.#hasTranslation(identifier, language) && !this.FULLY_SUPPORTED_LANGUAGES.includes(language)) { // reuse assert checks of has()
                assert(Object.values(this.#dictionary).every(translations => Object.keys(translations).includes(language)), [
                    "Explicit override of",
                    JSON.stringify({[identifier]: {[language]: this.#dictionary[identifier][language]}}),
                    `reports other missing translations for '${language}' on existing entries`,
                    JSON.stringify(this.#findIncompleteTranslations([language])) + "!"
                ].join(" "))
            }
            if(this.#dictionary.hasOwnProperty(identifier)) {
                assert(check({object: this.#dictionary[identifier]}), `Invalid translation object '${identifier}'!`)
            } else {
                this.#dictionary[identifier] = {}
            }
            this.#dictionary[identifier][language] = translation // save new entry
            return translation
        }
    }

    #patchText(value, /*optional*/ ...substitutions) { // substitute text placeholders with actual values
        assert(
            check({string: value, array: substitutions}),
            `Invalid value ${JSON.stringify(value)} for substitution!`
        )
        const searchquery = /(\$(\d+))/g
        const placeholders = [...new Set(value.match(searchquery))].sort()
        assert(
            placeholders.length < 1 ||
            placeholders.length <= substitutions.length &&
            placeholders.every(id => parseInt(id.slice(1)) > 0),
            `Missmatch between placeholders ${JSON.stringify(placeholders)} and substitutions ${JSON.stringify(substitutions)}! Numbering of placeholders must start with '$1'. Substitutions quantity must equal (or be larger) than the count of placeholders.`
        )
        return value.replace(searchquery, (match, placeholder, id) => substitutions[id - 1] || placeholder) // replace values or keep existing placeholder identifiers
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

    #patchTranslation(identifier, /*optional*/ language = this.PREFERRED_LANGUAGE, /*optional*/ ...substitutions) {
        try {
            assert(this.#hasTranslation(identifier, language), "Translation not found!")
            return this.patch(this.#dictionary[identifier][language], ...substitutions)
        } catch(_) {
            identifier = "Missing Translation Error"
            if(this.#hasTranslation(identifier, language)) {
                return this.patch(this.#dictionary[identifier][language], language, identifier)
            }
            assert(
                this.#hasTranslation(identifier, this.PREFERRED_LANGUAGE),
                `Missing translations for '${this.PREFERRED_LANGUAGE}' on existing entries ${JSON.stringify(this.#findIncompleteTranslations([language]))}!`
            )
            return this.patch(this.#dictionary[identifier][this.PREFERRED_LANGUAGE], language, identifier)
        }
    }

    #proxyPrivateProperty(private_name, public_name) { // a proxy to allow properties destruction of class(instances)
        const private_value = eval(`this.#${private_name.replace(/^#?/, "")}`) // a hack, because private properties can't be invoked dynamically by name, see https://stackoverflow.com/a/61197752/4383587
        Object.defineProperty(this, [public_name], {value: (...args) => private_value.apply(this, args)})
        /*
            Importing and working with classes like this one normally looks like this:
            ```
                import Polyglot from "i18n-patch"
                const translation = new Polyglot()
                translation.add({
                    "my custom translation": {
                        en: "hello world",
                        de: "hallo welt"
                    }
                })
                console.log(translation.DICTIONARY)
                console.log(translation.PREFERRED_LANGUAGE)
                console.log(translation.print("my custom translation", translation.PREFERRED_LANGUAGE))
                console.log(translation.print("my custom translation", "de"))
            ```
            Notice how we need to access our class properties with `translation.`
            Would't it be nice if we could destruct the class properties like so?
            `const {DICTIONARY, PREFERRED_LANGUAGE, add} = translation`
            Unfortunately this does only work for getter/setter properties like 'DICTIONARY'!
            Class methods would loose their `this` binding and throw an error.
            But we can also not define class methods as getters/setters because they are functions!
            To solve this, we need some kind of a proxy to bind `this` context.
            The fallowing is such a proxy.
            Now you can destruct properties of your class instance and use like so:
            ```
                import Polyglot from "i18n-patch"
                const translation = new Polyglot()
                const {DICTIONARY, PREFERRED_LANGUAGE, add} = translation
                add({
                    "my custom translation": {
                        en: "hello world",
                        de: "hallo welt"
                    }
                })
                console.log(DICTIONARY)
                console.log(PREFERRED_LANGUAGE)
            ```
        */
    }

    constructor() {
        assert(this instanceof Polyglot, "Failed sub-classing a class instance!")
        this.#proxyPrivateProperty("hasTranslation", "has")
        this.#proxyPrivateProperty("addTranslation", "add")
        this.#proxyPrivateProperty("patchText", "patch")
        this.#proxyPrivateProperty("patchTranslation", "translate")
        this.#addTranslation({
            ["Missing Translation Error"]: {
                en: "Translation '$1' for '$2' missing!",
                de: "Übersetzung '$1' für '$2' fehlt!",
                ru: "Перевод '$1' для '$2' отсутствует!"
            }
        })
        this.PREFERRED_LANGUAGE = "en"
        return this
    }
}
