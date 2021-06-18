import TokenType from './TokenType.js'
import Keywords from './Keywords.js'
import Token from './Token.js'
import ErrorHandler from './ErrorHandler.js'

export default class Scanner {

    source: string
    tokens: Array<Token> = []
    start: number = 0
    current: number = 0
    line: number = 1
    errorHandler: ErrorHandler

    constructor(source: string, errorHandler: ErrorHandler) {
        this.source = source
        this.errorHandler = errorHandler
    }

    scanTokens(): Token[] {
        while (!this.isAtEOF()) {
            this.start = this.current
            this.scanToken()
        }

        this.tokens.push(new Token(TokenType.EOF, "", "\0", this.line))

        return this.tokens
    }

    scanToken() {
        let c = this.advance()
        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break
            case ')': this.addToken(TokenType.RIGHT_PAREN); break
            case '{': this.addToken(TokenType.LEFT_BRACE); break
            case '}': this.addToken(TokenType.RIGHT_BRACE); break
            case ',': this.addToken(TokenType.COMMA); break
            case '.': this.addToken(TokenType.DOT); break
            case '-': this.addToken(TokenType.MINUS); break
            case '+': this.addToken(TokenType.PLUS); break
            case ';': this.addToken(TokenType.SEMICOLON); break
            case '*': this.addToken(TokenType.STAR); break

            case '!':
                this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG)
                break
            case '=':
                this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL)
                break
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS)
                break
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER)
                break

            case '/':
                if (this.match('/')) {
                    while (this.peek() != '\n' && !this.isAtEOF()) {
                        this.advance()
                    }
                } else {
                    this.addToken(TokenType.SLASH)
                }

            case ' ':
            case '\r':
            case '\t':
                // whitespace
                break

            case '\n':
                this.line += 1
                break

            case '"':
                this.string()
                break

                this.number()
                break

            default:
                if (this.isDigit(c)) {
                    this.number()
                } else if (this.isAlpha(c)) {
                    this.identifier()
                } else {
                    this.errorHandler.error(this.line, "Unexpected character.")
                }
        }
    }

    advance(): string {
        let c = this.source[this.current]
        this.current += 1
        return c
    }

    match(expected: string): boolean {
        if (this.isAtEOF()) return false
        if (this.source[this.current] != expected) return false

        this.current += 1

        return true
    }

    peek(): string {
        if (this.isAtEOF()) return '\0'
        return this.source[this.current]
    }

    peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0'
        return this.source[this.current + 1]
    }

    addToken(type: TokenType, literal: string | number = '') {
        let text = this.source.substring(this.start, this.current)
        this.tokens.push(new Token(type, text, literal, this.line))
    }

    isAtEOF(): boolean {
        return this.current >= this.source.length
    }

    string() {
        while (this.peek() != '"' && !this.isAtEOF()) {
            if (this.peek() == '\n') {
                this.line += 1
            }
            this.advance()
        }

        if (this.isAtEOF()) {
            this.errorHandler.error(this.line, "Unterminated string.")
            return
        }

        this.advance()

        let value = this.source.substring(this.start + 1, this.current - 1)
        this.addToken(TokenType.STRING, value)
    }

    number() {
        while (this.isDigit(this.peek())) this.advance()

        if (this.peek() == "." && this.isDigit(this.peekNext())) {
            this.advance()

            while (this.isDigit(this.peek())) this.advance()
        }

        let value = this.source.substring(this.start, this.current)
        this.addToken(TokenType.NUMBER, parseFloat(value))
    }

    identifier() {
        while (this.isAlphaNumerical(this.peek())) this.advance()

        let value = this.source.substring(this.start, this.current)

        if (Keywords[value] !== undefined) {
            this.addToken(Keywords[value])
        } else {
            this.addToken(TokenType.IDENTIFIER)
        }
    }

    isDigit(c: string): boolean {
        return c >= '0' && c <= '9'
    }

    isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'
    }

    isAlphaNumerical(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c)
    }
}