const fs = require('fs');

const file = process.env.FILE || null;

if (file === null) {
    console.log('Please give me a file path in the FILE system env');
    process.exit(1);
}

if (fs.existsSync(file) === false) {
    console.log('Invalid file path, try again');
    process.exit(1);
}

var cnt = fs.readFileSync(file);
var json = JSON.parse(cnt);

var urls = Object.keys(json);
var codedUrls = {};

urls.forEach(url => {
    var code = json[url].statusCode;

    if (!codedUrls.hasOwnProperty(code)) {
        codedUrls[code] = [];
    }

    codedUrls[code].push(url);
});

var file_site_name = file.split('/').pop().slice(4);

var codes = Object.keys(codedUrls);
codes.forEach(code => {  
    fs.writeFile(`reports/${code}${file_site_name}.csv`, codedUrls[code].join("\n"), err => {
        if(err) throw err;
        console.log(`Wrote ${code} file.`);
    });
});