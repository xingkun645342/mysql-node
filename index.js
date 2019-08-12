/**
 * @file 监测node服务
 * @author xingyifei
 */

var express = require('express');
var bodyparser = require('body-parser');
var app = express();
var port = 80;
var routes = express.Router();
// var mysql = require('mysql');
// var cheerio = require("cheerio");
// var iconv = require('iconv-lite');
// const https = require("https");
const schedule = require('node-schedule');
let timingTask = require('./timingTask.js');
let pageList = require('./dao/page-list/index.js');

const scheduleCronstyle = () => {
    var rule = new schedule.RecurrenceRule();
    rule.minute = [1, 11, 21, 31, 41, 51];
    schedule.scheduleJob(rule, () => {2
        // timingTask.getData(); 
    });
}
scheduleCronstyle();

app.use(bodyparser.urlencoded({
    extended: true
}));

// 设置本地跨域问题
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    res.header('Content-Type', 'application/json;charset=utf-8');
    next();
});

// 应用级中间件
// 允许访问public文件夹的静态资源
app.use('/public', express.static('public'));


routes.post('/getList', (req, res) => {
    console.log('getList获取参数',req.body)
    Promise.all([pageList.getList(req.body), pageList.getTotal()]).then(args => {
        let [list, [{ total }]] = args;
        res.send({
            code: 200,
            data: {
                list,
                total
            }
        });
        res.end();
    });
});

routes.post('/getDetail',(req,res) => {
    pageList.pageDetail(req.body).then(data => {
        res.send({
            code: 200,
            data
        });
        res.end();
    })
})

app.use('/', routes);

// 端口监听
app.listen(port, function () {
    console.log('Server listening on http://localhost:' + port);
});
