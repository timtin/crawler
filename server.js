var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var mkdirp = require('mkdirp');
var app     = express();

app.get('/', function(req, res) {

    baseurl = 'http://www.room-of-art.de/';
    urls = [
        'products/highlights/early-1960s-arne-jacobsen-the-eggTM-1560/',
        'products/highlights/bench-table-basis-by-klaus-franck-werner-sauer-for-wilkhahn-1582/',
        'products/highlights/pair-of-arne-vodder-easy-chairs-in-teak-by-cado-986/',
        'products/highlights/early-danish-3-seater-sofa-by-georg-thams-1474/'
    ];

    imgdir = './collection/img/';
    jsondir = './collection/data/';

    function download (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            //console.log('content-type:', res.headers['content-type']);
            //console.log('content-length:', res.headers['content-length']);

            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    }

    function getContents(url) {
        request(baseurl + url, function (error, response, html) {
            if (!error) {
                var $ = cheerio.load(html);

                var count = 0;
                var title, number, description, price;
                var json = {title: "", number: "", description: "", price: "", images: []};

                title = $('.tx-products-pi1 > .product-detail > h1').text();

                description = $('.tx-products-pi1 > .product-detail > p.bodytext').text();
                description = description.split('<br>')[0];

                number = $('.tx-products-pi1 > .product-detail > p').first().text();
                number = number.split('[')[1].split(']')[0];

                price = $('.tx-products-pi1 > .preisschild > p').first().text();
                price = price.replace(' €\n\t', '').replace('\n\t\t', '');


                // Check if folder with item number exists and create one if it's not there
                mkdirp(imgdir + number, function (err) {
                    // Lookup all lightbox links
                    $('a[rel="lightbox-product"]').each(function () {
                        // Get href of the current element
                        link = $(this).attr('href');

                        // push the image url to the json output (original src)
                        //json.images.push(baseurl + link);

                        // save linked image in folder named by items number
                        download(baseurl + link, imgdir + number + '/' + count + '.jpg', function () {
                            console.log('image download complete.');
                        });

                        // push the image path to the json output (downloaded images)
                        json.images.push(imgdir + number + '/' + count + '.jpg');

                        // increment the counter (only used to name the downloaded image files)
                        count++;
                    });

                    // push variables to json options
                    json.title = title;
                    json.number = number;
                    json.description = description;
                    json.price = price;


                    // check if folder with the name of the items number is available, create one if it's not
                    mkdirp(jsondir, function (err) {
                        // write JSON file
                        fs.writeFile(jsondir + '/data_' + number + '.json', JSON.stringify(json, null, 4), function (err) {
                            console.log(number + ': JSON written.');
                        });
                    });
                });
            }
        });
    }

    for(i = 0, len = urls.length; i < len; i++) {
        getContents(urls[i]);
    }

    res.send('Script läuft im Hintergrund.');
});

app.listen('1337');
console.log('Open localhost:1337 in your browser');
exports = module.exports = app;