const http = require('http');
http.get('http://192.168.1.8:8001/api/v2/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});
