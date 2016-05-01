import { Branch, ActionContext, ActionDescription, ActionResult } from './interfaces'
import assign = require('object-assign')

export default function executeTree<T> (
  branches: Branch,
  runAction: (action: ActionDescription, payload: T) => Promise<ActionResult<T>>,
  payload: T
): Promise<T> {
  function runBranch (branch: Branch, index: number, payload: T): Promise<T> {
    let currentItem = branch[index]

    function runNextItem (result: T) {
      return runBranch(branch, index + 1, result)
    }

    function resolveActionOutput (action: ActionDescription) {
      return (result: ActionResult<T>): T | Promise<T> => {
        if (action.outputs) {
          let outputs = Object.keys(action.outputs)
          if (~outputs.indexOf(result.path)) {
            return runBranch(action.outputs[result.path], 0, result.payload)
          } else {
            throw new Error(`Signal Tree - action ${action.name} must use one of its defined outputs: ${outputs.join(', ')}.`)
          }
        } else {
          return result.payload
        }
      }
    }

    if (/* end of Branch */!currentItem) {
      return Promise.resolve(payload)
    } else if (/* ParallelActions */Array.isArray(currentItem)) {
      return Promise.all(currentItem.map((action: ActionDescription) => runAction(action, payload).then(resolveActionOutput(action))))
        .then((results) => assign({}, ...results))
        .then(runNextItem)
    } else {
      return runAction(currentItem, payload).then(resolveActionOutput(currentItem)).then(runNextItem)
    }
  }

  return runBranch(branches, 0, payload)
}
