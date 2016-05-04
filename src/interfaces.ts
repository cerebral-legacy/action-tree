export type Chain = Array<ChainItem>
export type ChainItem = Action | ActionOutputs | ParallelActions
export type ParallelActions = Array<Action | ActionOutputs>
export type Branch = Array<ActionDescription | ActionDescription[]> 

export interface Action {
  (): void
  async?: boolean
  displayName?: string
  outputs?: string[]
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
