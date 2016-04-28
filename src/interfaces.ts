export type Chain = Array<ChainItem>
export type ChainItem = ActionFunc | ActionOutputs | ParallelActions
export type ParallelActions = Array<ActionFunc | ActionOutputs>
export type Path = Array<string | number>

export interface ActionFunc {
  (context: any): void
  async?: boolean
  displayName?: string
}

export interface ActionOutputs {
  [key: string]: Chain
}

export interface ActionDescription {
  name: string
  isAsync: boolean
  path: Path
  actionIndex: number
  outputs?: {
    [key: string]: any
  }
}

export type Branch = Array<ActionDescription | ActionDescription[]> 

export interface Signal<T> {
  (payload?: T, extendContext?: any): Promise<T>
}

export interface SignalEvent<T> {
  payload: T,
  action?: ActionDescription
}

export interface SignalCallback<T> {
  (eventName: 'signalStart' | 'signalEnd' | 'actionStart' | 'actionEnd', eventData: SignalEvent<T>): void
}

export interface ActionOutput<T> {
  (value: T): void
  [key: string]: (value: T) => void
}

export interface ActionContext<T> {
  input: T,
  output: ActionOutput<T> 
}

export interface ActionResult<T> {
  path: string
  payload: T
}
