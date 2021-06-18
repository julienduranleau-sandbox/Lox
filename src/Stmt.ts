import { Expr } from "./Expr.js";
import Token from "./Token.js";

export enum StmtTypes {
    Expression, Print, Var, Block, If, While, Fn, Return
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

export class If extends Stmt {
    readonly type = StmtTypes.If

    constructor(
        public condition: Expr,
        public thenBranch: Stmt,
        public elseBranch: Stmt | null,
    ) { super() }
}

export class While extends Stmt {
    readonly type = StmtTypes.While

    constructor(
        public condition: Expr,
        public body: Stmt,
    ) { super() }
}

export class Fn extends Stmt {
    readonly type = StmtTypes.Fn

    constructor(
        public name: Token,
        public params: Token[],
        public body: Stmt[],
    ) { super() }
}


export class Return extends Stmt {
    readonly type = StmtTypes.Return

    constructor(
        public keyword: Token,
        public value: Expr | null,
    ) { super() }
}