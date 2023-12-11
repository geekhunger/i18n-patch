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


test.serial("Validate test setup of the unit", t => {
    const unassigned = REQUIRED_PROPERTIES.destructables.filter(name => !REQUIRED_PROPERTIES.functions.includes(name))
    t.true(unassigned < 1, "Found properties that aren't a subset of 'REQUIRED_PROPERTIES.functions': " + JSON.stringify(unassigned))
})


test.serial("Class contains required properties", t => {
    const whitelist = [...new Set(Object.values(REQUIRED_PROPERTIES).flat())]
    const unknown = CLASS_PROPERTIES.filter(name => !whitelist.includes(name))
    t.is(unknown.length, 0, "Found untested and undocumented properties: " + JSON.stringify(unknown))
})


test.serial("Class properties have sane types", t => {
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


test.serial.todo("Class properties have sane default values")


test("Can destruct and execute class methods ('this' bindings, unit tests)", t => {
    const mockup = { // test class properties with the fallowing datasets
        has: [
            has => t.true(
                type({function: has}),
                "Method must be a function!"
            ),
            has => t.regex( // translation should be longer
                t.throws(has.bind(this, "ab", "en"))?.message,
                /invalid translation identifier/i,
                "Translation ID must be invalid!"
            ),
            has => t.regex( // translation with illegal characters should be invalid
                t.throws(has.bind(this, "\n\t ", "en"))?.message,
                /invalid translation identifier/i,
                "Translation ID must be invalid!"
            ),
            has => t.notThrows( // translation with whitelisted characters should be valid
                has.bind(undefined, "123, Foo?-(Bar)_[B:A.Z]!", "en"),
                "Translation ID must be valid!"
            ),
            has => t.regex( // language code should be longer
                t.throws(has.bind(this, "abc", "a"))?.message,
                /invalid language code/i,
                "Language must be invalid!"
            ),
            has => t.regex( // language code should be shorter
                t.throws(has.bind(this, "abc", "abc"))?.message,
                /invalid language code/i,
                "Language must be invalid!"
            ),
            has => t.regex( // language code should be lowercase
                t.throws(has.bind(this, "abc", "AA"))?.message,
                /invalid language code/i,
                "Language must be invalid!"
            ),
            has => t.is( // translation should exists
                has("Missing Translation Error", dict.PREFERRED_LANGUAGE),
                true,
                "Translation must exist!"
            ),
            has => t.is( // translation should not exist
                has("Foobar", "zz"),
                false,
                "Translation must not exist!"
            ),
        ],
        add: [
            add => t.true(
                type({function: add}),
                "Method must be a function!"
            ),
            add => t.regex( // should fail creating translation with malformed content
                t.throws(add.bind(undefined, "Foobar", {foo: "bar"}, "en"))?.message,
                /malformed translation value/i,
                "Must fail because of malformed contents!"
            ),
            add => t.is( // should be able to create new translation
                add("Foobar", "Hello World", "en"),
                "Hello World",
                "Must be able to create translation!"
            ),
            add => t.regex( // should not be able to override existing translation
                t.throws(add.bind(undefined, "Foobar", "Hey", "en"))?.message,
                /conflicting translation/i,
                "Must conflict with existing translation!"
            ),
            add => t.is( // should be able to force-override existing translation
                add("Foobar", "Welcome", "en", true),
                "Welcome",
                "Must be able to override existing translation!"
            ),
            add => t.notThrows(() => { // should not override the entire dictionary but work exactly as add()
                dict.DICTIONARY = {
                    "Foo": {de: "foo"},
                    "Bar": {es: "bar"},
                    "Baz": {fr: "baz"}
                }
                t.assert(
                    dict.has("Foo", "de") &&
                    dict.has("Bar", "es") &&
                    dict.has("Baz", "fr") &&
                    dict.has("Missing Translation Error", dict.PREFERRED_LANGUAGE), // this should still exist
                    "Should not override dictionary but add new entries!"
                )
            }),
            add => t.regex( // should notify about language that is not present in all other translations
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
            ),
        ],
        patch: [
        ],
        translate: [
        ]
    }

    const untested = REQUIRED_PROPERTIES.destructables.filter(name => !Object.keys(mockup).includes(name))
    t.is(untested.length, 0, "Found untested properties: " + JSON.stringify(untested))

    const unknown = Object.keys(mockup).filter(name => !REQUIRED_PROPERTIES.destructables.includes(name))
    t.is(unknown.length, 0, "Found tests for unknown properties: " + JSON.stringify(untested))

    for(let name of REQUIRED_PROPERTIES.destructables) {
        const delegate = dict[name] // assign to variable, similar to conventional destructing operation like `const {add} = dict`
        for(let validate of mockup[name]) {
            validate(delegate)
        }
    }
})
