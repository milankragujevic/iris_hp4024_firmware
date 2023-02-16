var stb_error_code;

var Utils = window.Utility || {
    getValueByName: function(key) {
        return localStorage.getItem(key);
    },

    setValueByName: function(key, value) {
        localStorage.setItem(key, value);
    },

    getEvent: function() {
        return JSON.stringify({});
    }
};

var STBService = {
    getEPGurl: function() {
        return localStorage.getItem("epgurl");
    },
    getTemplatename: function(key) {
        var value = Utility.getValueByName('Tools.Record.GetRecord' + JSON.stringify({
            key: key
        }));
        return (/^undefined|null|^$/).test(value) ? null : value;
    },
    onSTBEvent: function() {},

    getAllEPGUrls: function() {
        var self = this;
        var urls = [];

        urls.push(this.__getMainEPGUrl());
        urls.push(this.__getBackupEPGUrl());
        urls.push(this.__getLastLoginEPGUrl());

        // http://ip:port/EPG/
        return _.chain(urls).compact().map(function(url) {
            return self.exactBaseEPGUrl(url);
        }).value();
    },

    getUserId: function() {
        return Utils.getValueByName('userid');
    },



    getIp: function() {
        return Utils.getValueByName('stbIP');
    },

    /**
     * 从路径中解析出服务器地址
     * http://ip:port/EPG/sp/etb/eBase.html' ==> http://ip:port/EPG/
     * @return {String} serverUrl
     */
    exactBaseEPGUrl: function(server_url) {
        return (/(.*EPG\/|.*EDS\/)/).exec(server_url)[1];
    },

    /**
     * 根据MainUrl获取模板根路径
     * http://ip:port/EPG/jsp/etb/eBase.html'  =>  "/jsp/etb/
     * @return {String} templateRootPath
     */
    getTemplateRootPath: function() {
        return (/(EPG\/|EDS\/)(.*\/)/).exec(this.__getMainEPGUrl())[2];
    },

    epgReady: function() {
        Utils.setValueByName('EPGReady', "XXXX");
    },
    /**
     * 关闭STB
     */
    shutDownSTB: function() {
        Utils.setValueByName("hw_op_stb", "fullPowerOff");
    },

    /**
     * 打开设置页面
     */
    openSetPage: function() {
        Utils.setValueByName("hw_op_stb", "setpage");
    },

    /**
     * 重启STB
     */
    restart: function() {
        Utils.setValueByName('hw_op_restart', 'XXXX');
    },

    /**
     * 升级等待事件
     */
    upgradeStartWait: function(IP) {
        Utils.setValueByName('upgradeStart_wait', 'cancel,' + IP);
    },

    /**
     * 重新加载STB页面
     */
    reload: function() {
        location.reload();
    },

    getReStartFlag: function() {
        return this.reStart;
    },

    /**
     * 调度EPG
     * @return {Deferred|String}
     */
    dispatchEPGServer: function(success_cb, fail_cb) {

        var self = this;
        /*  var epg_urls = STBService.getAllEPGUrls();
        console.log('try to dispatch: ' + epg_urls);

        if (_.isEmpty(epg_urls)) {
            return fail_cb('can not get any server url.');
        }
        // 多次调度EPG
        var dispatch_epg = function(index) {
            var epg_url = epg_urls[index];
            if (epg_url) {

                $.ajax({
                    url: epg_url + 'XML/Login',
                    dataType: 'text',
                    type: 'post',
                    complete: function(resp) {
                        var matchs = (/<epgurl>(.*)<\/epgurl>/).exec(resp.responseText);
                        if (matchs) {
                            success_cb(matchs[1] + '/EPG/');
                        } else {
                            // 尝试调度下一个
                            dispatch_epg(++index);
                        }
                    }
                });
            } else {
                fail_cb('dispatch_fail');
            }
        };

        dispatch_epg(0);*/

        if (this.TMSRestart) {
            return;
        }
        var epgUrl = STBService.getEPGurl();
        self.templatename = STBService.getTemplatename('tempname') ? STBService.getTemplatename('tempname') : "default_skyworth";
        console.log('dispatchEPGServer_templatename = ' + self.templatename + ' epgUrl = ' + epgUrl);
        $.ajax({
            'url': epgUrl + '/jsp/' + self.templatename + '/index.html',
            'async': false
        }).fail(function(jqDfd) {
            console.error('check server status fail, url[%s], status[%s].', '/jsp/' + self.templatename + '/index.html', jqDfd.status);
            self.templatename = "default_skyworth";
        }).done(function() {
            console.debug('check server status success, url[%s].');
        });
        if (epgUrl) {
            success_cb(epgUrl + "/jsp/" + self.templatename);
        } else {
            fail_cb('dispatch_fail');
        }
    },

    __getMainEPGUrl: function() {
        return Utils.getValueByName("Main_HomepageUrl") || 'http://' + location.host + '/EPG/mqm/eBase.html';
    },

    __getBackupEPGUrl: function() {
        return Utils.getValueByName("Secondary_HomepageUrl");
    },

    __getLastLoginEPGUrl: function() {
        return Utils.getValueByName("epgurl");
    },

    handleEvent: function(event) {

        console.log("handleEvent:" + event.which);

        switch (event.which) {
            case 768:
                // 机顶盒事件
                // 将STB事件的字符串转换为JSON对象
                var stb_event_str = Utility.getEvent();
                var stb_event = JSON.parse(stb_event_str);
                stb_event.type = stb_event.type || '';
                if ('EVENT_NEW_VERSION' === stb_event.type) {
                    STBService.upgradeStartWait(stb_event.path);
                } else if ((stb_event.type == "EVENT_AUTHENTICATION_READY") || (stb_event.type == "EVENT_STB_RESTORE")) {
                    location.href = "../miniepg/index.html";
                } else if (stb_event.type === "EVENT_USER_INFO_TMS_UPDATED") {
                    document.getElementById("content").innerHTML = "";
                    document.getElementById("ctitle").innerHTML = "STB will restart 5 seconds later, do you need to restart immediately ?";
                    document.getElementById("error_page").style.visibility = "visible";
                    this.TMSRestart = true;

                    setTimeout(function() {
                        Utility.setValueByName('hw_op_restart', 'XXXX');
                    }, 5 * 1000);
                }
                console.log('STB_EVENT' + stb_event_str);

                this.onSTBEvent(stb_event);
                break;

            case 256:
                this.shutDownSTB();
                break;
            case 8:
                return 0;
            case 285:
                stbService.openSetPage();
                break;
            default:
                break;
        }

        return 0;
    }
};
var lang = Utils.getValueByName('lang');


document.onkeydown = _.bind(STBService.handleEvent, STBService);
document.onsystemevent = _.bind(STBService.handleEvent, STBService);

//Utils.setValueByName("ShowPic", "2");


var i18n = {
    message: {},

    cultureName: 'lang_1',


    locale: function(str) {
        var mapping = this.message[this.cultureName] || {};
        return mapping[str] || this.message['lang_1'][str];
    },

    culture: function(str) {
        this.cultureName = str;
    },

    addCulture: function(culture, message) {
        this.message[culture] = this.message[culture] || {};
        _.extend(this.message[culture], message);
    }
};
i18n.culture("lang_" + lang);
i18n.addCulture('lang_2', {
    '102001': 'Network Exception.',
    '102003': 'IP address conflict.',
    '102004': 'Network Exception.',
    '102005': 'Network Exception.',
    '102006': 'Network Exception.',
    '102007': 'Network Exception.',
    '102011': 'Service is temporarily unavailable.',
    '102013': 'Service is temporarily unavailable.',
    '102014': 'Service is temporarily unavailable.',
    '102015': 'Network Exception.',
    '102016': 'Service is temporarily unavailable.',
    'dispatch_fail': 'Network Exception.',
    'error': 'Network Exception.',
    'obsolete': 'Network Exception.',
    'iframe_timeout': 'Network Exception.',
    'default_error': 'Network Exception.',
    'loading': 'Loading...',
    'retry': 'Retry',
    'quit': 'Quit',
    'note': 'Note',
    'more_help': 'Please try again. If the problem persists, contact your service provider.'
});

i18n.addCulture('lang_1', {
    '102001': 'Greška na mreži.',
    '102003': 'Neusaglašenost IP adrese.',
    '102004': 'Greška na mreži.',
    '102005': 'Greška na mreži.',
    '102006': 'Greška na mreži.',
    '102007': 'Greška na mreži.',
    '102011': 'Usluga je trenutno nedostupna.',
    '102013': 'Usluga je trenutno nedostupna.',
    '102014': 'Usluga je trenutno nedostupna.',
    '102015': 'Greška na mreži.',
    '102016': 'Usluga je trenutno nedostupna.',
    'dispatch_fail': "Greška na mreži.",
    'error': "Greška na mreži.",
    'obsolete': "Greška na mreži.",
    'iframe_timeout': "Greška na mreži.",
    'default_error': "Greška na mreži.",
    'loading': "Učitavam…",
    'retry': "Pokušajte ponovo",
    'quit': "da odustanete",
    'note': "Napomena",
    'more_help': "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
});


var retry_count = 0;
var RETRY_COUNT_MORE_HELP = 3;
var View = function() {
    $('#info_title').text(i18n.locale('retry') + '?');
    $('#retry').text(i18n.locale('retry')).off('click');
    $('#quit').text(i18n.locale('quit')).off('click');
    $('#note_title').text(i18n.locale('note'));
    $('#title').text(i18n.locale('loading'));
};

View.prototype = {

    'retry': function() {

    },

    'quit': function() {
        location.href = '../miniepg/onekeytest.html';
        //return Utils.setValueByName('exitIptvApp');
    },

    'success': function(template_url) {
        this.progress(1, 1);
        _.defer(function() {
            console.log('jump to :' + template_url);
            if (STBService.TMSRestart) {
                return;
            }
            location.href = template_url;
        });
    },

    'fail': function(err) {
        $('#loading').hide();
        $('#action_alert_page').show();
        var self = this;
        var code = stb_error_code || err;
        console.error("application cache error:" + code);
        var msg = i18n.locale(code) || i18n.locale('default_error');
        $('#operate_title').text(msg);
        $('#retry').click(function() {
            self.retry();
            retry_count++;
            $('#loading').show();
            $('#action_alert_page').hide();
            if (retry_count >= RETRY_COUNT_MORE_HELP) {
                $('#confirm_title').text(i18n.locale('more_help'));
            }
        });
        $('#quit').click(_.bind(this.quit, this));
    },

    'progress': function(loaded, total) {

        $('#loading').show();
        $('#action_alert_page').hide();
        $('#progress').css('width', 100 * (loaded / total) + '%');
    }
};


var Manifest = function(view, template_url) {
    this.timeoutId = null;
    this.view = view;
    this.templateUrl = template_url;
    this.hidePic = true;
};

Manifest.prototype = {
    load: function() {
        var self = this;
        var timeout_cb = _.bind(this.timeoutFail, this);

        $('iframe').remove();

        var $iframe = $("<iframe>").css('display', 'none').appendTo('body');

        $iframe.on('load', function() {
            console.log('iframe on load:' + manifest_url);
            console.log(this.contentDocument.querySelector('html').innerHTML);
            self.timeoutId = setTimeout(timeout_cb, 1500);
        });
        // location.href = manifest_url;

        $iframe.attr('src', manifest_url);
    },

    timeoutFail: function() {
        document.body.style.display="block";
        Utils.setValueByName("ShowPic", "2");
        this.view.fail('iframe_timeout');
    },
    
    onMessage: function(event) {
        var data = event.data;
        console.log('onMessage :' + JSON.stringify(_.pick(data, 'type', 'status', 'loaded', 'total')));

        clearTimeout(this.timeoutId);
        //var hidePic = true;

        switch (data.type) {
            case "progress":
                if (this.hidePic) {
                    console.log('onMessage this.hidePic:' + this.hidePic);
                    document.body.style.display="block"
                    Utils.setValueByName("ShowPic", "2");
                    this.hidePic = false;
                }

                this.view.progress(data.loaded, data.total);
                break;

            case "cached":
            case "noupdate":
            case "updateready":
                this.hidePic = true;
                 this.view.success(this.templateUrl);
                 Utils.setValueByName("ShowPic", "1");
                break;

            case "error":
            case "obsolete":
                 document.body.style.display="block"
                Utils.setValueByName("ShowPic", "2");
                this.view.fail(data.type);
                break;
        }
    }
};


$(document).keydown(function(event) {
    if (0 === $('.focus-item:visible').length) {
        return;
    }
    var index = _.indexOf($('.focus-item'), $('.focus-item.focus')[0]);

    switch (event.which) {

        case 37: // Left
            index--;
            break;

        case 39: // Right
            index++;
            break;

        case 13:
            if (STBService.TMSRestart) {
                Utility.setValueByName('hw_op_restart', 'XXXX');
            } else {
                $('.focus').click();
            }

            break;
    }

    var next_item = $('.focus-item')[index];
    if (next_item) {
        $('.focus-item').removeClass('focus');
        $(next_item).addClass('focus');
    }
});


// =================================[Begin] 处理STB事件
STBService.onSTBEvent = function(event) {
    var is_fatal_error = _.contains(['EVENT_IP_ADDRESS_CHANGED', 'EVENT_STB_ERROR'], event.type);

    if (is_fatal_error) {
        stb_error_code = event.error_code;
    }
};
// =================================[End]