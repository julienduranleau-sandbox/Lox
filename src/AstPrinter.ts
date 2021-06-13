import { Expr, Binary, Grouping, Literal, Unary, ExprTypes, Variable, Assign } from "./Expr.js"
import { Block, Expression, Print, Stmt, StmtTypes, Var } from "./Stmt.js"

export default class AstPrinter {
    print(statements: Stmt[]): string {
        let s = ""

        for (let statement of statements) {
            switch (statement.type) {
                case StmtTypes.Expression:
                    s += this.printExpressionStmt(statement as Expression)
                    break
                case StmtTypes.Print:
                    s += this.printPrintStmt(statement as Print)
                    break
                case StmtTypes.Var:
                    s += this.printVarStmt(statement as Var)
                    break
                case StmtTypes.Block:
                    s += this.printBlockStmt(statement as Block)
                    break
            }
            s += " "
        }

        return s
    }

    printBlockStmt(stmt: Block): string {
        return `({ ${this.print(stmt.statements)} })`
    }

    printExpressionStmt(stmt: Expression): string {
        return this.printExpression(stmt.expression)
    }

    printPrintStmt(stmt: Print): string {
        return this.parenthesize("print", stmt.expression)
    }

    printVarStmt(stmt: Var): string {
        if (stmt.initializer !== null) {
            return this.parenthesize(`set_var:${stmt.name.lexeme} =`, stmt.initializer)
        } else {
            return this.parenthesize(`set_var:${stmt.name.lexeme}`)
        }
    }

    printExpression(expr: Expr): string {
        if (expr === null) return ""

        switch (expr.type) {
            case ExprTypes.Binary: return this.printBinaryExpr(expr as Binary)
            case ExprTypes.Grouping: return this.printGroupingExpr(expr as Grouping)
            case ExprTypes.Literal: return this.printLiteralExpr(expr as Literal)
            case ExprTypes.Unary: return this.printUnaryExpr(expr as Unary)
            case ExprTypes.Variable: return this.printVariableExpr(expr as Variable)
            case ExprTypes.Assign: return this.printAssignExpr(expr as Assign)
        }
    }

    printAssignExpr(expr: Assign): string {
        return this.parenthesize(`var:${expr.name.lexeme} =`, expr.value)
    }

    printVariableExpr(expr: Variable): string {
        return this.parenthesize(`var:${expr.name.lexeme}`)
    }

    printBinaryExpr(expr: Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
    }

    printGroupingExpr(expr: Grouping): string {
        return this.parenthesize("group", expr.expression)
    }

    printLiteralExpr(expr: Literal): string {
        if (expr.value == null) return "nil"
        if (typeof expr.value === "string") return `"${expr.value}"`
        return expr.value.toString()
    }

    printUnaryExpr(expr: Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right)
    }

    parenthesize(name: string, ...exprs: Expr[]): string {
        let s = "(" + name

        for (let expr of exprs) {
            s += " "
            s += this.printExpression(expr)
        }

        return s + ")"
    }
}