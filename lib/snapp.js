/**
 * Snapp Application Pattern
 * By Nate Ferrero
 * Sept 2nd, 2011
 * Raleigh, NC
 */

/**
 * Quick Instructions:
 * 
 * var app = require('snapp');
 * 
 * app.hello = 'Hello World';
 * 
 * app.$index = {
 *      $status: 200,
 *      $mime: 'text/html',
 *      $content: '<a href="/hello">Say Hi</a> - Running on port ' + app.$port
 * };
 * 
 * app['logo.png'] = app.$file('logo.png');
 * 
 * For further documentation, see the README.md file.
 */

// We will need to parse the URL
var parseURL = require('url').parse;

// Path module
var path = require('path');

// Main script info and change working dir
var _file = process.mainModule.filename;
var _dir = path.dirname(_file);
process.chdir(_dir);

// Hold any private vars to lazy load
var library = {};

// Check that startup port is specified
var port = (function() {
    for(var i in process.argv) {
        var next = 1*i + 1;
        if(process.argv[i] == '-p' &&
            typeof process.argv[next] == 'string' &&
            process.argv[next].length > 0) return process.argv[next];       
    }
    
    // No valid port was found
    throw new Error('No valid port specified for application startup, '+
        'use `-p 80` or `-p appname` command line option.');
})();

// Message reception, to be used later
function receive(message) {
    console.log('Message received on port ' + port + ': ', message);
}

// Resolve the request
function resolve(target, context) {
    
    // Get next URL segment
    var segment = context.path.shift();
    if(segment === undefined)
        segment = context.path.shift();
    
    // Save to the request chain, backtraced on error
    context.chain.push({target: target, context: context});
    
    // Inspect the target
    switch(typeof target) {
        
        // Wrap strings and numbers in an object
        case 'string':
        case 'number':
            resolve({$content: target}, context);
            return;
        
        // Evaluate functions asynchronously
        case 'function':
            function callback(target) {
                if(target instanceof Error)
                    handleError(500, context, err);
                else
                    resolve(target, context);
            }
            try {
                target(segment, callback, context);
            } catch(err) {
                handleError(500, context, err);
            }
            return;
        
        // Go deeper into the obect chain
        case 'object':
        case 'array':
            // If segment property exists
            if(typeof segment == 'string' && typeof target[segment] != 'undefined') {
                resolve(target[segment], context);
                return;
            }
            
            // Index (catchall) pages - restore the segment for access
            if(typeof target.$index != 'undefined') {
                context.path.unshift(segment);
                resolve(target.$index, context);
                return;
            }
            
            // Respond with the final output
            if(typeof target.$content != 'undefined') {
                context.response.writeHead(target.$status || 200,
                    {'Content-Type': target.$mime || 'text/html'});
                if(typeof target.$content != 'string')
                    target.$content = JSON.stringify(target.$content);
                context.response.end(target.$content);
                return;
            }
            
            // No valid match found
            handleError(404, context);
    }
}

// This gets called some time after the initial request
function timeout(context) {
    if(context.response.finished === false && !context.ignoreTimeout) {
        context.response.setHeader('Content-Type', 'text/html');
        context.response.end(self.$settings.timeout.message);
    }
}

// This is the main Snapp class
function Application() {
    
    // HTTP request handler
    function handle(request, response) {
        
        // Log the request
        console.log('Port', port, request.method,  request.url);
        
        // Parse the URL and remove the first blank segment
        var url = parseURL(request.url, true);
        var path = url.pathname.split('/');
        path.shift();
        
        // Assemble the current context
        var context = {
            url: url,
            path: path,
            request: request,
            response: response,
            error: false,
            chain: []
        };
        
        // Resolve the request
        resolve(self, context);
        
        // It should be handled, but set a timeout just in case
        setTimeout(function() {
            timeout(context);
        }, self.$settings.timeout.period);
    }
    
    // Determine if port is a valid TCP/IP port
    if(/^\d+$/.test(port) && port > 0 && port < 65536) {
        console.log('Starting HTTP Server on port ' + port);
        require('http').createServer(handle).listen(port);
    } else {
        console.log('Starting Application Server on internal port ' + port);
    }
}

// Handle errors
function handleError(code, context, err) {
    
    // If already errored, stop
    if(typeof context.error === 'object') {
        context.response.end(' 500 Server Error, also failed when trying to present error. ');
        return;
    }
    
    // Check type of error
    if(code === 'ENOENT')
        code = '404';
    
    context.error = err;
    console.log('Port', port, 'ERROR', code, context.request.url);
    
    // Iterate backwards through the chain and find the closest error handler
    for(var i = context.chain.length - 1; i >= 0; i--) {
        if(typeof context.chain[i].target != 'undefined' && typeof context.chain[i].target['$'+code] != 'undefined') {
            resolve(context.chain[i].target['$'+code], context);
            return;
        }
    }
}

// Default Index page
Application.prototype.$index = function(segment, callback) {
    callback({
        $status: 200,
        $mime: 'text/html',
        $content: '<style>body {font-family: Tahoma, Verdana;}</style>'+
            '<h3>Welcome to Snapp</h3>'+
            '<p>You are seeing this page because you have not configured an index page for your application.</p>'+
            '<h4>What to do?</h4>'+
            '<p>Add an <code>$index</code> property to your Snapp application to replace this message.</p>'
    });
};

// Default static file server
Application.prototype.$file = function(file) {
    
    // Instantiate server if not present
    if(!library.server)
        library.server = new (require('node-static')).Server();
    
    return function(segment, callback, context) {
        library.server
        .serveFile(file, 200, null, context.request, context.response)
        .addListener('error', function(err) {
            handleError(err.code, context, err);
        });
    };
};

// Default 404 error page
Application.prototype.$404 = function(segment, callback, context) {
    callback({
        $status: 404,
        $mime: 'text/html',
        $content: 'Error 404 &bull; Resource Not Found<hr/>' +
            (context.error ? context.error.stack : context.request.url)
    });
};

// Default 500 error page
Application.prototype.$500 = function(segment, callback, context) {
    callback({
        $status: 500,
        $mime: 'text/html',
        $content: 'Error 500 &bull; Internal Server Error<hr/><pre>' +
            (context.error ? context.error.stack : 'Unknown Error')
    });
};

// Expose port
Application.prototype.$port = port;

// Default settings
Application.prototype.$settings = {
    timeout: {
        period: 1000,
        message: ' Request Timed Out '
    }
};

// Export the application class
module.exports = self = new Application();