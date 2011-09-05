# Snapp

# Or, Stop Manually Writing Lists of Routes and Start Writing your App!

Snapp makes automatic routing of your application insanely easy. It must be magic!

## Installation

Not yet available in npm. For now, manually clone this repository under your node-modules folder.

## Basic Example App

This makes a very simple, but fully operation webapp! Save the following as example.js:

    var app = require('snapp');
    
    app.hello = 'Hello World';
    
    app.$index = {
      $status: 200,
      $mime: 'text/html',
      $content: '<img src="/logo.png" /><a href="/hello">Say Hi</a>'
    };
    
    app['logo.png'] = app.$file('logo.png');

To start, you must specify a port to run on with the -p option, as such:

    node example.js -p 8080
    
To see the logo, add a logo.png in the same directory as your app.

## Advanced Example: URL Math

Just for fun! See if you understand this, and how to properly visit it in the browser :)
Pay special attention to which URLs generate a 404 error, and which URLs work.

    var app = require('snapp'),
        f = parseFloat;
   
    app.math = function(num1, callback) {
        num1 = f(num1);
        callback({
            add: function(num2, callback) {
                callback(num1 + f(num2));
            },
            multiply:function(num2, callback) {
                callback(num1 * f(num2));
            }
        });
    };

## Custom Error Pages

Normally, a 500 error shows the stack trace in the browser. If you would like to
change this behavior, just add a $500 page to your application. This example logs
the error to the console.

    app.$500 = function(segment, callback, context) {
        console.log(context.error.stack);
        callback('Server Error');
    };

## To be Continued...