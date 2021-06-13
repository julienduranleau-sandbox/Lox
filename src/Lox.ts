import AstPrinter from './AstPrinter.js'
import ErrorHandler from './ErrorHandler.js'
import Interpreter from './Interpreter.js'
import Parser from './Parser.js'
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
        // === Tokens
        let scanner = new Scanner(source, this.errorHandler)
        let tokens = scanner.scanTokens()
        // for (let token of tokens) console.log(token.toString())


        // === Create AST
        let parser = new Parser(tokens, this.errorHandler)
        let statements = parser.parse()

        if (this.errorHandler.hadError) {
            console.warn("Lox had a parsing error")
        }

        if (this.errorHandler.hadError) return

        // === Print AST
        let astDebug = new AstPrinter().print(statements)
        console.log(astDebug)


        // === Interpreting
        let interpreterOutput = new Interpreter().interpret(statements, this.errorHandler)
        console.log("> " + interpreterOutput)

        if (this.errorHandler.hadRuntimeError) {
            console.warn("Lox had a runtime error")
        }
    }
}