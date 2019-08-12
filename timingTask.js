var mysql = require('mysql');
var cheerio = require("cheerio");
const https = require("https");
var mysqlConfig = require('./mysqlConfig.js');
var u = require('./utils/index');
module.exports = {
    getData() {
        console.log('获取qiushibaike数据:' + new Date().toLocaleString());
        https.get('https://www.qiushibaike.com/', function (ht) {
            var length = 0;
            var arr = [];
            ht.on("data", function (chunk) {
                arr.push(chunk);
                length += chunk.length;
            });
            ht.on("end", function () {
                // var data = Buffer.concat(arr, length);
                // var change_data = iconv.decode(data, 'gb2312');
                // var content = change_data.toString();
                var content = arr.toString()
                var $ = cheerio.load(content);
                let result = {
                    code: '200',
                    data: []
                };
                $('article').not('.gif').each((index, item) => {
                    let type = '', imgType = '', tag = '';
                    if ($(item).hasClass('video')) {
                        type = '3';
                        //视频
                    } else if ($(item).hasClass('multi')) {
                        type = '2';
                        //也是单图
                    } else if ($(item).hasClass('image')) {
                        type = '2';
                        //单图
                    } else if ($(item).hasClass('word')) {
                        type = '1';
                        //文字
                    }
                    if($(item).hasClass('three-img')){
                        imgType = 'three';
                    }else if($(item).hasClass('one-img')){
                        imgType = 'one';
                    }else if($(item).hasClass('big-img')){
                        imgType = 'big';
                    }
                    tag = $(item).find('.tag').text();
                    let img = [];
                    $(item).find('.img-list .img-box').each((index, littleItem) => {
                        img.push($(littleItem).find('img').attr('src'))
                    });
                    if (img.length == 0) {
                        img.push($(item).find('.img-box img').attr('src'))
                    }
                    let text = $(item).find('.text-box').text();
                    if (text.length == 0) return;
                    let i = text.indexOf('\\');
                    let t = i > -1 ? text.substring(0, i) : text;
                    // console.log(u.utf16toEntities(t))
                    result.data.push({
                        text: u.utf16toEntities(t),
                        imgHref: img.join('^^^'),
                        detailHref: 'https://www.qiushibaike.com' + $(item).find('.content').attr('href'),
                        createTime: new Date().toLocaleString(),
                        type,
                        imgType,
                        tag
                    });
                });
                var sql = `INSERT INTO pipinews(text,imgHref,detailHref,createTime,type,imgType,tag) VALUES ?`;
                var connection = mysql.createConnection(mysqlConfig);
                connection.connect(function (err) {
                    if (err) {
                        console.log('数据库链接失败', err);
                        throw err;
                    }
                    connection.query(sql, [result.data.map(item => ([item.text, item.imgHref, item.detailHref, item.createTime, item.type, item.imgType, item.tag]))], (err, data) => {
                        if (err) {
                            console.log("数据库连接错误", err);
                        } else {
                            // console.log(`获取到数据${data.affectedRows}条`);
                        }
                    })
                })

            })
        });
    }
}
