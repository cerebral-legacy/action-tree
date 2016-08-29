function InstanceProvider(execution) {
  return function(context) {
    context._instance = {
      id: execution.functionTree.id,
      name: execution.functionTree.name,
      executionId: execution.id,
      staticTree: execution.functionTree.staticTree
    }

    return context
  }
}

module.exports = InstanceProvider
