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
        await fetch(url).then(r => r.text()).then(this.run)

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
        console.log("=== Tokens ===")
        let scanner = new Scanner(source, this.errorHandler)
        let tokens = scanner.scanTokens()
        // for (let token of tokens) console.log(token.toString())


        console.log("=== Create AST ===")
        let parser = new Parser(tokens, this.errorHandler)
        let expression = parser.parse()

        if (this.errorHandler.hadError) return

        console.log("=== Print AST ===")
        let astDebug = new AstPrinter().print(expression)
        console.log(astDebug)


        console.log("=== Interpreting ===")
        let interpreterOutput = new Interpreter().interpret(expression, this.errorHandler)
        console.log(interpreterOutput)
    }
}