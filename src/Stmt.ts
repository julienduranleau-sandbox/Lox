import { Expr } from "./Expr.js";
import Token from "./Token.js";

export enum Types {
    Expression, Print
}

interface I {
    readonly type: Types
}

export abstract class Stmt implements I {
    readonly type: Types
}

export class Expression extends Stmt {
    readonly type = Types.Expression

    constructor(
        public expression: Expr,
    ) { super() }
}

export class Print extends Stmt {
    readonly type = Types.Print

    constructor(
        public expression: Expr,
    ) { super() }
}