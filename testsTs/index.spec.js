"use strict";
var __1 = require('..');
function sync(name) {
    var action = function () { };
    action.displayName = name;
    return action;
}
function async(name) {
    var action = sync(name);
    action.async = true;
    return action;
}
var signalChain = [
    sync('a'),
    async('b'), {
        'foo': [sync('b.foo.a'), async('b.foo.b')],
        'bar': [sync('b.bar.a'), async('b.bar.b')]
    },
    [
        // [ sync('error') ],
        // sync('c'), runtime error
        async('d'), {
            'foo': [sync('d.foo.a'), async('d.foo.b')],
            'bar': [sync('d.bar.a'), async('d.bar.b'), {
                    'foo': [sync('d.bar.b.foo.a'), async('d.bar.b.foo.b')],
                    'bar': [sync('d.bar.b.bar.a'), async('d.bar.b.bar.b')]
                }]
        },
        async('e'),
        async('f')
    ],
];
var tree = __1.staticTree(signalChain);
function runAction(action, payload, next) {
    var result = {
        payload: {}
    };
    payload.actions.push(action.name);
    if (action.outputs) {
        result.path = 'bar';
    }
    if (action.isAsync) {
        setTimeout(function () { return next(result); });
    }
    else {
        next(result);
    }
}
__1.executeTree(tree.tree, runAction, { foo: 'bar', actions: [] }, function (result) {
    console.log(JSON.stringify(result, null, 2));
});
//# sourceMappingURL=index.spec.js.map