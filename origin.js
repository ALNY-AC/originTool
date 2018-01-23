
// @ts-nocheck

initGlobalVariable();

//初始化一些全局变量
function initGlobalVariable(conf, fun) {

    //服务器地址===================================
    window.serverRoot = 'http://aoadmin.com/server/';

    //服务器home分组地址===================================
    window.serverRootHome = window.serverRoot + 'home/';

    //当前页面的的名字===================================
    var name = window.location.pathname.split('/');
    name = name[name.length - 1];
    name = name.split('.')[0];
    window.pagesName = name;
    if (fun) fun();
}


function o_ajax(conf, auto, fun) {
    var key = conf.key;
    var pagesId = conf.pagesId;
    var isServer = false;
    if (conf.server || conf.key == null) {
        //每次都请求最新的
        isServer = true;
    }

    var url;

    if (conf.url.indexOf("http") == -1) {
        //没有http
        url = serverRootHome + conf.url;
    } else {
        url = conf.url;
    }

    var _ajax = {
        url: url,
        data: conf.data,
        success: function (res) {
            try {
                if (typeof (res) == 'object') {
                    res = res;
                } else {
                    res = JSON.parse(res);
                }
                if (auto === true) {
                    //自动更新回调
                    if (conf._success) {
                        //成功回调
                        conf._success(res);
                    }
                } else {
                    //非自动更新回调
                    if (conf.success) {
                        //成功回调
                        conf.success(res);
                    }
                }
                if (fun) {
                    fun(res);
                }
                //在这里将数据发到数据页面。
                if (conf.key != null) {
                    if (window.plus) {
                        //手机模式
                        //从本地加载
                        console.log('服务器请求完毕，正在发送到本地保存');
                        origin.fire('pages/ajax/ajax:setData', {
                            key: conf.key,
                            pagesId: conf.pagesId,
                            data: res
                        }, function (res) {
                        });
                    } else {
                        console.warn('本地保存失败，因为现在在pc端');
                    }
                } else {
                    console.warn('没有发现key，所以此次数据将不会保存在本地');
                }
            } catch (error) {
                console.error(pagesId + ' 页面在请求数据结束，将数据转换为json时出错。请求地址：' + conf.url);
                if (conf.error) {
                    conf.error(res);
                }
            }


        },
        error: function (res) {
            console.error(pagesId + ' 页面在请求ajax的时候出错。请求地址：' + conf.url);
            if (conf.error) {
                conf.error(res);
            }
        }
    }
    $.ajax(_ajax);
}


var origin = (function () {

    var obj = {

        /**
         * 全局配置项
         */
        config: {},
        pageList: {},
        out: function (fun, time) {

            if (fun === false || fun == null || fun == undefined) {
                clearTimeout(window.o_timeout);
                console.log('计时器被关闭');
                return;
            }

            if (window.o_timeout != null) {
                clearTimeout(window.o_timeout);
            }

            if (time == null) {
                time = 60000;
            };
            console.log('计时器被打开');

            window.o_timeout = setTimeout(function () {
                fun();
            }, time);


        },
        ajax: function (conf) {

            if (conf.key) {
                if (conf.server === undefined) {
                    conf.server = false;
                }
            }

            if (!conf) {
                console.error('请求参数不能为空');
                return;
                var conf = {
                    //本条数据的全局唯一的key，当传入相同的key的时候回优先从本地取得数据，不传key的时候会优先从服务器取得数据，不传key的时候效果和 server=true 一样
                    key: '',
                    //本数据是否在后台自动检查服务器最新版本，当有最新版本的时候会自动更新，默认为true
                    auto: true,
                    //本次请求是否从服务器请求，默认false
                    server: false,
                    //请求的地址
                    url: '',
                    //请求时传递的参数
                    data: {},
                    //请求成功函数，只会返回json型数据
                    success: function () { },
                    //请求失败函数，ajax请求失败的时候会调用，当服务器返回数据不是json型的时候也会调用
                    error: function () { },
                    //当服务器有最新数据并更新完毕的时候，会调用此函数
                    _success: function () { },
                }
            }

            conf.pagesId = 'pc：' + window.location.href;

            if (window.plus != null) {
                //当前页面的id
                conf.pagesId = plus.webview.currentWebview().id;
            }

            if (conf.server || conf.key == null || window.plus == null) {
                //每次都请求最新的
                o_ajax(conf);
                return;
            }

            if (conf.server === false && conf.key != null) {
                //从本地加载
                origin.fire('pages/ajax/ajax:getData', {
                    key: conf.key,
                    pagesId: conf.pagesId
                }, function (res) {

                    if (res.res == false) {
                        //本地没有数据
                        console.log('本地没有数据，开始从服务器加载。');
                        o_ajax(conf, false);
                    } else {
                        //本地有数据
                        console.log('本地有数据，开始分发。');
                        conf.success(res.data);
                    }

                });

            }

        },

        /**
         * 初始化配置项，
         * 全局只调用一次
         */
        initConfig: function (f) {
            $.getJSON('app.json', function (res) {
                obj.config = res;
                f(obj.config);
            });
        },
        getComponent: function (url, f) {

            url = '../../' + url + '.comp.html';

            $('<div/>').load(url, function (res) {
                f(res)
            });

        },
        /**
         * 预加载配置文件中的窗口，
         * 这里是会加载所有全局配置中的所有窗口，
         * 全局只调用一次
         */
        initLoadPages: function (f) {
            //先把页面列表储存到变量中
            var pages = obj.config.pages;

            for (var i = 0; i < pages.length; i++) {
                obj.loadPage(pages[i]);
            }
            var interval = setInterval(function () {

                //是否加载完成
                var isRead = true;

                for (var i = 0; i < pages.length; i++) {
                    isRead = !(origin.pageList[pages[i]] == null);
                }
                if (isRead) {
                    //加载完成
                    if (f) f();
                    clearInterval(interval);
                }

            }, 100);

        },
        /**
         * 预加载页面
         */
        loadPage: function (id, f) {

            if (window.plus == null) {
                mui.toast('请在手机端预加载页面');
                return;
            }

            var selfPage = plus.webview.currentWebview(); //当前页面
            var launchPage = plus.webview.getLaunchWebview(); //入口文件

            mui.fire(launchPage, 'loadPage', {
                pageId: selfPage.id,
                loadPageId: id,
            });

            var loadFunction = function (e) {

                var page = plus.webview.getWebviewById(id);

                if (f) f(page);

                window.removeEventListener('_loadPage', loadFunction);

            }
            window.addEventListener('_loadPage', loadFunction, false);

        },
        /** 
         * 显示页面
         */
        showPage: function (id) {


            if (window.plus != null) {
                //手机模式

                var selfPage = plus.webview.currentWebview(); //当前页面
                var launchPage = plus.webview.getLaunchWebview(); //入口文件

                mui.fire(launchPage, 'showPage', {
                    pageId: selfPage.id,
                    showPageId: id,
                });

            } else {
                //电脑模式
                window.location.href = '../../' + id + '.html';
            }

        },
        showNav: function () {

            if (!window.plus) {
                window.location.href = '../../' + 'pages/nav/nav.html';
                return;
            }
            var id = 'pages/nav/nav';


            var navPage = plus.webview.getWebviewById(id); //导航栏页面
            var selfPage = plus.webview.currentWebview(); //当前页面

            if (navPage == null) {

                origin.loadPage(id, function (page) {

                    origin.fire(id + ':show', {
                        pageId: selfPage.id
                    });

                    origin.showPage(id);

                });

            } else {

                origin.fire(id + ':show', {
                    pageId: selfPage.id
                });
                origin.showPage(id);
            }


            // 设置当前页面遮罩
            selfPage.setStyle({
                mask: 'rgba(0,0,0,0.4)',
                transition: {
                    duration: 200
                }
            });


        },
        hideNav: function () {

            var selfPage = plus.webview.currentWebview();
            // var navPage = plus.webview.getWebviewById('pages/nav/nav'); //导航栏页面

        },
        close: function (id) {

            if (window.plus == null) {
                return;
            }

            if (id == null) {
                //当前页
                var selfPage = plus.webview.currentWebview();
                id = selfPage.id;
            }


            // closePageId
            var launchPage = plus.webview.getLaunchWebview(); //入口文件
            mui.fire(launchPage, 'closePage', {
                closePageId: id,
            });

        },
        /**
         * 初始化函数，
         * 全局只调用一次
         */
        init: function (f) {
            mui.init();
            mui.plusReady(function () {

                //先异步加载全局配置项

                obj.initConfig(function (config) {
                    //异步加载页面
                    obj.initLoadPages(function () {
                        //调用回调函数
                        if (f) f(config);
                    });

                });

            });

        },
        /**
         * 触发目标窗口事件
         */
        fire: function (a, b, c, d) {
            if (!window.plus) {
                //pc模式
                mui.toast('请在手机端调用[ fire ] 事件');
                console.error('请在手机端调用[ fire ] 事件');
                return;
            }

            //两种模式判断。
            //模式一：id名后面不带函数
            //模式二：id后面带函数

            //开始判断模式： 
            var eventName;
            var id;
            var data;
            var fun;

            //判断id
            a = a.split(':');
            id = a[0]; //id

            if (a.length <= 1) {
                //模式一：id名后面不带函数
                eventName = b; //事件名
                data = c; //数据
                fun = d; //数据

            } else {
                //模式二：id后面带函数
                eventName = a[1]; //事件名
                data = b; //数据
                fun = c; //回调

            }

            var p = plus.webview.getWebviewById(id); //接收事件的窗口
            if (p == null) {
                //窗口未加载
                var info = '窗口未加载：[ ' + id + ' ]';
                console.error(info);
                mui.toast(info);
                return;
            }
            var selfPage = plus.webview.currentWebview(); //发送事件的窗口

            //组装数据
            var _data = {};
            _data.data = data; //发送到另一个窗口的数据
            _data.pageId = selfPage.id; //发送事件的窗口的id，用于事件回调
            _data.eventName = eventName;




            if (fun) {
                //匿名回调函数事件页面a
                var callbackFun = function (e) {

                    var res = e.detail.data;
                    fun(res);
                    window.removeEventListener('callback_a', callbackFun); //注销事件
                }
                //监听事件
                window.addEventListener('callback_a', callbackFun, false);
            }

            mui.fire(p, 'callback_b', _data);

        },
        /**
         * 设置本地储存
         */
        setLocal: function (key, value) {
            if (typeof (value) == 'string') {
                //普通储存
                localStorage.setItem(key, value);
            } else {
                value = JSON.stringify(value);
                localStorage.setItem(key, value);
            }
        },
        /**
         * 获取本地储存
         */
        getLocal: function (key) {
            var value;
            try {
                value = localStorage.getItem(key);
                //正确解析了json
                return value;
            } catch (error) {
                //没有正确解析json
                return localStorage.getItem(key);
            }
        },
        removeLocal: function (key) {
            localStorage.removeItem(key);
        },
        /**
         * 清空本地缓存
         */
        clearLocal: function () {
            localStorage.clear();
        },
        /**
         * 修改标题栏文本
         */
        setTitle: function (title) {
            $('title').text(title);
        }

    };
    return obj;

}());
/**
 * 页面的配置函数
 */
function pages(conf) {

    var debugList;


    if (conf.debug == null) {
        conf.debug = [];
    }

    if (conf.isDebug == false) {
        conf.debug = [];
    } else {

        conf.debug.push(
            { title: "统计打开的页面数量", event: 'getPushAll' }
        );
        conf.methods.getPushAll = function () {
            var length = plus.webview.all().length;
            mui.toast('当前打开的页面数量：' + length);
        }
    }


    debugList = conf.debug;

    delete conf["debug"];

    debug(debugList, function (isDebug) {

        window.isDebug = isDebug;

        var pageApp = initVue(conf);

        if (pageApp != false) {
            if (pageApp.onLoadPage != null) {
                pageApp.onLoadPage();
            }

            if (pageApp.onShow != null) {
                pageApp.onShow();
            }

            mui.plusReady(function () {

                initPage(conf, pageApp, function () {
                    if (pageApp.onLoadPlus != null) {
                        pageApp.onLoadPlus();
                    }
                });

            });

            $("html").animate({ opacity: '1' }, 0);

        }

    });




}

function initVue(conf) {
    //先加上隐藏app属性
    // $(conf.el).attr('v-cloak', 'v-cloak');

    conf.el = '#pageApp';
    //判断pageAPP是否存在

    if ($(conf.el).length <= 0) {
        console.error('请创建#pageApp并将整个内容区包围');
        return false;
    }
    var vueApp = new Vue(conf);
    window.pageApp = vueApp;
    return window.pageApp;
}

function initPage(conf, pageApp, f) {

    var selfPage = plus.webview.currentWebview();

    var jsonName = selfPage.id.split('/');
    jsonName = jsonName[jsonName.length - 1];
    $.getJSON(jsonName + '.json', function (config) {


        if (config.isIndex == true) {
            mui.init({
                keyEventBind: {
                    backbutton: false //关闭back按键监听
                }
            });
        } else {
            mui.init();
        }


        //隐藏导航栏事件
        pageApp.hideNav = function () {
            selfPage.setStyle({
                mask: 'none',
                transition: {
                    duration: 200
                }
            });
        }

        //匿名回调函数事件页面b
        window.addEventListener('callback_b', function (e) {

            var data = e.detail.data; //传来的数据
            var eventName = e.detail.eventName; //想要调用的事件名
            var pageId = e.detail.pageId; //事件返回的页面id

            var selfPage = plus.webview.currentWebview(); //当前页面
            // 事件调用
            pageApp.pageId = pageId;

            if (pageApp[eventName]) {
                pageApp[eventName](data);
            } else {
                console.error('页面 [ ' + selfPage.id + ' ] 的事件不存在 [ ' + eventName + '() ]');
            }

        }, false);

        for (var x in conf.methods) {

            (function (eventName) {
                window.addEventListener(eventName, function (e) {
                    pageApp[eventName](e);
                }, false);
            }(x))

        }

        if (f) f();

    });

}
/** 
 * 向触发本页面函数的页面返回数据
 * 
 */
function push(data, id) {
    var pageApp = window.pageApp;

    if (id == null) {
        id = pageApp.pageId;
    }

    //当前页面的app
    var p = plus.webview.getWebviewById(id); //接收事件的窗口

    mui.fire(p, 'callback_a', {
        data: data
    });


}

function App(conf) {
    window.addEventListener('getApp', function (e) {

        var pageId = e.detail.pageId;
        var page = plus.webview.getWebviewById(pageId); //返回app的目标页面
        mui.fire(page, 'getApp', {
            app: conf.app
        });

    }, false);


    window.addEventListener('closePage', function (e) {

        var closePageId = e.detail.closePageId; //想要关闭的页面
        origin.pageList[closePageId] = null;
        plus.webview.close(closePageId);

    }, false);

    window.addEventListener('showPage', function (e) {

        var pageId = e.detail.pageId; //调用该事件的页面
        var showPageId = e.detail.showPageId; //想要打开的页面

        var page = plus.webview.getWebviewById(showPageId); //要打开的页面



        if (origin.pageList[showPageId] != null) {

            //注册过的页面
            var config = origin.pageList[showPageId].config;
            mui.openWindow(config);

        } else {

            //未注册的页面
            //先预加载在打开

            appLoadPage(pageId, showPageId, function (page) {
                origin.showPage(showPageId);
            });


        }

    }, false);

    window.addEventListener('loadPage', function (e) {

        var pageId = e.detail.pageId; //调用该事件的页面
        var loadPageId = e.detail.loadPageId; //想要加载的页面
        appLoadPage(pageId, loadPageId)

    }, false);

    origin.init(function (f) {
        conf.onLaunch();
    });

}

function appLoadPage(pageId, loadPageId, f) {





    if (origin.pageList[loadPageId] != null) {

        if (f) {
            f(origin.pageList[loadPageId]);
        } else {
            //回到调用者
            var _page_ = plus.webview.getWebviewById(pageId);
            mui.fire(_page_, '_loadPage');
        }

        return;
    }


    $.ajax({
        url: loadPageId + '.json',
        success: function (res) {
            res = JSON.parse(res);

            var a = {
                url: loadPageId + '.html',
                id: loadPageId,
            };
            var b = res.pageConfig;
            var c = $.extend(true, a, b);




            //加载样式
            if (c.styles != null) {

                //加载标题栏
                if (c.styles.titleNView != undefined) {

                    //加载按钮
                    if (c.styles.titleNView.buttons != undefined) {
                        for (var i = 0; i < c.styles.titleNView.buttons.length; i++) {
                            var name = c.styles.titleNView.buttons[i].onclick;
                            c.styles.titleNView.buttons[i].onclick = (function (eveName) {
                                return function () {
                                    origin.fire(loadPageId, eveName);
                                }
                            }(name));

                        }
                    }
                }

            }

            //预加载页面
            var page = mui.preload(c);

            var _page = plus.webview.getWebviewById(loadPageId);


            origin.pageList[loadPageId] = _page;
            origin.pageList[loadPageId].config = c;

            //监听显示事件
            _page.addEventListener('show', function (e) {

                origin.fire(loadPageId, 'onShow');

            }, false);

            //监听关闭事件
            _page.addEventListener('hide', function (e) {

                origin.fire(loadPageId, 'onHide');

            }, false);

            //回到调用者
            var _page_ = plus.webview.getWebviewById(pageId);
            if (f) {
                f(_page);
            } else {
                mui.fire(_page_, '_loadPage');
            }

        },
        error: function () {
            console.error(loadPageId + '.json  文件错误！');
        }
    });
}


function getApp(f) {

    var page = plus.webview.getLaunchWebview(); //入口文件
    var selfPage = plus.webview.currentWebview(); //本页面

    mui.fire(page, 'getApp', {
        pageId: selfPage.id
    });

    var getAppFunction = function (e) {
        var app = e.detail.app;
        f(app);
        window.removeEventListener('getApp', getAppFunction)
    }
    window.addEventListener('getApp', getAppFunction, false);

}

var formatJson = function (json, options) {
    var reg = null,
        formatted = '',
        pad = 0,
        PADDING = '    ';
    options = options || {};
    options.newlineAfterColonIfBeforeBraceOrBracket = (options.newlineAfterColonIfBeforeBraceOrBracket === true) ? true : false;
    options.spaceAfterColon = (options.spaceAfterColon === false) ? false : true;
    if (typeof json !== 'string') {
        json = JSON.stringify(json);
    } else {
        json = JSON.parse(json);
        json = JSON.stringify(json);
    }
    reg = /([\{\}])/g;
    json = json.replace(reg, '\r\n$1\r\n');
    reg = /([\[\]])/g;
    json = json.replace(reg, '\r\n$1\r\n');
    reg = /(\,)/g;
    json = json.replace(reg, '$1\r\n');
    reg = /(\r\n\r\n)/g;
    json = json.replace(reg, '\r\n');
    reg = /\r\n\,/g;
    json = json.replace(reg, ',');
    if (!options.newlineAfterColonIfBeforeBraceOrBracket) {
        reg = /\:\r\n\{/g;
        json = json.replace(reg, ':{');
        reg = /\:\r\n\[/g;
        json = json.replace(reg, ':[');
    }
    if (options.spaceAfterColon) {
        reg = /\:/g;
        json = json.replace(reg, ':');
    }
    (json.split('\r\n')).forEach(function (node, index) {
        var i = 0,
            indent = 0,
            padding = '';

        if (node.match(/\{$/) || node.match(/\[$/)) {
            indent = 1;
        } else if (node.match(/\}/) || node.match(/\]/)) {
            if (pad !== 0) {
                pad -= 1;
            }
        } else {
            indent = 0;
        }

        for (i = 0; i < pad; i++) {
            padding += PADDING;
        }

        formatted += padding + node + '\r\n';
        pad += indent;
    });
    return formatted;
};

// debug
function debug(debugList, f) {


    $.getJSON('../../app.json', function (res) {

        var config = res;

        if (debugList.length <= 0) {
            f(config.debug);
            return;
        }
        if (config.debug) {

            if ($('#pageApp').length <= 0) {
                console.error('debug():页面上没有#pageApp！');
                return;
            }


            $('#pageApp').append('<div class="test-tool">debug</div>');
            var $box = $('<div/>').addClass('test-tool-box');
            var $list = $('<div/>').addClass('test-tool-box-list');
            $box.append($list);

            $('#pageApp').append($box);


            for (var i = 0; i < debugList.length; i++) {
                var item = debugList[i];
                $item = $('<div/>').addClass('test-tool-item');
                $item.attr('v-on:tap.stop', item.event);
                $item.text(item.title);
                $list.append($item);
            }

            $(document).on('touchstart', '.test-tool-item', function () {
                $(this).addClass('active');
            });
            $(document).on('touchend', '.test-tool-item', function () {
                $('.test-tool-box').fadeOut(100);
                $(this).removeClass('active');
            });

            $(document).on('tap', '.test-tool', function () {
                $('.test-tool-box').fadeIn(100);
                return false;
            });

            $(document).on('tap', '.test-tool-box-list', function () {
                return false;
            });

            $(document).on('tap', '.test-tool-box', function () {
                $(this).fadeOut(100);
                return false;
            });
        }
        f(config.debug);


    });

}


//将数字变成千分位

var formatMoney = function (money) {
    money = money + '';
    //分开点
    var _money = money.split('.');
    _money[0] = (_money[0] || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');


    if (_money[1] != null) {
        return (_money[0] + '.' + _money[1]);
    } else {
        return _money[0];
    }
}