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
    const translation = type({string: identifier}) && DICTIONARY.hasOwnProperty(identifier)
        ? DICTIONARY[identifier]
        : DICTIONARY.missing_translation
    
    const text = translation.hasOwnProperty(locale)
        ? translation[locale]
        : patch(DICTIONARY.missing_locale.en, locale)

    return patch(text, ...substitutions)
}
