import Polyglot from "../polyglot.js"
import {assert, type} from "type-approve"

let dict = new Polyglot()
let failure = false

try {
    // TODO
    assert(false, "LOL")
} catch({message}) {
    failure = message
}

export default failure