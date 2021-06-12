import Token from "./Token.js"

export class LoxRuntimeError {
    constructor(public token: Token, public message: string) { }
}

export default class ErrorHandler {
    hadError: boolean = false
    hadRuntimeError: boolean = false

    constructor() {

    }

    error(line: number, message: string) {
        this.report(line, "", message)
    }

    runtimeError(error: LoxRuntimeError) {
        console.error(`${error.message}\n[Line ${error.token.line}]`)
        this.hadRuntimeError = true
    }

    report(line: number, where: string, message: string) {
        console.error(`[Line ${line}] Error ${where}: ${message}`)
        this.hadError = true
    }
}