var express = require('express');

var app = express();
app.get('/', function(req, res) {
    res.send('Hello from a Docker container');
});
app.listen(3000, function() {
    console.log('Listening on port 3000');
    console.log('   http://localhost:3000');
});