import { Expr, Binary, Grouping, Literal, Unary, ExprTypes, Variable, Assign, Logical, Call } from "./Expr.js"
import TokenType from "./TokenType.js"
import Token from "./Token.js"
import ErrorHandler, { LoxRuntimeError } from "./ErrorHandler.js"
import { Block, Expression, Fn, If, Print, Return, Stmt, StmtTypes, Var, While } from "./Stmt.js"
import Environment from "./Environment.js"
import Callable from "./Callable.js"
import LoxFn from "./LoxFn.js"

export default class Interpreter {

    globals: Environment = new Environment()
    environment: Environment = this.globals

    constructor() {
        const clockFn: Callable = {
            arity() { return 0 },
            call(interpreter: Interpreter, args: any[]) {
                return performance.now() / 1000
            },
            toString() {
                return "<native function>"
            }
        }
        this.globals.define("clock", clockFn)
    }

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
            case StmtTypes.If: return this.executeIfStmt(statement as If)
            case StmtTypes.While: return this.executeWhileStmt(statement as While)
            case StmtTypes.Fn: return this.executeFnStmt(statement as Fn)
            case StmtTypes.Return: return this.executeReturnStmt(statement as Return)
        }
    }

    executeExpressionStmt(stmt: Expression): null {
        this.evaluate(stmt.expression)
        return null
    }

    executePrintStmt(stmt: Print): null {
        let value = this.stringify(this.evaluate(stmt.expression))
        // let htmlTag = document.createElement("p")
        // htmlTag.classList.add("print")
        // htmlTag.textContent = value
        // document.body.append(htmlTag)

        console.log(value)
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

    executeIfStmt(stmt: If): null {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch)
        } else if (stmt.elseBranch !== null) {
            this.execute(stmt.elseBranch)
        }

        return null
    }

    executeWhileStmt(stmt: While): null {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body)
        }
        return null
    }

    executeFnStmt(stmt: Fn): null {
        this.environment.define(stmt.name.lexeme, new LoxFn(stmt))
        return null
    }

    executeReturnStmt(stmt: Return): null {
        let value = null

        if (stmt.value !== null) {
            value = this.evaluate(stmt.value)
        }

        throw value
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
            case ExprTypes.Logical: return this.evaluateLogicalExpr(expr as Logical)
            case ExprTypes.Call: return this.evaluateCallExpr(expr as Call)
        }
    }

    evaluateCallExpr(expr: Call): any {
        let callee = this.evaluate(expr.callee)
        let args = expr.args.map(arg => this.evaluate(arg))

        if (typeof callee.call === "function") {
            let fn: Callable = callee

            if (args.length !== fn.arity()) {
                throw new LoxRuntimeError(expr.paren, `Expected ${fn.arity()} arguments but got ${args.length}.`)
            }

            return fn.call(this, args)
        } else {
            throw new LoxRuntimeError(expr.paren, "Can only call functions and classes.")
        }
    }

    evaluateLogicalExpr(expr: Logical): any {
        let left = this.evaluate(expr.left)

        if (expr.operator.type === TokenType.OR) {
            if (this.isTruthy(left)) return left
        } else {
            if (!this.isTruthy(left)) return left
        }

        return this.evaluate(expr.right)
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