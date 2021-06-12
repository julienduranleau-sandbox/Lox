import Lox from './Lox.js'

let lox = new Lox()
// lox.run("5 / 14 + (2 - 1) * 14")
lox.run('-5 + 3 * 3 / 0')

// @ts-ignore
window.lox = lox.run.bind(lox)