import { ActionFunc, Chain } from '..' 
import { staticTree } from '..'

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
    // sync('c'), runtime error
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

console.log(JSON.stringify(staticTree(signalChain).branches, null, 2))
