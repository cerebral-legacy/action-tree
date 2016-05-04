# action-tree

Behaviour tree for JS applications

## Overview

Core idea of this project is to expose the bare minimum implementation of signal execution in [Cerebral](http://cerebraljs.com) and let other projects take advantage of it as well.
Signals is a great concept to express flow of actions executed as a response to interaction events or other events in your application.
It was initially introduced by the `cerebral` project with its declarative way of using function references, arrays and objects to define execution flow.
Starting as an experiment, `cerebral` proved itself to be a solid solution to build real life web applications.
