import AstPrinter from './AstPrinter.js'
import ErrorHandler from './ErrorHandler.js'
import Interpreter from './Interpreter.js'
import Parser from './Parser.js'
import Resolver from './Resolver.js'
import Scanner from './Scanner.js'

export default class Lox {

    errorHandler: ErrorHandler = new ErrorHandler()

    constructor() {

    }

    async runFile(url: string) {
        await fetch(url).then(r => r.text()).then(this.run.bind(this))

        if (this.errorHandler.hadError) {
            console.log("Exited with errors")
        }
    }

    runPrompt() {
        let line = ""
        this.run(line)
        this.errorHandler.hadError = false
    }

    run(source: string) {
        const scanner = new Scanner(source, this.errorHandler)
        const parser = new Parser(this.errorHandler)
        const interpreter = new Interpreter()
        const resolver = new Resolver(interpreter, this.errorHandler)

        // === Tokens
        let tokens = scanner.scanTokens()

        // === Create AST
        let statements = parser.parse(tokens)

        // === Print AST
        let astDebug = new AstPrinter().prettyPrint(statements)
        console.log(astDebug)

        // === Check for valid AST to continue
        if (this.errorHandler.hadError) {
            console.warn("Lox had a parsing error")
            return
        }

        // === Resolver
        resolver.resolve(statements)

        // === Check for valid Resolution to continue
        if (this.errorHandler.hadError) {
            console.warn("Lox had a resolution error")
            return
        }

        // === Interpreting
        interpreter.interpret(statements, this.errorHandler)

        if (this.errorHandler.hadRuntimeError) {
            console.warn("Lox had a runtime error")
        }
    }
}