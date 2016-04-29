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

    function resolveActionOutput (result: ActionResult<T>): Promise<T> {
      if (result.branch) {
        return runBranch(result.branch, 0, result.payload)
      } else {
        return Promise.resolve(result.payload)
      }
    }

    if (/* end of Branch */!currentItem) {
      return Promise.resolve(payload)
    } else if (/* ParallelActions */Array.isArray(currentItem)) {
      return Promise.all(currentItem.map((action: ActionDescription) => runAction(action, payload).then(resolveActionOutput)))
        .then((results) => assign({}, ...results))
        .then(runNextItem)
    } else {
      return runAction(currentItem, payload).then(resolveActionOutput).then(runNextItem)
    }
  }

  return runBranch(branches, 0, payload)
}
