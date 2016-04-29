import { ActionFunc, Chain, SignalEvent } from '..'
import { createSignal } from '..'

interface Action extends ActionFunc {
  (ctx: any): void
}

function async (fn: ActionFunc): ActionFunc {
  let aFn: ActionFunc = function aFn (ctx) {
    setTimeout(fn.bind(null, ctx), 100)
  }
  aFn.async = true
  return aFn
}

let aAction: ActionFunc = function aAction (ctx) {
  setTimeout(function() {
    ctx.output({ foo: ctx.input.foo.concat('aAction') })
  }, 200);
}
aAction.async = true

let signalChain: Chain = [
  (ctx) => { ctx.output({ foo: ctx.input.foo.concat('0') }) },
  async((ctx) => { ctx.output({ foo: ctx.input.foo.concat('1') }) }),
  (ctx) => { ctx.output.foo({ foo: ctx.input.foo.concat('2') }) }, {
    'foo': [ (ctx) => { ctx.output({ foo: ctx.input.foo.concat('3') }) }, aAction, (ctx) => { ctx.output({ foo: ctx.input.foo.concat('4') }) } ],
    'bar': [ (ctx) => { } ],
  },
  [
    aAction,
    async((ctx) => { ctx.output() }),
    async((ctx) => { ctx.output.bar() }), {
      'foo': [ (ctx) => { } ],
      'bar': [ (ctx) => { ctx.output({ foo: ctx.input.foo.concat('5') }) }, aAction ],
    }
  ],
  (ctx) => { ctx.output({ foo: ctx.input.foo.concat('the end') }) }
]

function cb (event: SignalEvent<any>) {
  let action = event.action
  console.log(`${event.name}:`)
  if (action) console.log(`index: ${action.actionIndex}, path: ${action.path}, foo: ${event.payload.foo}`)
}

interface Payload {
  foo: string[]
}

let signal = createSignal<Payload>(signalChain, cb)

signal({ foo: ['bar'] }).then(function(result) {
  console.log('the end: ')
  console.log(result)
}, function (error) {
  console.log('error: ')
  console.log(error)
})
