import { Expr, Binary, Grouping, Literal, Unary, Types } from "./Expr.js"

export default class AstPrinter {
    print(expr: Expr | null): string {
        if (expr === null) return ""

        switch (expr.type) {
            case Types.Binary: return this.printBinaryExpr(expr as Binary)
            case Types.Grouping: return this.printGroupingExpr(expr as Grouping)
            case Types.Literal: return this.printLiteralExpr(expr as Literal)
            case Types.Unary: return this.printUnaryExpr(expr as Unary)
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
            s += this.print(expr)
        }

        return s + ")"
    }
}