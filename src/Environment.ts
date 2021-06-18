import { LoxRuntimeError } from "./ErrorHandler.js"
import Token from "./Token.js"

export default class Environment {

    parent: Environment | null = null
    values: Record<string, any> = {}

    constructor(parent: Environment | null = null) {
        this.parent = parent
    }

    define(name: string, value: any) {
        this.values[name] = value
    }

    assign(name: Token, value: any) {
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

    assignAt(depth: number, name: Token, value: any) {
        this.ancestors(depth).values[name.lexeme] = value
    }

    get(name: Token): any {
        let v = this.values[name.lexeme]
        if (v !== undefined) return v

        if (this.parent !== null) {
            return this.parent.get(name)
        }

        throw new LoxRuntimeError(name, `Undefined variable '${name.lexeme}'.`)
    }

    getAt(depth: number, name: Token): any {
        return this.ancestors(depth).values[name.lexeme]
    }

    ancestors(depth: number): Environment {
        let environment: Environment = this;

        for (let i = 0; i < depth; i++) {
            if (environment.parent !== null) {
                environment = environment.parent;
            } else {
                throw "Invalid local variable depth"
            }
        }

        return environment
    }
}