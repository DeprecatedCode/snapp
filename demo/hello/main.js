var app = require('snapp'),
    f = parseFloat;

app.hello = 'Hello World';

app.add = function(callback, context) {
    var a = f(context.arg());
    var b = f(context.arg());
    callback(a + b);
};

app.math = function(callback, context) {
    var num1 = f(context.arg());
    callback({
        add: function(callback, context) {
            callback(num1 + f(context.arg()));
        },
        multiply:function(callback, context) {
            callback(num1 * f(context.arg()));
        }
    });
};

app.$index = function(callback, context) {
    callback(
        context.arg() === '' ?
        'Welcome to the Demo, <a href="/hello">Say Hello</a>' :
        app.$404
    );
};

app.math.$404 = 'This is a 404 for the math zone!';

app.$404 = 'This is a custom default 404 error page.';