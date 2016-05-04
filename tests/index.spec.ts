/// <reference path="../node_modules/typescript/lib/lib.es5.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.dom.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.es2015.promise.d.ts" />

import { Action, ActionDescription, ActionResult, Chain } from '..' 
import { staticTree, executeTree } from '..'

function sync (name: string) { 
  let action: Action = () => {}
  action.displayName = name
  return action
}
function async (name: string) { 
  let action = sync(name)
  action.async = true
  return action
}

let signalChain: Chain = [
  sync('a'),
  async('b'), {
    'foo': [ sync('b.foo.a'), async('b.foo.b') ],
    'bar': [ sync('b.bar.a'), async('b.bar.b') ]
  },
  [
    // [ sync('error') ],
    // sync('c'), runtime error
    async('d'), {
      'foo': [ sync('d.foo.a'), async('d.foo.b') ],
      'bar': [ sync('d.bar.a'), async('d.bar.b'), {
        'foo': [ sync('d.bar.b.foo.a'), async('d.bar.b.foo.b') ],
        'bar': [ sync('d.bar.b.bar.a'), async('d.bar.b.bar.b') ]
      } ]
    },
    async('e'),
    async('f')
  ],
  // { 'foo': [] } // runtime error only
]

let tree = staticTree(signalChain)
console.log(JSON.stringify(tree.branches, null, 2))

function runAction (action: ActionDescription, payload: any): Promise<ActionResult<any>> {
  let result: ActionResult<any> = {
    payload: { [action.name]: action.path }
  }
  if (action.outputs) {
    result.path = 'bar'
  }
  return Promise.resolve(result)
}

executeTree(tree.branches, runAction, { foo: 'bar' }).then((result) => {
  console.log(JSON.stringify(result, null, 2))
})
