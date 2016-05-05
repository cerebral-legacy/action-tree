export type Chain = Array<ChainItem>
export type ChainItem = ActionFunc | ActionOutputs | ParallelActions
export type ParallelActions = Array<ActionFunc | ActionOutputs>
export type Branch = Array<ActionDescription | ActionDescription[]> 

export interface Action {
  async?: boolean
  displayName?: string
  outputs?: string[]
}

export interface ActionFunc extends Action {
  (...args: any[]): void
}

export interface ActionOutputs {
  [key: string]: Chain
}

export interface ActionDescription {
  name: string
  isAsync: boolean
  actionIndex: number
  outputs?: {
    [key: string]: Branch
  }
}

export interface ActionResult<T> {
  path?: string
  payload: T
}
