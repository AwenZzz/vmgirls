const superagent = require('superagent');
const charset = require('superagent-charset');
const async = require('async');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
charset(superagent);

const baseUrl = 'https://www.vmgirls.com/'
let type =  'page';
let page =  '12';
var route = `${type}/${page}`

mkdirs('./image/'+page,function(){
  getPageUrl(baseUrl+route,page)
})

function getPageUrl(url,page){
    superagent.get(url)
    .charset('UTF-8')
    .end(function(err, sres) {
        var items = [];
        var images = [];
        if (err) {
            console.log('ERR: ' + err);
            return;
        }else{
            var $ = cheerio.load(sres.text);
            $('div.update_area ul.update_area_lists li.i_list a').each(function(idx, element) {
                var $element = $(element);
                var url = $element.attr('href');
                var title = $element.attr('title');
                var name = page+"-"+idx+title;
                items.push({
                    title: title,
                    name: name,
                    url: url
                });
            });
            getImgUrl(items,0,page)
        }        
    });
}

function getImgUrl(its,ind,page){ 
  if(ind>=its.length){
    console.log("page:"+page+"-"+ind)
  }else{
    it = its[ind];
    superagent.get(its[ind].url)
    .charset('UTF-8')
    .end(function(err, sres) {
        var items = [];
        if (err) {
            console.log('ERR: ' + err);
        }else{
            var $ = cheerio.load(sres.text);
            $('div.main div.main_left div.content div.content_left p img').each(function(idx, element) {
                var $element = $(element);
                var src = $element.attr('src');
                var name = it.name+"-"+idx+".jpg";
                items.push({
                    name: name,
                    src: src
                });
            });
            async.mapSeries(items,function(item, callback){                   
                setTimeout(function(){
                savedImg(item.src, item.name,page,function(){
                    callback(null, item);
                });                    
                },100);                                       
            }, function(err, results){                
                getImgUrl(its,ind+1,page)
            });
        }       
    });
  }
  
}


function savedImg(img_src,name,page,callback) {       
    try{
        request.head(img_src);
        var writeStream = fs.createWriteStream('./image/'+page+'/'+name);
        var readStream = request({url: img_src, timeout: 15000})
        readStream.pipe(writeStream);
        readStream.on('end', function(response) {
            writeStream.end();
        });
        writeStream.on("finish", function() {
            callback();
        });
    }
    catch(ex){
        console.log(ex);
        callback();
    }
}


function mkdirs(dirpath,_callback) {
    var dirArray = dirpath.split('/');
    fs.exists( dirpath ,function(exists){
            if(!exists){
                mkdir(0, dirArray,function(){
                    console.log('文件夹创建完毕!准备写入文件!');
                    _callback();
                });
            }else{
                console.log('文件夹已经存在!准备写入文件!');
                _callback();
            }
    });
}

function  mkdir(pos, dirArray,_callback){
    var len = dirArray.length;
    console.log(len);
    if( pos >= len || pos > 10){
        _callback();
        return;
    }
    var currentDir = '';
    for(var i= 0; i <=pos; i++){
        if(i!=0)currentDir+='/';
        currentDir += dirArray[i];
    }
    fs.exists(currentDir,function(exists){
        if(!exists){
            fs.mkdir(currentDir,function(err){
                if(err){
                    console.log('创建文件夹出错！');
                }else{
                    console.log(currentDir+'文件夹-创建成功！');
                    mkdir(pos+1,dirArray,_callback);
                }
            });
        }else{
            console.log(currentDir+'文件夹-已存在！');
            mkdir(pos+1,dirArray,_callback);
        }
    });
}