import ErrorHandler from "./ErrorHandler.js";
import { Assign, Binary, Call, Expr, ExprTypes, Grouping, Literal, Logical, Unary, Variable } from "./Expr.js";
import Interpreter from "./Interpreter.js";
import { Block, Expression, Fn, If, Print, Return, Stmt, StmtTypes, Var, While } from "./Stmt.js";
import Token from "./Token.js";

enum FunctionType {
    NONE,
    FUNCTION,
}

export default class Resolver {

    interpreter: Interpreter
    errorHandler: ErrorHandler
    scopes: Record<string, boolean>[] = []
    currentFnType: FunctionType = FunctionType.NONE


    constructor(interpreter: Interpreter, errorHandler: ErrorHandler) {
        this.interpreter = interpreter
        this.errorHandler = errorHandler
    }

    resolve(statements: Stmt[]) {
        for (let statement of statements) {
            this.resolveStmt(statement)
        }
    }

    resolveStmt(statement: Stmt) {
        switch (statement.type) {
            case StmtTypes.Expression: this.resolveExpressionStmt(statement as Expression); break
            case StmtTypes.Print: this.resolvePrintStmt(statement as Print); break
            case StmtTypes.Var: this.resolveVarStmt(statement as Var); break
            case StmtTypes.Block: this.resolveBlockStmt(statement as Block); break
            case StmtTypes.If: this.resolveIfStmt(statement as If); break
            case StmtTypes.While: this.resolveWhileStmt(statement as While); break
            case StmtTypes.Fn: this.resolveFnStmt(statement as Fn); break
            case StmtTypes.Return: this.resolveReturnStmt(statement as Return); break
        }
    }

    resolveExpr(expr: Expr) {
        switch (expr.type) {
            case ExprTypes.Binary: this.resolveBinaryExpr(expr as Binary); break
            case ExprTypes.Grouping: this.resolveGroupingExpr(expr as Grouping); break
            case ExprTypes.Literal: this.resolveLiteralExpr(expr as Literal); break
            case ExprTypes.Unary: this.resolveUnaryExpr(expr as Unary); break
            case ExprTypes.Variable: this.resolveVariableExpr(expr as Variable); break
            case ExprTypes.Assign: this.resolveAssignExpr(expr as Assign); break
            case ExprTypes.Logical: this.resolveLogicalExpr(expr as Logical); break
            case ExprTypes.Call: this.resolveCallExpr(expr as Call); break
        }

    }

    beginScope() {
        this.scopes.push({})
    }

    endScope() {
        this.scopes.pop()
    }

    declare(name: Token) {
        if (this.scopes.length === 0) return

        let scope = this.scopes[this.scopes.length - 1]

        if (scope[name.lexeme] !== undefined) {
            this.errorHandler.error(name.line, "Variable with this name already declared in this scope.")
        }

        scope[name.lexeme] = false
    }

    define(name: Token) {
        if (this.scopes.length === 0) return

        let scope = this.scopes[this.scopes.length - 1]
        scope[name.lexeme] = true
    }

    resolveLocal(expr: Expr, name: Token) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i][name.lexeme] !== undefined) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i)
            }
        }
    }

    resolveExpressionStmt(stmt: Expression) {
        this.resolveExpr(stmt.expression)
    }

    resolvePrintStmt(stmt: Print) {
        this.resolveExpr(stmt.expression)
    }

    resolveVarStmt(stmt: Var) {
        this.declare(stmt.name)

        if (stmt.initializer !== null) {
            this.resolveExpr(stmt.initializer)
        }

        this.define(stmt.name)
    }

    resolveBlockStmt(stmt: Block) {
        this.beginScope()
        this.resolve(stmt.statements)
        this.endScope()

    }

    resolveIfStmt(stmt: If) {
        this.resolveExpr(stmt.condition)
        this.resolveStmt(stmt.thenBranch)
        if (stmt.elseBranch !== null) {
            this.resolveStmt(stmt.elseBranch)
        }
    }

    resolveWhileStmt(stmt: While) {
        this.resolveExpr(stmt.condition)
        this.resolveStmt(stmt.body)
    }

    resolveFnStmt(stmt: Fn) {
        this.declare(stmt.name)
        this.define(stmt.name)
        this.resolveFn(stmt, FunctionType.FUNCTION)
    }

    resolveReturnStmt(stmt: Return) {
        if (this.currentFnType === FunctionType.NONE) {
            this.errorHandler.error(stmt.keyword.line, "Can't return from top-level code.")
        }

        if (stmt.value !== null) {
            this.resolveExpr(stmt.value)
        }
    }

    resolveFn(fn: Fn, type: FunctionType) {
        let prevFnType = this.currentFnType

        this.currentFnType = FunctionType.FUNCTION

        this.beginScope()
        for (let param of fn.params) {
            this.declare(param)
            this.define(param)
        }
        this.resolve(fn.body)
        this.endScope()

        this.currentFnType = prevFnType
    }



    // ==========================


    resolveBinaryExpr(expr: Binary) {
        this.resolveExpr(expr.left)
        this.resolveExpr(expr.right)
    }

    resolveGroupingExpr(expr: Grouping) {
        this.resolveExpr(expr.expression)
    }

    resolveLiteralExpr(expr: Literal) {
        // Nothing to resolve
    }

    resolveUnaryExpr(expr: Unary) {
        this.resolveExpr(expr.right)
    }

    resolveVariableExpr(expr: Variable) {
        if (this.scopes.length !== 0 && this.scopes[this.scopes.length - 1][expr.name.lexeme] === false) {
            this.errorHandler.error(expr.name.line, "Can't read local variable in its own initializer.")
        }

        this.resolveLocal(expr, expr.name)
    }

    resolveAssignExpr(expr: Assign) {
        this.resolveExpr(expr.value)
        this.resolveLocal(expr, expr.name)
    }

    resolveLogicalExpr(expr: Logical) {
        this.resolveExpr(expr.left)
        this.resolveExpr(expr.right)
    }

    resolveCallExpr(expr: Call) {
        this.resolveExpr(expr.callee)

        for (let arg of expr.args) {
            this.resolveExpr(arg)
        }
    }


}