module.exports = function () {

  if (typeof window === 'undefined') { return function () {} }
  if (
    typeof window.chrome === 'undefined' &&
    !process && !process.versions && !process.versions.electron
  ) { return function () {} }

  var isConnected = false
  var APP_ID = String(Date.now())
  var VERSION = 'v1'
  var backlog = []

  function send(type, data) {
    if (!isConnected) {
      backlog.push({
        type: type,
        data: data
      })
      return
    }
    var detail = {
      type: type,
      app: APP_ID,
      version: VERSION,
      data: data
    }

    var event = new CustomEvent('function-tree.client.message', {
      detail: JSON.stringify(detail)
    })
    window.dispatchEvent(event)
  }

  function initialize() {
    isConnected = true
    send('initialize', {
      backlog: backlog
    })
  }

  // Debugger responds on a ping from client
  window.addEventListener('function-tree.debugger.pong', initialize)
  // Client respons on a ping from debugger
  window.addEventListener('function-tree.debugger.ping', initialize)

  var pingEvent = new Event('function-tree.client.ping')
  window.dispatchEvent(pingEvent)

  return function(context, functionDetails, payload) {
    context.debugger = {
      send: function (data) {
        send('execution', {
          name: context._instance.name,
          functionTreeId: context._instance.id,
          executionId: context._instance.executionId,
          functionIndex: functionDetails.functionIndex,
          staticTree: context._instance.staticTree,
          payload: payload,
          datetime: context._instance.datetime,
          data: data
        })
      }
    }

    return context
  }
}
