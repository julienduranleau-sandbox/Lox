import Token from "./Token.js";

export enum ExprTypes {
    Binary, Grouping, Literal, Unary, Variable, Assign
}

interface I {
    readonly type: ExprTypes
}

export abstract class Expr implements I {
    readonly type: ExprTypes
}

export class Binary extends Expr {
    readonly type = ExprTypes.Binary

    constructor(
        public left: Expr,
        public operator: Token,
        public right: Expr
    ) { super() }
}

export class Grouping extends Expr {
    readonly type = ExprTypes.Grouping

    constructor(
        public expression: Expr,
    ) { super() }
}

export class Literal extends Expr {
    readonly type = ExprTypes.Literal

    constructor(
        public value: string | number | boolean | null,
    ) { super() }
}

export class Unary extends Expr {
    readonly type = ExprTypes.Unary

    constructor(
        public operator: Token,
        public right: Expr
    ) { super() }
}

export class Variable extends Expr {
    readonly type = ExprTypes.Variable

    constructor(
        public name: Token,
    ) { super() }
}

export class Assign extends Expr {
    readonly type = ExprTypes.Assign

    constructor(
        public name: Token,
        public value: Expr,
    ) { super() }
}