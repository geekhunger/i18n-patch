// This ExpressJS middleware will try to parse the client's prefered language.

import clientlang from "accept-language-parser"
import identity from "../auth/identity.js"
import {type} from "../../lib/util/type.js"


export default async function(req, res, nxt) {
    if(req.app.get("supported languages")?.includes(req.lang?.selected)) { // language already parsed
        return nxt()
    }

    req.lang = Object.create(null)
    req.lang.supported = req.app.get("supported languages") || []
    req.lang.preferred = req.app.get("preferred language") // preferred by application, not the client ;D
    req.lang.selected = req.lang.preferred // use application's preferred language as a fallback

    // the prefered language of the client will be obtained from the most-significant to the least-segnificant source...

    if(type({object: req.headers}) && type({string: req.get("authorization")})) {
        try {
            const {session} = await identity(req)
            if(req.lang.supported.includes(session?.language)) {
                req.lang.selected = session.language
                return nxt()
            }
        } catch(failure) {
            // siliently continue trying other sources...
        }
    }

    if(req.lang.supported.includes(req.params.lang)) { // extract language from requested url path, e.g. /en/profile/settings (note the required :lang param name!)
        req.lang.selected = req.params.lang
        return nxt()
    }

    if(req.lang.supported.includes(req.query.lang)) { // extract language from requested url query-string, e.g. /profile/settings?lang=en
        req.lang.selected = req.query.lang
        return nxt()
    }
    
    if(type({string: req.header("accept-language")})) { // adopt language that is accepted by the client (e.g. browser)
        const langcode = clientlang.pick(
            req.lang.supported,
            req.header("accept-language"),
            {loose: true} // NOTE: locales usually include language and country, e.g. 'ru-RU'; the 'loose' option allows to match parts of it, e.g. 'ru'
        )
        if(type({string: langcode})) {
            req.lang.selected = langcode
            return nxt()
        }
    }

    nxt()
}
