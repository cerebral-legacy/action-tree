# function-tree

When a plain old function is not enough

### What is it?
Readable and maintainable code is a never ending quest. With the increased complexity of modern web applications the execution of code from user interactions and other events in our applications has increased in complexity as well. But this is not only related to the frontend, also our backends has increased execution complexity as our applications are inherently more complex.

Callback hell is a common term which says something about how asynchronous code execution affects readability and maintainability of our code bases, but testability and reusability of code is also an important factor which is difficult to achieve as complexity increases.

So a function tree will help you execute synchronous and asynchronous functions in a declarative, composable and testable way. **Declarative** means that you can describe an execution without writing any implementation, increasing readability of the code. **Composable** means that some part of one execution can be reused in an other execution. And **testable** means that you will write your code in a way where the whole chain of execution and its individual parts can be tested.

We often talk about pure functions as the holy grail for giving our code these attributes, but pure functions means "no side effects"... but most of the things we do in real applications is running side effects of some sorts. **function-tree** does not push side effects to the edge of your app. The execution runs exactly how you think about it, one after the other, but keeps the important traits of pure functions. **Declarative, composable and testable**.

### A small example
Instead of writing a function:

```js
function myFunction(url) {
  request.get(url)
    .then((result) => {
      window.app.data = result.data
    })
    .catch((err) => {
      window.app.error = err;
    })
}

myFunction('/data')
```

You create a function tree:

```js
const tree = [
  getData, {
    success: [
      setData
    ],
    error: [
      setError
    ]
  }
]

const myFunctionTree = new FunctionTree(tree)

myFunctionTree({url: '/data'})
```

As you can see the function tree has no implementation details. And this is what we mean by **declarative** approach. It is an abstraction that describes what should happen, not how. And this is an important distinction to uphold readability. There are no distractions in this code, you instantly understand what it does. It is also **composable** because any of the functions referenced in the function tree can be inserted into any other function tree. You could even compose in a whole tree into another using the spread operator:

```js
const tree = [
  ...treeA,
  ...treeB
]

const myFunctionTree = new FunctionTree(tree)
```

But what about testability? You would have a very hard time creating a test for the first function we wrote above. Let us explore how the functions in a function tree run.

```js
// The functions of a function tree are passed a context, the
// only argument available. Typically you would destructure it.
function getData({input, request, output}) {
  // The input holds the initial payload passed into
  // the function tree and will be merged with any outputs
  // of previous functions. This is by default. Request
  // is NOT default and we will look later at how this is exposed
  request(input.url)
    // Since there is a success and error path defined
    // in the function tree after this function it is able
    // to call those two paths as methods on the output.
    // Output is also default
    .then(output.sucess)
    .catch(output.error)
}
// Until async functions becomes native to JavaScript you
// have to set an async flag on functions running asynchronously.
// This is necessary for the function tree to know when to progress
// instantly, and when to wait for an output
getData.async = true

// Like request above, we also have window available on
// the context of this function. We will look into this below
function setData({input, window}) {
  window.app.data = input.result
}

function setError({input, window}) {
  window.app.error = input.error
}

const tree = [
  getData, {
    success: [
      setData
    ],
    error: [
      setError
    ]
  }
]

// When we instantiate our function tree we pass
// it additional context. The request and window object
const myFunctionTree = new FunctionTree({
  request,
  window
}, tree)

myFunctionTree({url: '/data'})
```

Our functions, in spite of them doing side effects, are now testable. They can also be composed into any other function tree. But more importantly the declarative representation of the tree has no distractions and can increase almost endlessly in complexity without affecting readability. It is much like a decision tree we use so often to gather our thoughts on different paths can be taken.

### How does this differ from rxjs and promises?
Both Rxjs and Promises are about execution control, but neither of them have conditional execution paths. Like the example above we were able to diverge our execution down the `success` or `error` path. When working with side effects they very often have two possible outcomes, which traditionally can not be expressed declaratively. But conditional execution can also be related to things like:

```js
[
  withUserRole, {
    admin: [],
    superuser: [],
    user: []
  }
]
```

Here we create a function that will diverge execution based on the user role.

Rxjs and Promises are also based on value transformation. That means only the value returned from the previous function is available in the next. This is very powerful when you indeed want to transform values, but events in your application are rarely about value transformation, they are about running side effects and going through one of multiple execution paths. And that is where **function-tree** differs. It embraces the fact that most of what we do in application development is running side effects.

### Factories and composing
When you have a declarative approach the concept of factories and composition becomes very apparent. For example doing a request could be a factory using:

```js
[
  httpGet('/users'), {
    success: [],
    error: []
  }
]
```

Or maybe you have a notification system:

```js
[
  notify('Loading data'),
  httpGet('/users'), {
    success: [
      notify('Data loaded')
    ],
    error: [
      notify('Could not load data')
    ]
  }
]
```

We are already composing in functions here, but you can also compose in other trees.

```js
const getUsers = [
  httpGet('/users'), {
    success: [],
    error: []
  }
]

const loadApp = [
  ...getUsers,
  ...getNotifications,
  ...getConfig
]
```

Or you could run these three trees in parallel using an array to group them together:

```js
const loadApp = [
  [
    ...getUsers,
    ...getNotifications,
    ...getConfig
  ]
]
```

### What happens when a function tree executes?
When you instantiate a function tree it will run through the tree checking the functions for the async flag, them being grouped for parallel execution and any paths. This gives a static representation of the tree which can be passed to debuggers to visualize it. When the function tree actually executes it will produce the context for each function and wait for it to finish, being async or not. Then it continues to the next function.

The fact that a context is created for each function gives a natural hook for side effects. You can configure your function trees to handle everything from Redux dispatchers, to firebase, mobx models, ember data, mongodb on the server etc. It does not matter, function tree is completely agnostic to this.

### Testing
Testing functions used in a function tree is as simple as just calling them and provide a context. For example:

```js
function setData({input, window}) {
  window.app.data = input.result
}
```

The test would be:

```js
const mockedWindow = { app: {}}
setData({
  input: {result: 'foo'},
  window: mockedWindow
})

test.deepEqual(mockedWindow, {app: {data: 'foo'}})
```

When you want to test the whole function tree execution you can do:

```js
const FunctionTree = require('function-tree')
const loadApp = require('app/loadApp')
const loadApp = require('tests/MockedRequest')

const window = {app: {}}
const request = new MockedRequest('/data', {data: 'foo'})
const functionTree = new FunctionTree({
  window,
  request
}, loadApp)

functionTree.on('end', () => {
  test.deepEquals(window, {app: {data: 'foo'}})
})
functionTree({url: '/data'})
```

### API

#### Create an instance

```js
import FunctionTree from 'function-tree'

const myFunction = new FunctionTree([
  funcA,
  funcB
])
```

#### Extending the context

```js
import FunctionTree from 'function-tree'
import request from 'request'

const myFunction = new FunctionTree({
  window,
  request
}, [
  funcA,
  funcB
])
```

Typically you want the same context of all your applications function trees. You can easily define your own FunctionTree by:

```js
import FunctionTree from 'function-tree'
import request from 'request'

const MyFunctionTree = FunctionTree.bind(null, {
  window,
  request
})

const myFunction = new MyFunctionTree([
  funcA,
  funcB
])
```

#### Context providers
You can also extend the context using context providers. This way you get more details about the execution at the point the context is being created.

```js
import FunctionTree from 'function-tree'
import DebuggerProvider from 'function-tree/providers/Debugger'

const MyFunctionTree = FunctionTree.bind(null, [
  // You can still just add something directly
  // to the context
  {
    request,
    window
  },
  // A function gives you some more details
  function MyContextProvider(context, payload, execution, next) {
    context // Current context
    context.input // Input created by the InputProvider (default)
    context.output // Output created by the OutputProvider (default)
    context._instance.staticTree // The static tree representation of the function tree
    context._instance.id // Unique id of the running function tree

    payload // The current payload (Used by InputProvider)

    execution.funcIndex // The index of the function in the tree, like an ID
    execution.func // A reference to the running function
    execution.isAsync // Flag of it being async or not

    next // Continue to next function (Used by OutputProvider)

    return context // Always return the changed context
  }
])

const myFunction = new MyFunctionTree([
  funcA,
  funcB
])
```

Context providers lets us do some pretty amazing things. The debugger for **function-tree** is actually just a provider that sends information to the debugger about execution and exposes an API for other context providers to send their own data to the debugger.

#### Input (default context provider)

```js
import FunctionTree from 'function-tree'

function funcA({input, output}) {
  input.foo // "bar"
}

const myFunction = new FunctionTree([
  funcA
])

myFunction({foo: 'bar'})
```

#### Output (default context provider)

```js
import FunctionTree from 'function-tree'

function funcA({input, output}) {
  input.foo // "bar"
  output.pathA({foo2: 'bar2'})
}

function funcB({input, output}) {
  input.foo // "bar"
  input.foo2 // "bar2"
}

const myFunction = new FunctionTree([
  funcA, {
    pathA: [funcB],
    pathB: []
  }
])

myFunction({foo: 'bar'})
```
