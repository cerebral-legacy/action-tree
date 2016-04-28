import staticTree from './staticTree'
import createContext from './createContext'
import { ActionDescription, ActionResult, Branch, Chain, Signal, SignalCallback } from './interfaces'

const TIMEOUT = 3000

export default function createSignal<T> (
  signalChain: Chain,
  callback?: SignalCallback<T>
): Signal<T> {
  let tree = staticTree(signalChain)

  return async function signal (signalPayload: T, extendContext?: any): Promise<any> {
    callback('signalStart', { payload: signalPayload })

    async function runAction (action: ActionDescription, payload: T): Promise<T> {
      callback('actionStart', { action: action, payload: payload })

      let result = await new Promise<ActionResult<T>>((resolve, reject) => {
        let actionFunc = tree.actions[action.actionIndex]
        let timeout = action.isAsync && setTimeout(() => { reject() }, 3000)

        let result: ActionResult<T> = {
          path: null,
          payload: payload
        }

        function outputFn (path: string, newPayload: T) {
          result.path = path
          result.payload = Object.assign({}, result.payload, newPayload)

          if (action.isAsync) {
            clearTimeout(timeout)
            resolve(result)
          }
        }

        actionFunc(createContext<T>({ action: action, payload: payload }, outputFn))

        if (!action.isAsync) { resolve(result) }
      })

      callback('actionEnd', { action: action, payload: result.payload })

      if (result.path) {
        return await runBranch(action.outputs[result.path], 0, result.payload)
      } else {
        return result.payload
      }
    }

    async function runBranch (branch: Branch, index: number, payload: T): Promise<T> {
      let currentItem = branch[index]

      function runNextItem (result: T) {
        return runBranch(branch, index + 1, result)
      }

      if (/* end of Branch */!currentItem) {
        return Promise.resolve(payload)
      } else if (/* ParallelActions */Array.isArray(currentItem)) {
        let resultAll: T
        let promises = currentItem.map(async (action: ActionDescription) => {
          let promise = runAction(action, payload)
          resultAll = Object.assign({}, payload, await promise)
          return promise
        })

        await Promise.all(promises)
        return await runNextItem(resultAll)
      } else {
        return await runNextItem(await runAction(currentItem, payload))
      }
    }

    let result = await runBranch(tree.branches, 0, signalPayload)
    callback('signalEnd', { payload: result })
    return result
  }
}
