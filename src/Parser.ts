import ErrorHandler from "./ErrorHandler.js";
import { Assign, Binary, Call, Expr, Grouping, Literal, Logical, Unary, Variable } from "./Expr.js";
import { Block, Expression, Fn, If, Print, Return, Stmt, Var, While } from "./Stmt.js";
import Token from "./Token.js";
import TokenType from "./TokenType.js";

export default class Parser {
    tokens: Token[] = []
    current: number = 0
    errorHandler: ErrorHandler

    constructor(errorHandler: ErrorHandler) {
        this.errorHandler = errorHandler
    }

    parse(tokens: Token[]): Stmt[] {
        this.tokens = tokens

        let statements: Stmt[] = []
        while (!this.isAtEnd()) {
            let stmt: Stmt | null = this.declaration()
            if (stmt !== null) {
                statements.push(stmt)
            }
        }

        return statements
    }

    declaration(): Stmt | null {
        try {
            if (this.match(TokenType.VAR)) {
                return this.varDeclaration()
            }

            return this.statement()
        } catch (error) {
            this.synchronize()
            return null
        }
    }

    statement(): Stmt {
        if (this.match(TokenType.PRINT)) return this.printStatement()
        if (this.match(TokenType.LEFT_BRACE)) return new Block(this.block())
        if (this.match(TokenType.IF)) return this.ifStatement()
        if (this.match(TokenType.WHILE)) return this.whileStatement()
        if (this.match(TokenType.FOR)) return this.forStatement()
        if (this.match(TokenType.FUN)) return this.functionStatement("function")
        if (this.match(TokenType.RETURN)) return this.returnStatement()

        return this.expressionStatement()
    }

    returnStatement(): Stmt {
        let keyword = this.previous()
        let value: Expr | null = null

        if (!this.check(TokenType.SEMICOLON)) {
            value = this.expression()
        }

        this.consume(TokenType.SEMICOLON, `Expect ';' after return value.`)
        return new Return(keyword, value)
    }

    functionStatement(type: string): Stmt {
        let name = this.consume(TokenType.IDENTIFIER, `Expect ${type} name`)
        this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${type} name.`)

        let params: Token[] = []

        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                params.push(this.consume(TokenType.IDENTIFIER, `Expect paramter name`))
            } while (this.match(TokenType.COMMA))
        }

        this.consume(TokenType.RIGHT_PAREN, `Expect ')' after ${type} parameters.`)
        this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${type} body.`)

        let body = this.block()

        return new Fn(name, params, body)
    }

    forStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.")

        // for ( ______; ; )
        let initializer: Stmt | null = null

        if (this.match(TokenType.SEMICOLON)) {
            initializer = null
        } else if (this.match(TokenType.VAR)) {
            initializer = this.varDeclaration()
        } else {
            initializer = this.expressionStatement()
        }

        // for ( ;______; )
        let condition: Expr | null = null
        if (this.check(TokenType.SEMICOLON) == false) {
            condition = this.expression()
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after for loop condition.")

        // for ( ; ;______ )
        let increment: Expr | null = null
        if (!this.check(TokenType.RIGHT_BRACE)) {
            increment = this.expression()
        }

        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after 'for' condition.")

        let body: Stmt = this.statement()

        // If there's an increment, add it at the end of the body
        if (increment !== null) {
            body = new Block([
                body,
                new Expression(increment)
            ])
        }

        // Create the while loop with the condition or true
        if (condition === null) {
            condition = new Literal(true)
        }

        body = new While(condition, body)

        // Add scoped initializer before the while loop
        if (initializer !== null) {
            body = new Block([
                initializer,
                body
            ])
        }

        return body
    }

    whileStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.")
        let condition = this.expression()
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after 'while' condition.")

        let body: Stmt = this.statement()

        return new While(condition, body)
    }

    ifStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.")
        let condition = this.expression()
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after 'if' condition.")

        let thenBranch: Stmt = this.statement()
        let elseBranch: Stmt | null = null

        if (this.match(TokenType.ELSE)) {
            elseBranch = this.statement()
        }

        return new If(condition, thenBranch, elseBranch)
    }

    block(): Stmt[] {
        let statements: Stmt[] = []

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            let declaration = this.declaration()
            if (declaration !== null) statements.push(declaration)
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block")

        return statements
    }

    varDeclaration(): Stmt {
        let name = this.consume(TokenType.IDENTIFIER, "Expect variable name.")

        let initializer: Expr | null = null
        if (this.match(TokenType.EQUAL)) {
            initializer = this.expression()
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration")
        return new Var(name, initializer)
    }

    printStatement(): Stmt {
        let value = this.expression()
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.")
        return new Print(value)
    }

    expressionStatement(): Stmt {
        let value = this.expression()
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.")
        return new Expression(value)
    }

    expression(): Expr {
        return this.assignment()
    }

    assignment(): Expr {
        let expr = this.or()

        if (this.match(TokenType.EQUAL)) {
            let equals = this.previous()
            let value = this.assignment()

            if (expr instanceof Variable) {
                let name = expr.name
                return new Assign(name, value)
            }

            this.error(equals, "Invalid assignment target.")
        }

        return expr
    }

    or(): Expr {
        return this.leftAssociative(this.and, [TokenType.OR], Logical)
    }

    and(): Expr {
        return this.leftAssociative(this.equality, [TokenType.AND], Logical)
    }

    equality(): Expr {
        return this.leftAssociative(this.comparison, [TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL])
    }

    comparison(): Expr {
        return this.leftAssociative(this.term, [TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL])
    }

    term(): Expr {
        return this.leftAssociative(this.factor, [TokenType.MINUS, TokenType.PLUS])
    }

    factor(): Expr {
        return this.leftAssociative(this.unary, [TokenType.SLASH, TokenType.STAR])
    }

    unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            let operator = this.previous()
            let right = this.unary()
            return new Unary(operator, right)
        }

        return this.call()
    }

    call(): Expr {
        let expr: Expr = this.primary()

        // To match chained calls
        // eg: getTask("run")()
        while (true) {
            if (this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr)
            } else {
                break
            }
        }

        return expr
    }

    finishCall(callee: Expr): Expr {
        let args: Expr[] = []

        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                args.push(this.expression())
            } while (this.match(TokenType.COMMA))
        }

        let paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after function arguments.")

        return new Call(callee, paren, args)
    }

    primary(): Expr {
        if (this.match(TokenType.FALSE)) return new Literal(false)
        if (this.match(TokenType.TRUE)) return new Literal(true)
        if (this.match(TokenType.NIL)) return new Literal(null)

        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new Literal(this.previous().literal)
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return new Variable(this.previous())
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            let expr = this.expression()
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.")
            return new Grouping(expr)
        }

        this.error(this.peek(), "Expect expression.")
    }

    leftAssociative(fn: Function, matchTokens: TokenType[], exprClass: any = Binary): Expr {
        let expr: Expr = fn.call(this)

        while (this.match(...matchTokens)) {
            let operator = this.previous()
            let right: Expr = fn.call(this)
            expr = new exprClass(expr, operator, right)
        }

        return expr
    }

    consume(type: TokenType, errorMsg: string) {
        if (this.check(type)) return this.advance()
        this.error(this.peek(), errorMsg)
    }

    error(token: Token, message: string): never {
        if (token.type == TokenType.EOF) {
            this.errorHandler.error(token.line, " at end " + message)
        } else {
            this.errorHandler.error(token.line, ` at '${token.lexeme}', ${message}`)
        }
        throw new Error("Parser error")
    }

    match(...types: TokenType[]): boolean {
        for (let type of types) {
            if (this.check(type)) {
                this.advance()
                return true
            }
        }

        return false
    }

    check(type: TokenType): boolean {
        if (this.isAtEnd()) return false
        return this.peek().type == type
    }

    advance(): Token {
        if (!this.isAtEnd()) this.current += 1
        return this.previous()
    }

    peek(): Token {
        return this.tokens[this.current]
    }

    previous(): Token {
        return this.tokens[this.current - 1]
    }

    isAtEnd(): boolean {
        return this.peek().type == TokenType.EOF
    }

    synchronize() {
        this.advance()

        let synchronizable = [
            TokenType.CLASS,
            TokenType.FUN,
            TokenType.VAR,
            TokenType.FOR,
            TokenType.IF,
            TokenType.WHILE,
            TokenType.PRINT,
            TokenType.RETURN,
        ]

        while (!this.isAtEnd()) {
            if (this.previous().type === TokenType.SEMICOLON) return

            if (synchronizable.includes(this.peek().type)) return
        }

        this.advance()
    }
}