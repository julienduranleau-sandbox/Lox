import ErrorHandler from "./ErrorHandler.js";
import { Binary, Expr, Grouping, Literal, Unary } from "./Expr.js";
import { Expression, Print, Stmt } from "./Stmt.js";
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
        // try {
        //     return this.expression()
        // } catch (error) {
        //     return null
        // }
        let statements: Stmt[] = []
        while (!this.isAtEnd()) {
            statements.push(this.statement())
        }

        return statements
    }

    statement(): Stmt {
        if (this.match(TokenType.PRINT)) {
            return this.printStatement()
        }

        return this.expressionStatement()
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
        return this.equality()
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
}