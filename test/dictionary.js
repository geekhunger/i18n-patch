import Polyglot from "../polyglot.js"
import {assert} from "type-approve"

let dict = new Polyglot()
let failure = false

try {
    // TODO
} catch({message}) {
    failure = message
}

export default failure