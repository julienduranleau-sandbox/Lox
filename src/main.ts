import Lox from './Lox.js'

let lox = new Lox()
lox.runFile("sample.lox")
// lox.run('print "Bob" + "Zok";')

// @ts-ignore
window.lox = lox.run.bind(lox)