import Polyglot from "../polyglot.js"

const lib = new Polyglot()
const {patch} = lib

// single use
console.log(
    patch(
        "Hello, my name is $1 and I'm feeling $3 today!", // text
        "Sam", // $1 placeholder value
        undefined, // $2 placeholder value (just showcasing, text above does not even use it)
        "great" // $3 placeholder value
    )
)

// nested use
console.log(
    patch( // then, use the text from the first compilation and pipe it though another run
        patch( // first, compile this! (nested)
            "Hello, my name is $1 and I'm feeling $2 today!",
            "Eric",
            undefined // explicitly skip substitution of $2 placeholder
        ),
        undefined, // value for $1 (which was already filled out by the above compilation)
        "awesome" // $2 placeholder value
    )
)
