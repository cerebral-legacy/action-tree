interface PromiseConstructor {
  all<T>(values: PromiseLike<T>[]): Promise<[T]>;
}