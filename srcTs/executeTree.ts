import { Branch, ActionDescription, ActionResult } from './interfaces'
import assign = require('object-assign')

/**
 * Executes static `tree` of actions with `initialPayload` using `resolveActionResult` function.
 * `ActionResult.payload` merged with payload from previous step to be passed to next one.
 * `ActionResult.path` defines which branch of action outputs to use if any.
 */
export default function executeTree<T> (
  tree: Branch,
  resolveActionResult: (action: ActionDescription, payload: T, next: (result: ActionResult<T>) => void) => void,
  initialPayload: T,
  end: (payload: T) => void
): void {
  function runBranch (branch: Branch, index: number, payload: T, nextBranch: (payload: T) => void): void {
    function runNextItem (result: T) {
      runBranch(branch, index + 1, result, nextBranch)
    }

    function processActionOutput (action: ActionDescription, outputResult: (payload: T) => void) {
      return (result: ActionResult<T>): void => {
        let newPayload = assign({}, payload, result ? result.payload : {})

        if (result && action./* has */outputs) {
          let outputs = Object.keys(action.outputs)
          if (~outputs.indexOf(result.path)) {
            runBranch(action.outputs[result.path], 0, newPayload, outputResult)
          } else {
            throw new Error(`Action Tree - action ${action.name} must use one of its possible outputs: ${outputs.join(', ')}.`)
          }
        } else {
          outputResult(newPayload)
        }
      }
    }

    let currentItem = branch[index]
    if (/* end of Branch */!currentItem) {
      nextBranch ? nextBranch(payload) : end(payload)
    } else if (/* ParallelActions */Array.isArray(currentItem)) {
      const itemLength: number = currentItem.length
      currentItem.reduce((payloads: any[], action: ActionDescription) => {
        resolveActionResult(action, payload, processActionOutput(action, (payload) => {
          payloads.push(payload)
          if (payloads.length === itemLength) runNextItem(assign({}, ...payloads))
        }))
        return payloads;
      }, [])
    } else {
      resolveActionResult(currentItem, payload, processActionOutput(currentItem, runNextItem))
    }
  }

  return runBranch(tree, 0, initialPayload, end)
}
