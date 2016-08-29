'use strict'

const EventEmitter = require('events')
const executeTree = require('./executeTree')
const staticTree = require('./staticTree')
const InstanceProvider = require('./providers/Instance')
const InputProvider = require('./providers/Input')
const ResultProvider = require('./providers/Result')
const assign = require('object-assign')

function createUniqueId() {
  return Date.now() + '_' + Math.random()
}

function isValidResult(result) {
  return (
    !result ||
    (
      result &&
      !Array.isArray(result) &&
      typeof result === 'object' &&
      (
        result.payload ||
        result.path
      )
    )
  )
}

function FunctionTreeExecution(functionTree) {
  this.id = functionTree.nextExecutionId()
  this.functionTree = functionTree

  this.runFunction = this.runFunction.bind(this)
}

FunctionTreeExecution.prototype.runFunction = function(funcDetails, payload, next) {
  const context = this.createContext(funcDetails, payload)
  const functionTree = this.functionTree

  functionTree.emit('functionStart', funcDetails, payload)
  const result = funcDetails.function(context)
  if (result && result.then && result.catch && typeof result.then === 'function' && typeof result.catch === 'function') {
    result
      .then(function (result) {
        if (isValidResult(result)) {
          functionTree.emit('functionEnd', funcDetails, payload)
          next(result)
        } else {
          functionTree.emit('functionEnd', funcDetails, payload)
          throw new Error('The result ' + JSON.stringify(result) + ' from function ' + funcDetails.name + ' is not a valid result')
        }
      })
      .catch(function (result) {
        if (result instanceof Error) {
          setTimeout(function () {
            functionTree.emit('functionEnd', funcDetails, payload)
            throw result
          })
        } else if (isValidResult(result)) {
          functionTree.emit('functionEnd', funcDetails, payload)
          next(result)
        } else {
          setTimeout(function () {
            functionTree.emit('functionEnd', funcDetails, payload)
            throw new Error('The result ' + JSON.stringify(result) + ' from function ' + funcDetails.name + ' is not a valid result')
          })
        }
      })
  } else if (isValidResult(result)) {
    functionTree.emit('functionEnd', funcDetails, payload)
    next(result)
  } else {
    functionTree.emit('functionEnd', funcDetails, payload)
    throw new Error('The result ' + JSON.stringify(result) + ' from function ' + funcDetails.name + ' is not a valid result')
  }
}

FunctionTreeExecution.prototype.createContext = function(action, payload) {
  return [
    InstanceProvider(this),
    InputProvider(),
    ResultProvider()
  ].concat(this.functionTree.contextProviders).reduce(function(currentContext, contextProvider) {
    return (
      typeof contextProvider === 'function' ?
        contextProvider(currentContext, action, payload)
      :
        assign(currentContext, contextProvider)
    )
  }, {})
}

function FunctionTree(contextProviders, name, tree) {
  if (
    !Boolean(this) ||
    (typeof window !== 'undefined' && this === window)
  ) {
    return new FunctionTree(contextProviders, name, tree)
  }

  if (arguments.length < 2) {
    throw new Error('function-tree: Number of arguments is less than two. You have to pass context providers and the tree definition')
  }

  if (
    !(
      Array.isArray(contextProviders) ||
      (
        typeof contextProviders === 'object' &&
        contextProviders !== null
      )
    )
  ) {
    throw new Error('function-tree: The first argument has to be a plain object or an array')
  }

  tree = typeof arguments[1] === 'string' ? arguments[2] : arguments[1]
  name = typeof arguments[1] === 'string' ? arguments[1] : null

  if (!Array.isArray(tree)) {
    throw new Error('function-tree: The second argument has to be an array')
  }

  this.id = createUniqueId()
  this.name = name
  this.currentExecutionId = 0
  this.contextProviders = Array.isArray(contextProviders) ? contextProviders : [contextProviders]
  this.staticTree = staticTree(tree)

  this.runTree = this.runTree.bind(this)

  this.runTree.on = this.on.bind(this)
  this.runTree.once = this.once.bind(this)
  this.runTree.off = this.removeListener.bind(this)

  return this.runTree
}

FunctionTree.prototype = Object.create(EventEmitter.prototype)

FunctionTree.prototype.runTree = function(payload) {
  var execution = new FunctionTreeExecution(this)

  this.emit('start')
  executeTree(this.staticTree, execution.runFunction, payload, function() {
    this.emit('end')
  }.bind(this))
}

FunctionTree.prototype.nextExecutionId = function() {
  return this.currentExecutionId++
}

module.exports = FunctionTree
