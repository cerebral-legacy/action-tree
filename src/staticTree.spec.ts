import traverse, { ActionFunc, Chain } from './staticTree'

// TEST
function sync (name: string) { 
  let action: ActionFunc = () => {}
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
    sync('c'), // will be async anyway
    async('d'), {
      'foo': [ sync('d.foo.a'), async('d.foo.b') ],
      'bar': [ sync('d.bar.a'), async('d.bar.b'), {
        'foo': [ sync('d.bar.b.foo.a'), async('d.bar.b.foo.b') ],
        'bar': [ sync('d.bar.b.bar.a'), async('d.bar.b.bar.b') ]
      } ]
    }
  ],
  // { 'foo': [] } // runtime error only
]


let actions: ActionFunc[] = []
console.log(JSON.stringify(traverse([], actions, signalChain, true), null, 2))
// console.log(traverse([], actions, signalChain, true))
console.log(actions)
