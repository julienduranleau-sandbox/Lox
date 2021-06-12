import { Expr, Binary, Grouping, Literal, Unary, ExprTypes } from "./Expr.js"
import { Expression, Print, Stmt, StmtTypes } from "./Stmt.js"

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
            }
            s += " "
        }

        return s
    }

    printExpressionStmt(stmt: Expression): string {
        return this.printExpression(stmt.expression)
    }

    printPrintStmt(stmt: Print): string {
        return this.parenthesize("print", stmt.expression)
    }

    printExpression(expr: Expr): string {
        if (expr === null) return ""

        switch (expr.type) {
            case ExprTypes.Binary: return this.printBinaryExpr(expr as Binary)
            case ExprTypes.Grouping: return this.printGroupingExpr(expr as Grouping)
            case ExprTypes.Literal: return this.printLiteralExpr(expr as Literal)
            case ExprTypes.Unary: return this.printUnaryExpr(expr as Unary)
        }
    }

    printBinaryExpr(expr: Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
    }

    printGroupingExpr(expr: Grouping): string {
        return this.parenthesize("group", expr.expression)
    }

    printLiteralExpr(expr: Literal): string {
        if (expr.value == null) return "nil"
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