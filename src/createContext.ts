import { SignalEvent, ActionContext, ActionOutput } from './interfaces'

export default function createContext<T> (
  actionEvent: SignalEvent<T>,
  outputFn: (path: string, payload: T) => void,
  extendContext?: (ctx: ActionContext<T>, actionEvent: SignalEvent<T>) => ActionContext<T>
) {
  let output = (Object.keys(actionEvent.action.outputs || {}))
    .reduce<ActionOutput<T>>(function (next, key) {
      next[key] = outputFn.bind(null, key)
      return next
    }, outputFn.bind(null, null))

  let ctx: ActionContext<T> = {
    input: actionEvent.payload,
    output: output
  }

  return extendContext
    ? extendContext(ctx, actionEvent)
    : ctx
}
