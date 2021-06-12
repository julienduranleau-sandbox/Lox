import Lox from './Lox.js'

let lox = new Lox()
lox.run('print "Bob" + "Zok";1+5;')

// @ts-ignore
window.lox = lox.run.bind(lox)