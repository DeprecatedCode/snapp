var app = require('snapp');

console.log('Snapp Panel running in ' + __dirname + ' on port ' + app.$port);

app.title = 'Snapp Panel';
app['favicon.ico'] = app.$file('resources/favicon.ico');

app.$index = function(segment, callback) {
    callback( segment === '' ?
        'Snapp Panel' : app.$404
    );
};