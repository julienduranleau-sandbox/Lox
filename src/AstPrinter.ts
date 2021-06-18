import { Expr, Binary, Grouping, Literal, Unary, ExprTypes, Variable, Assign, Logical, Call } from "./Expr.js"
import { Block, Expression, Fn, If, Print, Return, Stmt, StmtTypes, Var, While } from "./Stmt.js"

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
                case StmtTypes.If:
                    s += this.printIfStmt(statement as If)
                    break
                case StmtTypes.While:
                    s += this.printWhileStmt(statement as While)
                    break
                case StmtTypes.Fn:
                    s += this.printFnStmt(statement as Fn)
                    break
                case StmtTypes.Return:
                    s += this.printReturnStmt(statement as Return)
                    break
            }
            s += " "
        }

        return s
    }

    prettyPrint(statements: Stmt[]): string {
        let s = this.print(statements)
        const blockStart = "(block"
        const blockEnd = "endblock)"

        let indent = 0

        for (let i = 0; i < s.length; i++) {
            if (s.substr(i, blockStart.length) === blockStart) {
                indent += 1
                let newline = "\n" + "  ".repeat(indent)
                s = s.substr(0, i + blockStart.length) + newline + s.substr(i + blockStart.length + 1)
            }
            if (s.substr(i, blockEnd.length) === blockEnd) {
                indent -= 1
                let newline = "\n" + "  ".repeat(indent) + ")" + "\n" + "  ".repeat(indent)
                s = s.substr(0, i) + newline + s.substr(i + blockEnd.length + 1)
            }
        }

        return s
    }



    printBlockStmt(stmt: Block): string {
        return `(block ${this.print(stmt.statements)} endblock)`
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

    printIfStmt(stmt: If): string {
        if (stmt.elseBranch !== null) {
            return `( if ${this.printExpression(stmt.condition)} then ${this.print([stmt.thenBranch])} else ${this.print([stmt.elseBranch])} })`
        } else {
            return `( if ${this.printExpression(stmt.condition)} then ${this.print([stmt.thenBranch])}`
        }
    }

    printWhileStmt(stmt: While): string {
        return `( while ${this.printExpression(stmt.condition)} then ${this.print([stmt.body])}`
    }

    printFnStmt(stmt: Fn): string {
        return `( fn ${stmt.name.lexeme} )`
    }

    printReturnStmt(stmt: Return): string {
        if (stmt.value !== null) {
            return this.parenthesize(`return`, stmt.value)
        } else {
            return this.parenthesize(`return`)
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
            case ExprTypes.Logical: return this.printLogicalExpr(expr as Logical)
            case ExprTypes.Call: return this.printCallExpr(expr as Call)
        }
    }

    printCallExpr(expr: Call): string {
        return this.parenthesize("call", expr.callee, ...expr.args)
    }

    printLogicalExpr(expr: Logical): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
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