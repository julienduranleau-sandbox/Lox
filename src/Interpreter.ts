import { Expr, Binary, Grouping, Literal, Unary, Types } from "./Expr.js"
import TokenType from "./TokenType.js"
import Token from "./Token.js"
import ErrorHandler, { LoxRuntimeError } from "./ErrorHandler.js"

export default class Interpreter {

    interpret(expr: Expr | null, errorHandler: ErrorHandler): any {
        try {
            return this.stringify(this.evaluate(expr))
        } catch (error) {
            errorHandler.runtimeError(error)
        }
    }

    evaluate(expr: Expr | null): any {
        if (expr === null) return ""

        switch (expr.type) {
            case Types.Binary: return this.evaluateBinaryExpr(expr as Binary)
            case Types.Grouping: return this.evaluateGroupingExpr(expr as Grouping)
            case Types.Literal: return this.evaluateLiteralExpr(expr as Literal)
            case Types.Unary: return this.evaluateUnaryExpr(expr as Unary)
        }
    }

    evaluateBinaryExpr(expr: Binary): any {
        let left: any = this.evaluate(expr.left)
        let right: any = this.evaluate(expr.right)

        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right)
                return left - right
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right)
                return left / right
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right)
                return left * right
            case TokenType.PLUS:
                this.checkNumberOrStringOperands(expr.operator, left, right)
                return left + right
            case TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right)
                return left > right
            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right)
                return left >= right
            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right)
                return left < right
            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right)
                return left <= right
            case TokenType.EQUAL_EQUAL:
                return left === right
            case TokenType.BANG_EQUAL:
                return left !== right
        }

        return null
    }

    evaluateGroupingExpr(expr: Grouping): any {
        return this.evaluate(expr.expression)
    }

    evaluateLiteralExpr(expr: Literal): any {
        return expr.value
    }

    evaluateUnaryExpr(expr: Unary): any {
        let right: any = this.evaluate(expr.right)

        switch (expr.operator.type) {
            case TokenType.BANG:
                return !this.isTruthy(right)
            case TokenType.MINUS:
                this.checkNumberOperands(expr.operator, right)
                return -right
        }
    }

    isTruthy(value: any): boolean {
        if (value === null) return false
        if (value === false) return false
        return true
    }

    checkNumberOperands(operator: Token, ...operand: any[]): void {
        for (let op of operand) {
            if (isNaN(op)) {
                throw new LoxRuntimeError(operator, "Operands have to be numbers")
            }
        }
    }

    checkNumberOrStringOperands(operator: Token, ...operand: any[]): void {
        for (let op of operand) {
            if (isNaN(op) && (typeof op) !== "string") {
                throw new LoxRuntimeError(operator, "Operands have to be numbers or strings")
            }
        }
    }

    stringify(value: any): string {
        if (value === null) return "nil"

        if (!isNaN(value)) {
            let t: string = (value).toString()
            // if (t.substr(-2) == ".0") {
            //     t = t.substring(0, -2)
            // }
            return t
        }

        return value.toString()
    }
}