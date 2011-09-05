var app = new (require('snapp').application)();

app.hello = 'Hello World';

app.add = function(a, b) {
    return a + b;
};