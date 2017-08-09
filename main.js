// import necessary package
var superagent = require('superagent');
var cheerio = require('cheerio');
var fs = require('fs');

// set url and savePath
var url = 'http://m.haodou.com/video/cate/';
var savePath = 'linkdata/';

var cookie =
    "_wconn=-1; UM_distinctid=15dbc39af1913c-03d23496b056a4-290c4e7c-100200-15dbc39af1bc9; HDid=1502101483443; BDTUJIAID=d6302d88b3c576e35866e66d52a221c8; Hm_lvt_06a54a6e8150679f4839ee359171f563=1502101484,1502153882; PHPSESSID=u8t2d7141oombtp52nqq3a9dd7; Hm_lvt_d401a76b6ac9cc0323ddd3257e4f8b1f=1502164179,1502178738,1502200973,1502243146; Hm_lpvt_d401a76b6ac9cc0323ddd3257e4f8b1f=1502255137; _ga=GA1.2.1335836590.1502101484; _gid=GA1.2.1772420395.1502101484";

var categoryName = '';
var totalCount = 0;
var finishCount = 0;

// define whether root directory exists
fs.exists(savePath, function(exists) {
    if (exists) {
        fs.writeFile(savePath + 'main_url.txt', 'parent_path: ' + url + '\n', function(err) {
            if (err) {
                console.log(err);
            } else {
                // console.log('file written!');
            }
        });
    } else {
        // make directory
        fs.mkdir('linkdata', function(err) {
            if (err) {
                console.log(err);
            } else {
                // console.log('Done!');
            }
        });
    }
});

// superagent
superagent
    .get(url)
    .end(function(err, res) {
        // get html page
        var $ = cheerio.load(res.text);

        // get category
        $('.vediolabel_table').each(function(item) {
            var categories = $(this).find('li');

            categories.each(function(item) {
                var category = $(this).find('a');
                var c_label = category.text();
                var c_href = category.attr('href');

                // console.log(c_label, c_href);

                /*
                save data
                 */
                // make directory by labels
                fs.exists(savePath + c_label, function(exists) {
                    if (exists) {
                        // save category url data
                        fs.writeFile(savePath + c_label + '/' + 'url.txt', 'parent_path: ' + c_href + '\n', function(err) {
                            if (err) {
                                console.log(err);
                            } else {
                                // console.log('file written!');
                            }
                        });
                    } else {
                        fs.mkdir(savePath + c_label, function(err) {
                            if (err) {
                                console.log(err);
                            } else {
                                // console.log('directory' + c_label + 'created!');
                                // save category url data
                                fs.writeFile(savePath + c_label + '/' + 'url.txt', 'parent_path: ' + c_href + '\n', function(err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        // console.log('file written!');
                                    }
                                });
                            }
                        });
                    }
                });
                // append urls in main_url.txt
                fs.appendFile(savePath + 'main_url.txt', 'child_path: ' + c_href + '\n', function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        // console.log('file written!');
                    }
                });

                var selfCount = 0;

                /*
                href = c_href.split(/[/?]/)
                href.splice(4, 3, 'ajax', ['?type=', href[4].toLowerCase(), '&_type=1&', href[6], '&page=', '5'].join(''));
                href = href.join('/');
                */

                var hrefs = [];

                for (var i = 1; i <= 5; i++) {
                    href = c_href.split(/[/?]/)
                    href.splice(4, 3, 'ajax', ['?type=', href[4].toLowerCase(), '&_type=1&', href[6], '&page=', i].join(''));
                    href = href.join('/');
                    hrefs[i] = href;
                }

                // console.log(href);

                // headers
                var headers = {
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "Accept-Encoding": "gzip, deflate",
                    "Accept-Language": "zh-CN,zh;q=0.8",
                    "Connection": "keep-alive",
                    "Cookie": cookie,
                    "Host": "m.haodou.com",
                    "Referer": c_href,
                    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/59.0.3071.109 Chrome/59.0.3071.109 Safari/537.36",
                    "X-Requested-With": "XMLHttpRequest"
                };

                // get src
                getVideoSrc(hrefs, headers, function(m_label, m_href) {
                    href = Number(m_href).toString(16);
                    m_href = "http://v.hoto.cn/" + href.substring(href.length - 2, href.length) + "/" + href.substring(href.length - 4, href.length - 2) + "/" + m_href + ".mp4";

                    // console.log(m_href);

                    categoryName = c_label;

                    // check whether each category has 100 video url
                    selfCount++;
                    // console.log(selfCount);
                    if (selfCount < 100 && selfCount % 20 == 0) {}

                    fs.appendFile(savePath + c_label + '/' + 'url.txt', 'child_path: ' + m_href + '\n', function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            // console.log('file written!');
                        }
                    });

                    // /*
                    totalCount++;
                    downloadVideo(m_href, m_label, function(_filename) {
                        finishCount++;
                        console.log('[' + finishCount + ']:' + _filename + ' is downloaded');
                    })
                    // */
                })
            });
        });
    });


// get src function
var getVideoSrc = function(url, header, callback) {
    for (var i = 1; i <= 5; i++) {
        superagent
            .get(url[i])
            .set(header)
            .end(function(err, res) {
                // transform JSON data
                var text = JSON.parse(res.text);
                // console.log(text.result.html);

                // get html page
                var $ = cheerio.load(text.result.html);

                // get video
                $('li').each(function(item) {
                    var table_l = $(this).find('h2');
                    var m_label = table_l.text();
                    var table_h = $(this).find('a');
                    var m_href = table_h.attr('href').split(/[a-zA-Z/]+/)[1];

                    // console.log(m_label, m_href);
                    callback(m_label, m_href);
                })
            })
    };
};

// download video
var downloadVideo = function(url, filename, callback) {
    filename = filename + '.mp4';

    var dirPath = savePath + categoryName + '/';
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }

    // console.log(dirPath+filename);

    console.log('[' + totalCount + ']:' + filename + ' is downloading');
    var writeStream = fs.createWriteStream(dirPath + filename);
    writeStream.on('close', function() {
        callback(filename);
    })

    var req = superagent.get(url);
    req.pipe(writeStream);

};