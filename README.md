# Snapp

Snapp makes automatic routing of your application insanely easy. Try it now!

## Basic Example App

This makes a very simple, but fully operation webapp!

    var app = new (require('snapp').application)();
    
    var dummyProductList = [
        {id: 4,     name: 'Remote Controlled Hot Rod',  price: 49.00},
        {id: 'axe', name: '"Old Whacker" Steel Axe',    price: 89.00},
        {id: 19,    name: '4GB Desktop Computer RAM',   price: 69.99}
    ];
    
    var css = '<style>font-family: Verdana;</style>';
    
    app.$index = css+'<h1>Home Page</h1><p>Welcome to our website. Please view <a href="/products">Our Products</a>.</p>';
    
    app.products = function() {
        var list = '';
        for(var i in dummyProductList) {
            product = dummyProductList[i];
            list += '<li><a href="/product/'+product.id+'">'+product.name+'</a> for $'+product.price+'</li>';
        }
        return css+'<h1>Our Products</h1><ul>'+list+'</ul>';
    };
    
    app.product = function(id) {
        for(var i in dummyProductList) {
            product = dummyProductList[i];
            if(product.id == id) return {
            
                $index: css+'<h1>Product Details</h1><p><a href="/products">&laquo; All Products</a><hr/>'+
                    '<h3>'+product.name+'</h3>Price: $'+product.price+' <a href="'+id+'/edit">[edit]</a>',
                    
                edit: css+'<h1>Edit Product</h1><p><a href="../">&laquo; Cancel</a><hr/>'+
                    '<label>Name:</label><input name="name" value="'+product.name+'"/>'+
                    '<label>Price:</label><input name="price" value="'+product.price+'"/>'
            
            };
        }
        return css+'Product not found';
    };
    
## Advanced Example

Just for fun! See if you understand this, and how to properly visit it in the browser :)

    var app = new (require('snapp').application)();
    
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

## 