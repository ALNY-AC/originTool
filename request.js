// @ts-nocheck


var modList = {};

function request(list, f) {

    if (list.length <= 0) {
        return;
    }

    if (typeof (list) == 'string') {
        list = [list];
    }

    for (var i = 0; i < list.length; i++) {

        var url = list[i];

        modList[url] = {
            isLoad: false,
        }

        loadMod(url);
    }
    validate(f);

}
function validate(f) {
    var interval = setInterval(function () {

        var isLoad = true;

        for (var x in modList) {
            if (!modList[x].isLoad) {
                isLoad = false;
            }
        }

        if (isLoad) {

            if (f != null && typeof (f) == 'function') {
                try {
                    f();
                } catch (error) {
                    console.error(error);
                }
            } else {
                console.warn('request回调函数未定义');
            }
            clearInterval(interval);
        }

    }, 100);

}
function loadMod(url) {


    if (url.indexOf('.js') >= 0) {

        //js 
        var _script = document.createElement('script');
        _script.type = 'text/javascript';
        _script.charset = 'utf-8';
        _script.async = true;
        _script.src = url;
        _script.onload = function () {
            modList[url].isLoad = true;
        }

        document.body.appendChild(_script);

        modList[url].$script = _script;
    }

    if (url.indexOf('.css') >= 0) {
        //css 

        var _link = document.createElement('link');
        _link.rel = 'stylesheet';
        _link.type = "text/css"
        _link.href = url;
        _link.onload = function () {
            modList[url].isLoad = true;
        }

        document.head.appendChild(_link);

        modList[url].$script = _link;

    }
}
function init() {

    var name = window.location.href.split('/');
    name = name[name.length - 1];
    name = name.split('.') [0];

    // request(["../../utils/mui/css/mui.min.css"], function () { })
    // request(["../../utils/font/css/font-awesome.min.css"], function () { })
    // request(["../../utils/origin/origin.css"], function () { })
    // request(["../../app.css"], function () { })
    // request(["orderQuery.css"], function () { })



    // "../../utils/mui/js/mui.min.js",
    // "../../utils/mui/css/mui.min.css",

    request([
        '../../utils/jquery/jquery.js',
    ], function () {





        $.getJSON('../../app.json', function (res) {
            var list = res.request;

            //先导入全局依赖
            request(list, function () {
                //再导入page依赖
                $.getJSON(name + '.json', function (res) {
                    var _list = res.request;
                    request(_list, function () {
                        //最后导入自定义依赖
                        request([name + ".css"], function () { })
                        request([name + ".js"], function () { })

                    });

                });

            });


        });

    });

}


init();

