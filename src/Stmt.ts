import { Expr } from "./Expr.js";

export enum StmtTypes {
    Expression, Print
}

interface I {
    readonly type: StmtTypes
}

export abstract class Stmt implements I {
    readonly type: StmtTypes
}

export class Expression extends Stmt {
    readonly type = StmtTypes.Expression

    constructor(
        public expression: Expr,
    ) { super() }
}

export class Print extends Stmt {
    readonly type = StmtTypes.Print

    constructor(
        public expression: Expr,
    ) { super() }
}