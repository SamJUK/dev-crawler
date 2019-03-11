# Dev Crawler

### How to run for a site
`SITE='https://site.com' node index.js`

### How to generate status code reports
`FILE='/var/www/site/reports/full-https___www_site_com' node errors.js`

### TODO
- [ ] Multi Threading
- [ ] Proper Rate limiting
- [ ] Fix Referer on top level items
- [ ] Introduce a reporting UI
- [ ] How does it handle Unicode urls etc
- [ ] Archice old reports rather than overwriting
- [ ] Max pages Work?
- [ ] Add extracting of `canonical/next/prev/description/tags` meta tags
- [ ] Add extracting of `H1/H2` Tags
- [ ] Inital additional URL's are ignoring `www` prefix on urls?