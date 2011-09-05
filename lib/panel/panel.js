var app = new (require('snapp').application)();

console.log('Snapp Panel running in ' + __dirname);

app.title = 'Snapp Panel';
app['favicon.ico'] = app.$.file('resources/favicon.ico');

app.$index = function() {
    return 'Snapp Panel';
};

app.math = function(var_a) {
    return {
        add: function(var_b) {
            return var_a + var_b;
        },
        
        multiply: function(var_b) {
            return var_a * var_b;
        }
    };
};