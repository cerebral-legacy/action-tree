import staticTree from './staticTree'
import createContext from './createContext'
import executeTree from './executeTree'
import { ActionDescription, ActionResult, Branch, Chain, ExtendContextFunc, Signal, SignalCallback } from './interfaces'
import * as Promise from 'core-js/library/fn/promise'
import * as assign from 'core-js/library/fn/object/assign'

const TIMEOUT = 3000

/** Signal factory */
export default function createSignal<T> (
  signalChain: Chain,
  callback?: SignalCallback<T>,
  extendContext?: ExtendContextFunc<T>
): Signal<T> {
  let tree = staticTree(signalChain)

  return function signal (signalPayload: T): Promise<any> {
    function runAction (action: ActionDescription, payload: T) {
      callback && callback({ name: 'actionStart', action: action, payload: payload })

      return new Promise<ActionResult<T>>((resolve, reject) => {
        let actionFunc = tree.actions[action.actionIndex]
        let timeout = action.isAsync && setTimeout(() => { reject() }, TIMEOUT)

        let result: ActionResult<T> = {
          payload: payload
        }

        function outputFn (path: string, newPayload: T) {
          result.payload = assign({}, result.payload, newPayload)
          if (path) {
            result.branch = action.outputs[path]
          }

          if (action.isAsync) {
            clearTimeout(timeout)
            resolve(result)
          }
        }

        actionFunc(createContext<T>(action, payload, outputFn))

        if (!action.isAsync) { resolve(result) }
      }).then((result) => {
        callback && callback({ name: 'actionEnd', action: action, payload: result.payload })
        return result
      })
    }

    return executeTree(tree.branches, runAction, signalPayload)
  }
}
