var mysql = require('mysql');
var mysqlConfig = require('../../mysqlConfig.js');
const https = require("https");
var cheerio = require("cheerio");
var u = require('../../utils/index');
module.exports = {
    getList(obj) {
        return new Promise(resolve => {
            let { pageNum, pageSize } = obj;
            if (pageNum <= 0 || pageSize <= 0) {
                resolve([]);
                return;
            }
            let nowNum = (pageNum - 1) * pageSize;
            var sql = `SELECT id,text,imgHref,type,imgType,tag FROM ${mysqlConfig.dev ? 'pipinews_test' : 'pipinews'} ORDER BY id DESC LIMIT ${nowNum},${nowNum + Number(pageSize)}`;
            console.log('分页查询sql:', sql)
            var connection = mysql.createConnection(mysqlConfig);
            connection.connect(function (err) {
                if (err) {
                    console.log('数据库链接失败', err);
                    throw err;
                }
                connection.query(sql, null, (err, data) => {
                    if (err) {
                        console.log("数据库连接错误", err);
                    } else {
                        resolve(data.map(item => (item.text = u.uncodeUtf16(item.text), item)))
                    }
                })
            })
        })
    },
    getTotal() {
        return new Promise(resolve => {
            var sql = `SELECT COUNT(*) as total FROM ${mysqlConfig.dev ? 'pipinews_test' : 'pipinews'}`;
            var connection = mysql.createConnection(mysqlConfig);
            connection.connect(function (err) {
                if (err) {
                    console.log('数据库链接失败', err);
                    throw err;
                }
                connection.query(sql, null, (err, data) => {
                    if (err) {
                        console.log("数据库连接错误", err);
                    } else {
                        resolve(data)
                    }
                })
            })
        })
    },
    pageDetail(obj) {
        return new Promise(resolve => {
            let sql = `SELECT detailHref from ${mysqlConfig.dev ? 'pipinews_test' : 'pipinews'} WHERE id=${obj.id}`;
            console.log('获取段子详情数据sql:', sql)
            var connection = mysql.createConnection(mysqlConfig);
            connection.connect(function (err) {
                if (err) {
                    console.log('数据库链接失败', err);
                    throw err;
                }
                connection.query(sql, null, (err, data) => {
                    if (err) {
                        console.log("数据库连接错误", err);
                    } else {
                        let [{ detailHref }] = data;
                        https.get(detailHref, function (ht) {
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
                                var content = arr.toString();
                                var $ = cheerio.load(content);
                                //multi 多图
                                //video 视频
                                //word 纯文字
                                //image 单图
                                let detail = $('.detail-wrapper .detail'), obj = {};
                                if (detail.hasClass('multi')) {
                                    let type = 2, imgUrls = [], title = detail.find('.content-text').html();
                                    detail.find('.content-img img').each((index, item) => {
                                        imgUrls.push($(item).attr('src'))
                                    });
                                    obj = {
                                        type,
                                        imgUrls: imgUrls.join('^^^'),
                                        title: u.utf8Change(title)
                                    }
                                } else if (detail.hasClass('word')) {
                                    let type = 1, text = detail.find('.content-text').html();
                                    obj = {
                                        type,
                                        text: u.utf8Change(text)
                                    }
                                } else if (detail.hasClass('video')) {
                                    let type = 3, videoUrl = '', title = '';
                                    title = detail.find('.content-text').text();
                                    videoUrl = detail.find('#video source').attr('src');
                                    obj = {
                                        type,
                                        title,
                                        videoUrl
                                    }
                                }
                                resolve(obj)
                            })
                        })
                    }
                })
            })
        })
    }
}