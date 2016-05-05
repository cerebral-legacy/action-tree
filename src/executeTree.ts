import { Branch, ActionDescription, ActionResult } from './interfaces'
import assign = require('object-assign')

/**
 * Executes static `tree` of actions with `initialPayload` using `resolveActionResult` function.
 * `ActionResult.payload` merged with payload from previous step to be passed to next one.
 * `ActionResult.path` defines which branch of action outputs to use if any.
 * @returns {Promise} resolved with output payload
 */
export default function executeTree<T> (
  tree: Branch,
  resolveActionResult: (action: ActionDescription, payload: T) => Promise<ActionResult<T>>,
  initialPayload: T
): Promise<T> {
  function runBranch (branch: Branch, index: number, payload: T): Promise<T> {
    function runNextItem (result: T) {
      return runBranch(branch, index + 1, result)
    }

    function processActionOutput (action: ActionDescription) {
      return (result: ActionResult<T>): T | Promise<T> => {
        let newPayload = assign({}, payload, result ? result.payload : {})

        if (result && action./* has */outputs) {
          let outputs = Object.keys(action.outputs)
          if (~outputs.indexOf(result.path)) {
            return runBranch(action.outputs[result.path], 0, newPayload)
          } else {
            throw new Error(`Signal Tree - action ${action.name} must use one of its possible outputs: ${outputs.join(', ')}.`)
          }
        } else {
          return newPayload
        }
      }
    }

    let currentItem = branch[index]

    if (/* end of Branch */!currentItem) {
      return Promise.resolve(payload)
    } else if (/* ParallelActions */Array.isArray(currentItem)) {
      return Promise.all(currentItem.map((action: ActionDescription) =>
        resolveActionResult(action, payload).then(processActionOutput(action))
      )).then(/* merge */(results) => assign({}, ...results)).then(runNextItem)
    } else {
      return resolveActionResult(currentItem, payload).then(processActionOutput(currentItem)).then(runNextItem)
    }
  }

  return runBranch(tree, 0, initialPayload)
}
