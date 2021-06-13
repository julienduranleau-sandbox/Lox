import { LoxRuntimeError } from "./ErrorHandler.js"
import Token from "./Token.js"

export default class Environment {

    parent: Environment | null = null
    values: Record<string, any> = {}

    constructor(parent: Environment | null = null) {
        this.parent = parent
    }

    define(name: string, value: any): void {
        this.values[name] = value
    }

    assign(name: Token, value: any): void {
        if (this.values[name.lexeme] !== undefined) {
            this.values[name.lexeme] = value
            return
        }

        if (this.parent !== null) {
            this.parent.assign(name, value)
            return
        }

        throw new LoxRuntimeError(name, `Undefined variable '${name.lexeme}'.`)
    }

    get(name: Token): any {
        let v = this.values[name.lexeme]
        if (v !== undefined) return v

        if (this.parent !== null) {
            return this.parent.get(name)
        }

        throw new LoxRuntimeError(name, `Undefined variable '${name.lexeme}'.`)
    }
}