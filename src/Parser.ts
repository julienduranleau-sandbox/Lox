import ErrorHandler from "./ErrorHandler.js";
import { Assign, Binary, Expr, Grouping, Literal, Unary, Variable } from "./Expr.js";
import { Block, Expression, Print, Stmt, Var } from "./Stmt.js";
import Token from "./Token.js";
import TokenType from "./TokenType.js";

export default class Parser {
    tokens: Token[]
    current: number = 0
    errorHandler: ErrorHandler

    constructor(tokens: Token[], errorHandler: ErrorHandler) {
        this.tokens = tokens
        this.errorHandler = errorHandler
    }

    parse(): Stmt[] {
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
        if (this.match(TokenType.PRINT)) {
            return this.printStatement()
        }
        if (this.match(TokenType.LEFT_BRACE)) {
            return new Block(this.block())
        }

        return this.expressionStatement()
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
        let expr = this.equality()

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

    equality(): Expr {
        return this.leftAssociative(
            this.comparison,
            [TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL]
        )
    }

    comparison(): Expr {
        return this.leftAssociative(
            this.term,
            [TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL]
        )
    }

    term(): Expr {
        return this.leftAssociative(
            this.factor,
            [TokenType.MINUS, TokenType.PLUS]
        )
    }

    factor(): Expr {
        return this.leftAssociative(
            this.unary,
            [TokenType.SLASH, TokenType.STAR]
        )
    }

    unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            let operator = this.previous()
            let right = this.unary()
            return new Unary(operator, right)
        }

        return this.primary()
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

    leftAssociative(fn: Function, matchTokens: TokenType[]): Expr {
        let expr: Expr = fn.call(this)

        while (this.match(...matchTokens)) {
            let operator = this.previous()
            let right: Expr = fn.call(this)
            expr = new Binary(expr, operator, right)
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