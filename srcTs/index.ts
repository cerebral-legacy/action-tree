import events from 'events'
import executeTree from './executeTree'
import staticTree from './staticTree'
import InstanceProvider from './providers/Instance'

function createUniqueId() {
  return Date.now() + '_' + Math.random()
}

function SignalInstance(chain, contextProviders) {
  this.id = createUniqueId()
  this.contextProviders = contextProviders
  this.staticTree = staticTree(chain)

  this.runChain = this.runChain.bind(this)
  this.runAction = this.runAction.bind(this)

  this.runChain.on = this.on.bind(this)
  this.runChain.once = this.once.bind(this)
  this.runChain.off = this.removeListener.bind(this)
}

SignalInstance.prototype = Object.create(events.EventEmitter.prototype)

SignalInstance.prototype.runChain = function(payload) {
  this.emit('signalStart')
  executeTree(this.staticTree.tree, this.runAction, payload, function() {
    this.emit('signalEnd')
  }.bind(this))
}

SignalInstance.prototype.runAction = function(action, payload, next) {

  let hasRunNext = false

  // We wrap next becase we want to emit an event
  // when the action is done
  const wrappedNext = function() {
    if (hasRunNext) {
      throw new Error('cerebral-signals: You ran an output twice in an action, maybe you forgot to set it as async?')
    }
    hasRunNext = true
    this.emit('actionEnd', action, payload)
    next.apply(null, arguments)
  }.bind(this)

  const context = this.createContext(action, payload, wrappedNext)

  this.emit('actionStart', action, payload)
  action.actionFunc(context)

  if (!action.isAsync && !hasRunNext) {
    wrappedNext()
  }
}

SignalInstance.prototype.createContext = function(action, payload, next) {
  return [InstanceProvider(this)].concat(this.contextProviders).reduce(function(currentContext, contextProvider) {
    return contextProvider(currentContext, action, payload, next)
  }, {})
}

export default function(contextProviders) {
  return function (chain) {
    const signal = new SignalInstance(chain, contextProviders)
    return signal.runChain
  }
}

export * from './interfaces'
