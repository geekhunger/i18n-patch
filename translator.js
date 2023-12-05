import {assert, type} from "type-approve"
import {DICTIONARY} from "./dictionary.js"


export const strip = function(value) { // string trimming that works well with urls
    assert(type({string: value}), "Can't trim a non-string value!")
    return value
        .toLowerCase()
        .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]+/g, "") // remove punctation (including unicode, excluding `\s`), for more information, see https://stackoverflow.com/questions/7576945/javascript-regular-expression-for-punctuation-international/7578937#7578937
        .trim() // remove leading and trailing whitespaces
        .replace(/\s+/g, "-") // replace inner whitespaces
}


export const patch = function(text, ...substitutions) { // Substitute text placeholders with actual values
    return text.replace(/(\$(\d+))/g, function(match, placeholder, id) {
        /*
            For example, `patch("Welcome back, $1. There are $2 messages for you, $1.", "Eric", 2)`
            compiles into "Welcome back, Eric. There are 2 messages for you, Eric."
            See how `$1` got replaces multiple times with the first substitution argument? - Cool, eh?!
        */
        return substitutions[id - 1] || placeholder // replacement value or keep placeholder identifier
    })
}


export const translate = function(locale, identifier, ...substitutions) {
    const translation = typeof identifier === "string" && DICTIONARY.hasOwnProperty(identifier)
        ? DICTIONARY[identifier]
        : DICTIONARY.missing_translation
    
    const text = translation.hasOwnProperty(locale)
        ? translation[locale]
        : patch(DICTIONARY.missing_locale.en, locale)

    return patch(text, ...substitutions)
}


export const slug = function(translation_identifier, with_param_name = true) {
    /*
        Generate multilingual route paths like `/:lang/?:welcome(hello|hallo|привет)?`
        Route handlers with conditional slugs like this, will respond to any :lang, for example, the above will match "/de/hallo", "/ru/привет" or "/de/привет", but also "/de/привет"!
        @translation_identifier (string) is the reference key to the translation inside the dictionary object and contains an object with localized values like `{"hello": {"en": "hello", "de": "hallo", "ru": "привет"}}`
    */

    assert(type({string: translation_identifier}), "Slug is missing identifier argument!")
    assert(translation_identifier === strip(translation_identifier), `Slug identifier '${translation_identifier}' is not allowed to include special characters!`)
    assert(DICTIONARY.hasOwnProperty(translation_identifier), `Dictionary is missing translations for identifier '${translation_identifier}'!`)
    
    return Object // fetch all translations of an identifier and compile them into one single RegExp string, to use as a path segment (slug) in a route handler
        .values(DICTIONARY[translation_identifier])
        .map(text => strip(text))
        .join("|") // {en: "hello", fr: "bon jour", de: "hallo", ru: "привет"} compiles into "hello|bon-jour|hallo|привет"
        .replace(/(.+)/, with_param_name === true ? `:i18n_${translation_identifier}($1)` : "$1") // add prefix and finish :param by wrapping the preceding RegExp into brackets
        /*
            IMPORTANT NOTE There's a bug in outdated version of path-to-regexp@0.1.7 which is still present in express@<=5.0.0-alpha.8
            (For more info, see https://github.com/pillarjs/path-to-regexp/issues/126)
            As of now, wrapping regex expressions like (hello|hey|hi) into another pair of brackets like ((hello|hey|hi)) is not possible!
            Instead, use named :params instead, e.g. :welcome(hello|hey|hi), where `welcome` is the translation identifier from the dictionary.
            (Validation of route path expressions can also be tested with http://forbeslindesay.github.io/express-route-tester)
        */
}
