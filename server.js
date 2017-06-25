var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var mkdirp = require('mkdirp');
var app     = express();

app.get('/scrape', function(req, res){

    baseurl = 'http://www.room-of-art.de/';
    url = [
        'products/highlights/early-1960s-arne-jacobsen-the-eggTM-1560/',
        'products/highlights/bench-table-basis-by-klaus-franck-werner-sauer-for-wilkhahn-1582/',
        'products/highlights/pair-of-arne-vodder-easy-chairs-in-teak-by-cado-986/'
    ];

    imgdir = './collection/img/';

    var download = function(uri, filename, callback){
        request.head(uri, function(err, res, body){
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);

            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    };
    console.log(url.length);
    //for(var i = 0, len = url.length; i < len; i++) {

        request(baseurl + url[0], function(error, response, html){
            if(!error){
                var $ = cheerio.load(html);

                var count = 0;
                var title, number, description, price;
                var json = { title : "", number : "", description: "", price: "", images: []};

                title = $('.tx-products-pi1 > .product-detail > h1').text();

                description = $('.tx-products-pi1 > .product-detail > p.bodytext').text();
                description = description.split('<br>')[0];

                number = $('.tx-products-pi1 > .product-detail > p').first().text();
                number = number.split('[')[1].split(']')[0];

                price = $('.tx-products-pi1 > .preisschild > p').first().text();
                price = price.replace(' €\n\t','').replace('\n\t\t','');

                //Für jedes gefundene Bild ein Element zum images array hinzufügen.

                $('a[rel="lightbox-product"]').each(function() {
                    link = $(this).attr('href');
                    json.images.push(baseurl + link);

                    mkdirp(imgdir + number, function(err) {
                        download(baseurl + link, imgdir + number + '/' + count + '.jpg', function(){
                            console.log('done');
                        });
                        count++;
                    });
                });

                json.title = title;
                json.number = number;
                json.description = description;
                json.price = price;
            }

            fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){

                console.log('File successfully written! - Check your project directory for the output.json file');

            });

            res.send('Check your console!')

        });
   // }


});

app.listen('1337');
console.log('Magic happens on port 1337');
exports = module.exports = app;