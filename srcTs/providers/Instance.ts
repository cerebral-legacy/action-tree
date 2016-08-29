function InstanceProvider(instance) {
  return function(context) {
    context._instance = instance

    return context
  }
}

export default InstanceProvider
