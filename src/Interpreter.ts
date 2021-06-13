import { Expr, Binary, Grouping, Literal, Unary, ExprTypes, Variable, Assign } from "./Expr.js"
import TokenType from "./TokenType.js"
import Token from "./Token.js"
import ErrorHandler, { LoxRuntimeError } from "./ErrorHandler.js"
import { Block, Expression, Print, Stmt, StmtTypes, Var } from "./Stmt.js"
import Environment from "./Environment.js"

export default class Interpreter {

    environment: Environment = new Environment()

    interpret(statements: Stmt[], errorHandler: ErrorHandler): any {
        try {
            for (let statement of statements) {
                this.execute(statement)
            }
        } catch (error) {
            errorHandler.runtimeError(error)
        }
    }

    execute(statement: Stmt): null {
        switch (statement.type) {
            case StmtTypes.Expression: return this.executeExpressionStmt(statement as Expression)
            case StmtTypes.Print: return this.executePrintStmt(statement as Print)
            case StmtTypes.Var: return this.executeVarStmt(statement as Var)
            case StmtTypes.Block: return this.executeBlockStmt(statement as Block)
        }
    }

    executeExpressionStmt(stmt: Expression): null {
        this.evaluate(stmt.expression)
        return null
    }

    executePrintStmt(stmt: Print): null {
        let value = this.stringify(this.evaluate(stmt.expression))
        let htmlTag = document.createElement("p")
        htmlTag.classList.add("print")
        htmlTag.textContent = value
        document.body.append(htmlTag)
        return null
    }

    executeVarStmt(stmt: Var): null {
        let value: any = null

        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer)
        }

        this.environment.define(stmt.name.lexeme, value)
        return null
    }

    executeBlockStmt(stmt: Block): null {
        this.executeBlock(stmt.statements, new Environment(this.environment))
        return null
    }

    executeBlock(statements: Stmt[], environment: Environment): void {
        let previousEnv = this.environment

        // caught by the interpret() function
        try {
            this.environment = environment

            for (let statement of statements) {
                this.execute(statement)
            }
        } finally {
            this.environment = previousEnv
        }
    }

    evaluate(expr: Expr | null): any {
        if (expr === null) return ""

        switch (expr.type) {
            case ExprTypes.Binary: return this.evaluateBinaryExpr(expr as Binary)
            case ExprTypes.Grouping: return this.evaluateGroupingExpr(expr as Grouping)
            case ExprTypes.Literal: return this.evaluateLiteralExpr(expr as Literal)
            case ExprTypes.Unary: return this.evaluateUnaryExpr(expr as Unary)
            case ExprTypes.Variable: return this.evaluateVariableExpr(expr as Variable)
            case ExprTypes.Assign: return this.evaluateAssignExpr(expr as Assign)
        }
    }

    evaluateAssignExpr(expr: Assign): any {
        let value = this.evaluate(expr.value)
        this.environment.assign(expr.name, value)
        return value
    }

    evaluateVariableExpr(expr: Variable): any {
        return this.environment.get(expr.name)
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