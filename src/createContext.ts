import { ActionContext, ActionDescription, ActionOutput, ExtendContextFunc } from './interfaces'

export default function createContext<T> (
  action: ActionDescription,
  payload: T,
  outputFn: (path: string, payload: T) => void,
  extendContext?: ExtendContextFunc<T>
) {
  let output = (Object.keys(action.outputs || {}))
    .reduce<ActionOutput<T>>(function (next, key) {
      next[key] = outputFn.bind(null, key)
      return next
    }, outputFn.bind(null, null))

  let ctx: ActionContext<T> = {
    input: payload,
    output: output
  }

  return extendContext ? extendContext(ctx, action, payload) : ctx
}
