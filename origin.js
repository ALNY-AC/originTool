// @ts-nocheck
const origin = (function () {

    var obj = {
        /**
         * 全局配置项
         */
        config: {},
        pageList: {},
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

            var selfPage = plus.webview.currentWebview();//当前页面
            var launchPage = plus.webview.getLaunchWebview();//入口文件

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

            var selfPage = plus.webview.currentWebview();//当前页面
            var launchPage = plus.webview.getLaunchWebview();//入口文件

            mui.fire(launchPage, 'showPage', {
                pageId: selfPage.id,
                showPageId: id,
            });



            return;
            //先找找看有没有相关窗口A
            var p = plus.webview.getWebviewById(id);
            if (p != null) {

                //已有数据，直接加载

                if (origin.pageList[id] != null) {
                    //代表是入口文件，通过入口文件的配置打开
                    var config = origin.pageList[id].config;
                    mui.openWindow(config);
                } else {
                    //否则就ajax取得配置

                    $.getJSON('../../' + id + '.json', function (conf) {

                        var a = {
                            url: id + '.html',
                            id: id,
                        };
                        var b = conf.pageConfig;
                        var c = $.extend(true, a, b);
                        mui.openWindow(c);

                    });

                }

            } else {

                origin.loadPage(id, function (page) {
                    mui.openWindow({
                        id: id,
                    });
                });
            }
        },
        showNav: function () {

            var p = plus.webview.getWebviewById('pages/nav/nav'); //导航栏页面
            var selfPage = plus.webview.currentWebview(); //当前页面

            // 设置当前页面遮罩
            selfPage.setStyle({
                mask: 'rgba(0,0,0,0.4)',
                transition: {
                    duration: 200
                }
            });

            //取得导航栏页面的配置项
            $.getJSON('../../pages/nav/nav' + '.json', function (res) {
                var a = {
                    url: p.id + '.html',
                    id: p.id,
                };
                var b = res.pageConfig;
                var c = $.extend(true, a, b);
                origin.fire('pages/nav/nav', 'show', {
                    pageId: selfPage.id
                });
                mui.openWindow(c);

            });

        },
        close: function (id) {
            obj.pageList[id] = null;
            plus.webview.close(id);
        },
        /**
         * 修改当前页标题
         */
        setTitle: function (title) {

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
            id = a[0];//id

            if (a.length <= 1) {
                //模式一：id名后面不带函数
                // console.log('模式一');
                eventName = b;//事件名
                data = c;//数据
                fun = d;//数据

            } else {
                //模式二：id后面带函数
                // console.log('模式二');
                eventName = a[1];//事件名
                data = b;//数据
                fun = c;//数据    

            }

            var p = plus.webview.getWebviewById(id);//接收事件的窗口
            if (p == null) {
                //窗口未加载
                var info = '窗口未加载：[ ' + id + ' ]';
                console.error(info);
                mui.toast(info);
                return;
            }
            var selfPage = plus.webview.currentWebview();//发送事件的窗口

            //组装数据
            var _data = {};
            _data.data = data;//发送到另一个窗口的数据
            _data.pageId = selfPage.id;//发送事件的窗口的id，用于事件回调
            _data.eventName = eventName;

            if (fun) {
                //匿名回调函数事件页面a
                var callbackFun = function (e) {

                    var res = e.detail.data;
                    fun(res);
                    window.removeEventListener('callback_a', callbackFun);//注销事件
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



    var pageApp = initVue(conf);
    if (pageApp.onLoadPage != null) {
        pageApp.onLoadPage();
    }

    mui.plusReady(function () {

        initPage(conf, pageApp, function () {
            if (pageApp.onLoadPlus != null) {
                pageApp.onLoadPlus();
            }
        });

    });



}


function initVue(conf) {
    //先加上隐藏app属性
    $(conf.el).attr('v-cloak', 'v-cloak');

    conf.el = '#pageApp';

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

            var data = e.detail.data;//传来的数据
            var eventName = e.detail.eventName;//想要调用的事件名
            var pageId = e.detail.pageId;//事件返回的页面id

            var selfPage = plus.webview.currentWebview();//当前页面
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

    })

}
/** 
 * 向触发本页面函数的页面返回数据
 * 
*/
function push(data, f) {

    //当前页面的app
    var pageApp = window.pageApp;
    var p = plus.webview.getWebviewById(pageApp.pageId);//接收事件的窗口

    mui.fire(p, 'callback_a', {
        data: data
    });

}

function App(conf) {
    window.addEventListener('getApp', function (e) {

        var pageId = e.detail.pageId;
        var page = plus.webview.getWebviewById(pageId);//返回app的目标页面
        mui.fire(page, 'getApp', {
            app: conf.app
        });

    }, false);

    window.addEventListener('showPage', function (e) {

        var pageId = e.detail.pageId;//调用该事件的页面
        var showPageId = e.detail.showPageId;//想要打开的页面

        var page = plus.webview.getWebviewById(showPageId);//要打开的页面

        if (origin.pageList[showPageId] != null) {
            //注册过的页面
            var config = origin.pageList[showPageId].config;
            mui.openWindow(config);

        } else {

            //未注册的页面
            //先预加载在打开
            origin.loadPage(showPageId, function (page) {

                mui.openWindow({
                    id: showPageId,
                });

            });

        }


    }, false);

    window.addEventListener('loadPage', function (e) {

        var pageId = e.detail.pageId;//调用该事件的页面
        var loadPageId = e.detail.loadPageId;//想要加载的页面

        $.getJSON(loadPageId + '.json', function (res) {
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
                            c.styles.titleNView.buttons[i].onclick = function (eventName) {
                                return function () {
                                    origin.fire(loadPageId, eventName);
                                }
                            }(name);
                        }
                    }
                }

            }

            //预加载页面
            var page = mui.preload(c);

            //监听显示事件
            page.addEventListener('show', function (e) {
                origin.fire(loadPageId, 'onShow');
            }, false);

            //监听关闭事件
            page.addEventListener('hide', function (e) {
                origin.fire(loadPageId, 'onHide');
            }, false);

            origin.pageList[loadPageId] = page;
            origin.pageList[loadPageId].config = c;


            var _page = plus.webview.getWebviewById(pageId);

            mui.fire(_page, '_loadPage');

        });

    }, false);


    origin.init(function (f) {

        conf.onLaunch();

    });

}

function getApp(f) {

    var page = plus.webview.getLaunchWebview();//入口文件
    var selfPage = plus.webview.currentWebview();//本页面

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

