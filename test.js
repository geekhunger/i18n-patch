import test from "ava"
import {type, check, assert} from "type-approve"
import Polyglot from "./polyglot.js"

let dict = new Polyglot()

const CLASS_PROPERTIES = [
    ...Object.getOwnPropertyNames(dict), // proxied
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(dict)) // owned
]

const REQUIRED_PROPERTIES = {
    functions: [
        "constructor",
        "has",
        "add",
        "patch",
        "translate",
    ],
    getters: [
        // have only getters
        "INCOMPLETE_TRANSLATIONS",
        "AVAILABLE_LANGUAGES",
        "PARTLY_SUPPORTED_LANGUAGES",
        "FULLY_SUPPORTED_LANGUAGES",
        // have getters and setters (see other list)
        "DICTIONARY",
        "PREFERRED_LANGUAGE",
    ],
    setters: [
        // have only getters
        // <empty>
        // have getters and setters (see other list)
        "DICTIONARY",
        "PREFERRED_LANGUAGE",
    ],
    destructables: [ // properties that can be used like so: `const = {add, translate} = dict`
        "has",
        "add",
        "patch",
        "translate",
    ]
}


test.serial("Validate setup of unit test", t => {
    const unassigned = REQUIRED_PROPERTIES.destructables.filter(name => !REQUIRED_PROPERTIES.functions.includes(name))
    t.true(unassigned < 1, "Found properties that aren't a subset of 'REQUIRED_PROPERTIES.functions': " + JSON.stringify(unassigned))
})


test.serial("Validate required class properties", t => {
    const whitelist = [...new Set(Object.values(REQUIRED_PROPERTIES).flat())]
    const unknown = CLASS_PROPERTIES.filter(name => !whitelist.includes(name))
    t.is(unknown.length, 0, "Found untested and undocumented properties: " + JSON.stringify(unknown))
})


test.serial("Validate types of class properties", t => {
    const getPropertyDescriptor = name => Object.getOwnPropertyDescriptor(Object.getPrototypeOf(dict), name)
    const hasGetter = property => type({function: getPropertyDescriptor(property).get})
    const hasSetter = property => type({function: getPropertyDescriptor(property).set})

    for(let name of REQUIRED_PROPERTIES.functions) {
        t.true(type({function: dict[name]}), `Property '${name}' must be a function!`)
    }
    
    for(let name of REQUIRED_PROPERTIES.getters) {
        t.true(hasGetter(name), `Property '${name}' must have a getter!`)
    }

    for(let name of REQUIRED_PROPERTIES.setters) {
        t.true(hasSetter(name), `Property '${name}' must have a getter and setter!`)
    }
})


test.serial("Validate default values of class properties", t => {
    t.true(
        dict.AVAILABLE_LANGUAGES?.length >= 1,
        "There must be translations, hence there must be languages!"
    )
    t.true(
        dict.PARTLY_SUPPORTED_LANGUAGES?.length === 0 &&
        type({object: dict.INCOMPLETE_TRANSLATIONS}) &&
        Object.keys(dict.INCOMPLETE_TRANSLATIONS).length === 0 &&
        dict.FULLY_SUPPORTED_LANGUAGES?.length === dict.AVAILABLE_LANGUAGES?.length,
        "There must be no incomplete translations!"
    )
    t.true(
        dict.FULLY_SUPPORTED_LANGUAGES.includes(dict.PREFERRED_LANGUAGE),
        "All translations must support the primary language!"
    )
    t.true(
        type({object: dict.DICTIONARY}) &&
        dict.has("Missing Translation Error", dict.PREFERRED_LANGUAGE),
        "Mandatory dictionary entries must exist!"
    )
})


test("Destruct and unit-test class methods (incl. 'this' bindings)", t => {
    const mockup = { // test class properties with the fallowing datasets
        has: has => {
            t.true(
                type({function: has}),
                "Method must be a function!"
            ),
            t.regex( // translation should be longer
                t.throws(has.bind(this, "ab", "en"))?.message,
                /invalid translation identifier/i,
                "Translation ID must be invalid!"
            ),
            t.regex( // translation with illegal characters should be invalid
                t.throws(has.bind(this, "\n\t ", "en"))?.message,
                /invalid translation identifier/i,
                "Translation ID must be invalid!"
            ),
            t.notThrows( // translation with whitelisted characters should be valid
                has.bind(undefined, "123, Foo?-(Bar)_[B:A.Z]!", "en"),
                "Translation ID must be valid!"
            ),
            t.regex( // language code should be longer
                t.throws(has.bind(this, "abc", "a"))?.message,
                /invalid language code/i,
                "Language must be invalid!"
            ),
            t.regex( // language code should be shorter
                t.throws(has.bind(this, "abc", "abc"))?.message,
                /invalid language code/i,
                "Language must be invalid!"
            ),
            t.regex( // language code should be lowercase
                t.throws(has.bind(this, "abc", "AA"))?.message,
                /invalid language code/i,
                "Language must be invalid!"
            ),
            t.is( // translation should exists
                has("Missing Translation Error", dict.PREFERRED_LANGUAGE),
                true,
                "Translation must exist!"
            )
            t.is( // translation should not exist
                has("Foobar", "zz"),
                false,
                "Translation must not exist!"
            )
        },
        add: add => {
            t.true(
                type({function: add}),
                "Method must be a function!"
            )
            t.regex( // should fail creating translation with malformed content
                t.throws(add.bind(undefined, "Foobar", {foo: "bar"}, "en"))?.message,
                /malformed translation value/i,
                "Must fail because of malformed contents!"
            )
            t.is( // should be able to create new translation
                add("Foobar", "Hello World", "en"),
                "Hello World",
                "Must be able to create translation!"
            )
            t.regex( // should not be able to override existing translation
                t.throws(add.bind(undefined, "Foobar", "Hey", "en"))?.message,
                /conflicting translation/i,
                "Must conflict with existing translation!"
            ),
            t.is( // should be able to force-override existing translation
                add("Foobar", "Welcome", "en", true),
                "Welcome",
                "Must be able to override existing translation!"
            )
            t.notThrows(() => { // should not override the entire dictionary but work exactly as add()
                dict.DICTIONARY = {
                    "Foo": {de: "foo$1"},
                    "Bar": {es: "$1bar"},
                    "Baz": {fr: "$1baz"}
                }
                t.assert(
                    dict.has("Foo", "de") &&
                    dict.has("Bar", "es") &&
                    dict.has("Baz", "fr") &&
                    dict.has("Missing Translation Error", dict.PREFERRED_LANGUAGE), // this should still exist
                    "Should not override dictionary but add new entries!"
                )
            })
            t.regex( // should notify about language that is not present in all other translations
                t.throws(() => {
                    delete dict.DICTIONARY["Missing Translation Error"].en
                    add("Foobar", "ups", "en", /*bypass checks of 'has' method:*/ true)
                    /*
                        'Foo' translation exists and already has 'en' language
                        but somehow not every translation contains the 'en' language
                        (maybe through manual manipulation of dictionary),
                        thus we try to insert a translation with a language
                        that isn't yet fully supported by all available translations.
                    */
                })?.message,
                /reports other missing translations/i,
                "Must notify about missing translations for an yet unknown language!"
            )
        },
        patch: patch => {
            t.regex( // should error because of invalid value
                t.throws(patch.bind(undefined, null))?.message,
                /invalid value/i,
                "Missing value with placeholders!"
            )
            t.regex( // should error because of missing substitution
                t.throws(patch.bind(undefined, "Hello $1"))?.message,
                /missmatch between placeholders/i,
                "Missing substitution!"
            )
            t.regex( // should error because more placeholders than substitutions
                t.throws(patch.bind(undefined, "$1 $2", "Hello"))?.message,
                /missmatch between placeholders/i,
                "Must have enough substitution to match all placeholders!"
            )
            t.regex( // should error because placeholder starts with $0 (should start with $1)
                t.throws(patch.bind(undefined, "Hello $0", "World"))?.message,
                /must start with \$?1/i,
                "Placeholder count must start with 1!"
            )
            t.is( // should pass because values for substitution can be explicitly set to undefined or null
                patch("$1 $2", "Hello", undefined, "World"),
                "Hello $2",
                "Should allow to skip placeholders by passing undefined or null!"
            )
        },
        translate: translate => {
            t.is(
                translate("Foo", "de", "bar"),
                "foobar",
                "Existing translations should work!"
            )
            t.is(
                translate("Foobar", "de"),
                "Übersetzung 'de' für 'Missing Translation Error' fehlt!",
                "Missing translation should fallback onto default message but still use the given language!"
            )
            t.regex(
                t.throws(translate.bind(undefined, "Foo", "es"))?.message,
                /missing translations for '[a-z]{2,2}' on existing entries/i,
                "Existing translation is missing given language (and missing primary language too)!"
            )
        }
    }

    const untested = REQUIRED_PROPERTIES.destructables.filter(name => !Object.keys(mockup).includes(name))
    t.is(untested.length, 0, "Found untested properties: " + JSON.stringify(untested))

    const unknown = Object.keys(mockup).filter(name => !REQUIRED_PROPERTIES.destructables.includes(name))
    t.is(unknown.length, 0, "Found tests for unknown properties: " + JSON.stringify(untested))

    for(let name of REQUIRED_PROPERTIES.destructables) {
        const delegate = dict[name] // assign to variable, similar to conventional destructing operation `const {add} = dict`
        const validate = mockup[name] // unit test handler
        validate(delegate)
    }
})
