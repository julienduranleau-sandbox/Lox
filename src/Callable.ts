import Interpreter from "./Interpreter";

export default interface Callable {
    arity(): number
    call(interpreter: Interpreter, args: any[]): any
    toString(): string
}