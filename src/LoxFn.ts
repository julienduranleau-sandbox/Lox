import Callable from "./Callable.js";
import Environment from "./Environment.js";
import Interpreter from "./Interpreter.js";
import { Fn } from "./Stmt.js";

export default class LoxFn implements Callable {
    declaration: Fn

    constructor(declaration: Fn) {
        this.declaration = declaration
    }

    arity(): number {
        return this.declaration.params.length
    }

    call(interpreter: Interpreter, args: any[]) {
        let environment = new Environment(interpreter.globals)

        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, args[i])
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment)
        } catch (returnValue) {
            return returnValue
        }
        return null
    }

    toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`
    }
}