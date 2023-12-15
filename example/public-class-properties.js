import Polyglot from "../polyglot.js"

const dict = new Polyglot()

console.log("Public class properties:", [
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(dict)), // proxied class properties
    ...Object.getOwnPropertyNames(dict) // owned class instance properties
])
