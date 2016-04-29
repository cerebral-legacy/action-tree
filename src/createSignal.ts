import staticTree from './staticTree'
import createContext from './createContext'
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
    function runAction (action: ActionDescription, payload: T): Promise<T> {
      callback && callback({ name: 'actionStart', action: action, payload: payload })

      return new Promise<ActionResult<T>>((resolve, reject) => {
        let actionFunc = tree.actions[action.actionIndex]
        let timeout = action.isAsync && setTimeout(() => { reject() }, TIMEOUT)

        let result: ActionResult<T> = {
          path: null,
          payload: payload
        }

        function outputFn (path: string, newPayload: T) {
          result.path = path
          result.payload = assign({}, result.payload, newPayload)

          if (action.isAsync) {
            clearTimeout(timeout)
            resolve(result)
          }
        }

        actionFunc(createContext<T>(action, payload, outputFn))

        if (!action.isAsync) { resolve(result) }
      }).then((result) => {
        callback && callback({ name: 'actionEnd', action: action, payload: result.payload })

        if (result.path) {
          return runBranch(action.outputs[result.path], 0, result.payload)
        } else {
          return result.payload
        }
      })
    }

    function runBranch (branch: Branch, index: number, payload: T): Promise<T> {
      let currentItem = branch[index]

      function runNextItem (result: T) {
        return runBranch(branch, index + 1, result)
      }

      if (/* end of Branch */!currentItem) {
        return Promise.resolve(payload)
      } else if (/* ParallelActions */Array.isArray(currentItem)) {
        let resultAll: T
        let promises = currentItem.map((action: ActionDescription) => {
          return runAction(action, payload).then((newPayload) => {
            resultAll = assign({}, payload, newPayload)
            return newPayload 
          })
        })

        return Promise.all(promises).then(() => resultAll).then(runNextItem)
      } else {
        return runAction(currentItem, payload).then(runNextItem)
      }
    }

    return runBranch(tree.branches, 0, signalPayload)
  }
}
