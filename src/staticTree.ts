import { ActionFunc, ActionDescription, ActionOutputs, Branch, Chain, ChainItem, ParallelActions } from './interfaces'

type Path = Array<string | number>

function getFunctionName (fn: any) {
  var ret = fn.toString()
  ret = ret.substr('function '.length)
  ret = ret.substr(0, ret.indexOf('('))
  return ret
}

function traverse (actions: ActionFunc[], item: Chain | ParallelActions, isChain: boolean): Branch
function traverse (actions: ActionFunc[], item: ActionFunc, outputs: ActionOutputs, isSync: boolean): ActionDescription
function traverse (actions: ActionFunc[], item: any, isChain?: any, isSync?: boolean): any {
  if (Array.isArray(item) && typeof isChain === 'boolean') {
    return (item as Chain).map(function (subItem: ChainItem, index: number) {
      if (typeof subItem === 'function') {
        let nextSubItem = item[index + 1]
        if (!Array.isArray(nextSubItem) && typeof nextSubItem === 'object') {
          item.splice(index + 1, 1)
          return traverse(actions, subItem as ActionFunc, nextSubItem, isChain)
        } else {
          return traverse(actions, subItem as ActionFunc, null, isChain)
        }
      } else if (Array.isArray(item) && isChain) {
        return traverse(actions, subItem as ParallelActions, false)
      } else {
        throw new Error('Signal Tree - Unexpected entry in signal chain')
      }
    }).filter(function (action) {
      // Removed ActionOutputs leaves null in the end of array
      return !!action
    })
  } else if (typeof item === 'function') {
    let actionFunc: ActionFunc = item
    let outputs: ActionOutputs = isChain
    let action: ActionDescription = {
      name: actionFunc.displayName || getFunctionName(actionFunc),
      isAsync: !!actionFunc.async,
      actionIndex: actions.indexOf(actionFunc) === -1 ? (actions.push(actionFunc) - 1) : actions.indexOf(actionFunc)
    }
    if (!isSync && !action.isAsync) {
      throw new Error('Signal Tree - Only async actions is allowed to be in ParallelActions array')
    }
    if (outputs) {
      action.outputs = {}
      Object.keys(outputs).forEach(function (key) {
        if (actionFunc.outputs && !~actionFunc.outputs.indexOf(key)) {
          throw new Error(`Signal Tree - Outputs object doesn\'t match list of possible outputs defined for action.`)
        }
        action.outputs[key] = traverse(actions, outputs[key], true)
      })
    }

    return action
  } else {
    throw new Error('Signal Tree - Unexpected entry in signal chain')
  }
}

export default function (signalChain: Chain) {
  let actions: ActionFunc[] = []
  var tree = traverse(actions, signalChain, true)
  return {
    tree: tree,
    actions: actions
  }
}
