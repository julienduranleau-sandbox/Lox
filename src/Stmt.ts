import { Expr } from "./Expr.js";
import Token from "./Token.js";

export enum StmtTypes {
    Expression, Print, Var, Block
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

export class Var extends Stmt {
    readonly type = StmtTypes.Var

    constructor(
        public name: Token,
        public initializer: Expr | null,
    ) { super() }
}

export class Block extends Stmt {
    readonly type = StmtTypes.Block

    constructor(
        public statements: Stmt[],
    ) { super() }
}