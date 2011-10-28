var app = require('snapp');
console.log('Snapp Panel running in ' + __dirname + ' on port ' + app.$port);

// Static resources
app['favicon.ico'] = app.$file('resources/favicon.ico');
app['static'] = app.$directory('resources', {
    filters: {
        less: require('less').render
    }
});

app.$index = function(callback, context) {

    callback( context.arg() === '' ?
        app.panel : app.$404
    );
};

app.panel = function(callback) {
    var theme = 'default';
    callback(
        app.$html()
            .title('Snapp Panel')
            .css('/static/themes/'+theme+'/main.less')
            .js('/static/js/less-1.1.3.min.js')
            .body('Test')
            .render()
    );
};