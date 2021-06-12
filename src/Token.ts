import TokenType from "./TokenType.js"

export default class Token {
    type: TokenType
    lexeme: string
    literal: string
    line: number

    constructor(type: TokenType, lexeme: string, literal: string, line: number) {
        this.type = type
        this.lexeme = lexeme
        this.literal = literal
        this.line = line
    }

    toString() {
        return `${TokenType[this.type]} ${this.lexeme} ${this.literal}`
    }
}