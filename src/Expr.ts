import Token from "./Token.js";

export enum Types {
    Binary, Grouping, Literal, Unary
}

interface I {
    readonly type: Types
}

export abstract class Expr implements I {
    readonly type: Types
}

export class Binary extends Expr {
    readonly type = Types.Binary

    constructor(
        public left: Expr,
        public operator: Token,
        public right: Expr
    ) { super() }
}

export class Grouping extends Expr {
    readonly type = Types.Grouping

    constructor(
        public expression: Expr,
    ) { super() }
}

export class Literal extends Expr {
    readonly type = Types.Literal

    constructor(
        public value: string | number | boolean | null,
    ) { super() }
}

export class Unary extends Expr {
    readonly type = Types.Unary

    constructor(
        public operator: Token,
        public right: Expr
    ) { super() }
}