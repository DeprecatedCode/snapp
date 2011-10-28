/**
 * Snapp Director
 * Loads/unloads servers as needed, and keeps processes alive.
 *
 * By Nate Ferrero
 * September 2nd, 2011
 * Raleigh, NC
 */

var fork = require('child_process').fork;
var servers = {};

// Handle messages from child processes
function receive(message) {
    console.log('Director got message: ', message);
}

// Launch a new server process
function server(port, file) {

    // Check if a server is already alive on this port TODO
    if(typeof servers[port] != 'undefined')
        throw new Error('Server already running on port ' + port);

    // Configure the server
    servers[port] = {
        port: port,
        file: file
    };

    // Launch the server
    launch(port);
}

// Startup a server on specified port
function launch(port) {

    // Check that the server is defined
    if(typeof servers[port] != 'object')
        throw new Error('No server defined on port ' + port);

    // Spawn the server instance
    servers[port].process = fork(servers[port].file, ['-p', port]);

    // Listen for communication from the server
    servers[port].process.on('message', receive);

    servers[port].process.on('exit', function (code) {
      console.log('Server on port ' + port + ' exited with code ' + code);
    });
}

// Stop a server abruptly, then let it reboot
function crash(port) {
    console.log('Killing server on port ' + port);
    servers[port].process.kill('SIGKILL');
}

// Remove a server from the list
function remove(port) {
    crash(port);
    delete servers[port];
}

// Monitor running servers
function heartbeat() {
    for(var port in servers) {

        // Keep the process alive
        if(servers[port].process.pid === null)
            launch(port);
    }
}

// On exit crash all servers
process.on('exit', function() {
    console.log('Exit');
    for(var port in servers)
        crash(port);
});

// Listen for terminate signal
process.on('SIGTERM', function(){
    process.exit(0);
});

// Start service
exports.start = function() {
    setInterval(heartbeat, 2000);
    server(3030, __dirname + '/panel/panel');
    server(3040, __dirname + '/../demo/demoshop/shop');
    server(3050, __dirname + '/../demo/hello/main');
};