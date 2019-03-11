const rp = require('request-promise');
const cheerio = require('cheerio');
const normalizeUrl = require('normalize-url');
const functions = require('./functions');
const fs = require('fs');

module.exports = class Crawler {
    constructor(args) {
        this.settings = Object.assign(this.defaults, args);
        this.urls = {
            visited: {},
            queued: [{target: this.settings.url}]
        };
        
    }

    get defaults () {
        return {
            rateLimit: 1000,
            maxPages: -1
        }
    }

    start () {
        this.loadUrl(this.urls.queued[0]);
    }

    loadUrl(url) {
        rp({
            uri: url.target,
            resolveWithFullResponse: true,
            followRedirect: false,
            followAllRedirects: false
        })
        .then(this.handleSiteLoad.bind(this, url))
        .catch(this.handleSiteError.bind(this, url));
    }

    handleSiteLoad(url, request) {
        var url = request.request.href;
        var statusCode = request.statusCode;
        var $ = cheerio.load(request.body);

        var visitedLen = Object.keys(this.urls.visited).length;
        var totalLen = visitedLen + this.urls.queued.length;
        console.log(`Crawled (${visitedLen}/${totalLen}):: ${statusCode} :: ${url}`);

        var referer = url.hasOwnProperty('referrer')
            ? url.referrer
            : null;

        var links = $('a[href]').toArray().map(anchor => anchor.attribs.href);
        links = this.queueLinks(links, url);
        
        this.urls.visited[url] = {
            statusCode: statusCode,
            referer: referer,
            links: links
        };

        setTimeout(this.handleNextLink.bind(this), this.settings.rateLimit);
    }

    handleNextLink() {
        var hasMaxPages = this.settings.maxPages < 0
        var maxPages = this.settings.maxPages;
        var currentPages = Object.keys(this.urls.visited).length;
        
        console.log('URLS LEFT: '+this.urls.queued.length);
        if (this.urls.queued.length <= 1 && (hasMaxPages && currentPages >= maxPages)) {
            console.log(`Finished crawling ${Object.keys(this.urls.visited).length} urls on ${this.settings.url}`);
            var re = new RegExp('[^a-zA-Z0-9\-]', 'gim');
            var site = this.settings.url.replace(re, '_').replace('_*', '_');
            fs.writeFileSync(`reports/full-${site}.json`, JSON.stringify(this.urls.visited));
            process.exit(0);
        }

        this.urls.queued.shift();
        this.loadUrl(this.urls.queued[0]);
    }

    handleSiteError(url, err) {
        var url = err.options.uri;
        var statusCode = err.statusCode;

        var referer = url.hasOwnProperty('referrer')
            ? url.referrer
            : null;

        var visitedLen = Object.keys(this.urls.visited).length;
        var totalLen = visitedLen + this.urls.queued.length;
        console.log(`Crawled (${visitedLen}/${totalLen}):: ${statusCode} :: ${url}`);

        var data = {
            statusCode: statusCode,
            referer: referer,
            links: [],
        };

        if(statusCode === 301 || statusCode === 302) {
            var redirLocation = err.response.headers.location;
            this.urls.queued.push({target: redirLocation, referer: referer});
            data.location = redirLocation;
        }

        this.urls.visited[url] = data;

        setTimeout(this.handleNextLink.bind(this), this.settings.rateLimit);
    }

    queueLinks(links, referer) {
        links = links
            .map(this.removeHashAndParams)
            .filter(this.isInternalLink.bind(this))
            .map(this.unrelativeUrls.bind(this))
            .filter(functions.isValidUrl)
            .map(normalizeUrl)
            .filter(this.isDuplicate)
            .filter(this.hasVisitedBefore.bind(this))
            .filter(this.isAlreadyQueued.bind(this))
            .map( link => Object({target: link, referer: referer}));

        this.urls.queued = this.urls.queued.concat(...links);
        return links;
    }

    removeHashAndParams (url) {
        var idx;

        if ((idx = url.indexOf('#')) !== -1) { 
            url = url.slice(0,idx);
        }

        if ((idx = url.indexOf('?')) !== -1) { 
            url = url.slice(0,idx);
        }

        return url;
    }

    unrelativeUrls (url) {
        var res = (this.isRelativeUrl(url) === false)
            ? url
            : this.addBaseToUrl(this.settings.url, url)
        
        return res;
    }

    addBaseToUrl (site, url) {
        var surl = url[0] === '/' 
            ? url.slice(1)
            : url;

        return (new URL(site)).origin + '/' + surl;
    }

    isRelativeUrl(url) {
        var re = new RegExp(
            "^[^\/]+\/[^\/].*$|^\/[^\/].*$",
            "gmi"
        )
        return !!re.test(url);
    }

    isDuplicate (value, index , self) {
        return self.indexOf(value) === index
    }

    isInternalLink (link) {
        if(link === '/' || this.isRelativeUrl(link)) {
            return true;
        }

        var base = this.settings.url;
        var base_host = (new URL(base)).host;

        try {
            return (new URL(link)).host === base_host;
        } catch (e) {
            return false;
        }
    }

    hasVisitedBefore(link) {
        return this.urls.visited.hasOwnProperty(link) === false
    }

    isAlreadyQueued(link) {
        return this.urls.queued.includes(link) === false
    }

};