const crawler = require('./crawler');
const functions = require('./functions');

const site = process.env.SITE || null;

if (site === null) {
  console.log('Please specify a site as the enviroment variable SITE');
  process.exit(1);
}

if(functions.isValidUrl(site) === false) {
  console.log('The site url appears to be invalid');
  process.exit(1);
}

let site_crawler = new crawler({
  rateLimit: 500,
  maxPages: -1,
  url: site
});

site_crawler.start();