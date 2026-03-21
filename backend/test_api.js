
const http = require('http');

http.get('http://localhost:5000/api/customers', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log('Customers via API:', parsedData.data ? parsedData.data.length : 0);
            if(parsedData.data) console.log(parsedData.data[0]);
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error('Got error: ' + e.message);
});

