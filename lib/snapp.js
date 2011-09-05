/**
 * Snapp Application Pattern
 * By Nate Ferrero
 * Sept 2nd, 2011
 * Raleigh, NC
 */

// The end of your application chain must return either a string or an object
// like {$status: 200, $mime: 'text/css', $body: '.qwerty {asdf: ghjkl;}'}
//
// Create your app like this:
// var app = new (require('snapp').application)();

function app() {
    this.$ = {};
    
    // Check for valid startup port
    var port = (function() {
        for(var i in process.argv) {
            var test = process.argv[i].split('=');
            if(test[0] == 'port' && typeof test[1] == 'string' && test[1].length > 0)
                return test[1];       
        }
        
        // If no port=### found, error
        throw new Error('No valid port specified for application startup, '+
            'use port=80 or port=appname command line option');
    })();
    
    var self = this;
    
    this.$.port = port;
    
    this.$404 = function(seg, req, res) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('Error 404 &bull; Resource Not Found<hr/>' + req.url);
    };
    
    this.$500 = function(seg, req, res) {
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.end('Error 500 &bull; Internal Server Error<hr/>' + req.url);
    };
    
    this.$.receive = function() {
        console.log('Message received on :' + self.$.port);
    };
    
    this.$.respond = function(path, x, req, res) {
        var seg = path.shift();
        if(seg === '')
            seg = path.shift();
        
        // Populate the request chain, backtraced on error
        if(typeof req.snappChain == 'undefined')
            req.snappChain = [];
        req.snappChain.push({seg: seg, path: path, scope: x});
        
        switch(typeof x) {
            
            case 'undefined':
            case 'boolean':
                // Stop on any undefined, true, or false value
                return false;
            
            case 'function':
                // Evaluate function
                x = x(seg, req, res);
                
                // Stop if false is returned
                if(x === false)
                    return;
                    
                // Otherwise, continue traversing
                return self.$.respond(path, x, req, res);
                
            case 'object':
                // Check for property
                if(typeof seg == 'string' && typeof x[seg] != 'undefined')
                    return self.$.respond(path, x[seg], req, res);
                
                // Check for index
                if(typeof x.$index != 'undefined')
                    return self.$.respond(path, x.$index, req, res);
                
                // Check for body
                if(typeof x.$body != 'undefined') {
                    var status = 200;
                    var mime = 'text/html';
                    
                    if(typeof x.$mime == 'string')
                        mime = x.$mime;
                    if(typeof x.$status == 'number')
                        status = x.$status;
                        
                    res.writeHead(status, {'Content-Type': mime});
                    res.headWritten = true;
                    if(typeof x.$body != 'string')
                        x.$body = JSON.stringify(x.$body);
                    return res.end(x.$body);
                }
                
                // No valid match
                return self.$.respond(path, false, req, res);
            
            // String
            case 'string':
                if(!res.headWritten)
                    res.writeHead(200, {'Content-Type': 'text/html'});
                return res.end(x);
                
            default:
                self.$.error(404, req, res);
                return false;
        }
    };
    
    this.$.handle = function(req, res) {
        console.log('[Port ' + port + '] ' + req.method + ' ' + req.url);
        res.headWritten = false;
        self.$.respond(req.url.split('/'), self, req, res);
    };
    
    this.$.file = function(file) {
        // Instantiate server if not present
        if(typeof self.$.server == 'undefined') {
            var st = require('node-static');
            self.$.server = new st.Server();
        }
        
        return function(seg, req, res) {
            self.$.server.serveFile(file, req, res).addListener('error', function(err) {
                
                console.log(err.message);
                
                switch(err.code) {
                    case 'ENOENT': // Not found
                        return self.$.error(404, req, res, err);
                    default:
                        return self.$.error(500, req, res, err);
                }
            });
            return false;
        };
    };
    
    this.$.error = function(code, req, res, err) {
        // Iterate backwards through the chain and find the closest error handler
        for(var i = req.snappChain.length - 1; i >= 0; i--) {
            if(typeof req.snappChain[i].scope != 'undefined' && typeof req.snappChain[i].scope['$'+code] != 'undefined') {
                self.$.respond(req.snappChain[i].path, req.snappChain[i].scope['$'+code], req, res);
                return false;
            }
        }
        return false;
    };
    
    // Check if port is a valid internet port and start HTTP server
    if(/^\d+$/.test(port) && port > 0 && port < 65536) {
        console.log('Starting HTTP Server on port ' + port);
        this.$.http = require('http').createServer(this.$.handle).listen(port);
    } else {
        console.log('Starting App Server on internal port ' + port);
    }
}

exports.application = app;