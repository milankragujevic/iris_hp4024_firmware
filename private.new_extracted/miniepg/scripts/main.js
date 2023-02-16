$(function() {
    var log = function(str, level) {
        console.log("MiniEPG | " + str);
    };
    if (!window["Utility"]) {
        window["Utility"] = {
            isMock: true,

            trigger: function(event /*type,error_code*/ ) {
                this.event = event;
                document.onkeydown({
                    which: 768
                });
            },

            getValueByName: function(key) {
                return localStorage.getItem(key);
            },
            setValueByName: function(key, value) {
                localStorage.setItem(key, value);
            },
            getEvent: function() {
                return JSON.stringify(this.event);
            }
        };
        window["iPanel"] = {
            ioctlRead: function() {}
        };
    }
    var lang = Utility.getValueByName('lang');
        var language = "en";
        if (lang == 1) {
            language = "ts";
        }
    var randomColor = function() {
        return '#' + (function lol(m, s, c) {
            return s[m.floor(m.random() * s.length)] + (c && lol(m, s, c - 1));
        })(Math, '0123456789ABCDEF', 4);
    };

    var iptv = {
        login: function(options /* url,userId */ ) {
            console.log("login :" + options.url);
            var url = options.url;
            var userId = options.userId || "";
            var matchs = /(^.*\/)(EPG|EDS)/.exec(url);
            var retDfd = $.Deferred();

            if (_.isEmpty(matchs)) {
                retDfd.reject({
                    retcode: "bootstrap_url_error",
                    description: "bootstrap url configure error," + url
                });
            } else {
                var baseUrl = matchs[0];
                var dfd = $.ajax({
                    url: baseUrl + "/XML/Login?UserID=" + userId,
                    dataType: "text",
                    timeout: 30 * 1000,
                    type: "POST"
                });

                dfd.done(function(text) {
                    var matchs = /<epgurl>(.*)<\/epgurl>/.exec(text);
                    retDfd.resolve({
                        retcode: 0,
                        epgUrl: matchs[1] + "/EPG"
                    });
                });

                dfd.fail(function(error) {
                    retDfd.reject({
                        retcode: "network_error",
                        description: error.status + "_" + error.statusText
                    });
                });

            }

            return retDfd;
        },

        threeTimesLogin: function() {
            var self = this;
            var urlList = [];
            urlList.push(stbService.getMainAuthUrl());
            urlList.push(stbService.getSecondaryAuthUrl());
            urlList.push(stbService.getEPGUrl());
            urlList.push(stbService.getTemplatename('tempname'));
            console.log("stbService.getMainAuthUrl() = " + stbService.getMainAuthUrl() + " --- stbService.getSecondaryAuthUrl() = " + stbService.getSecondaryAuthUrl() + 
                " --- stbService.getEPGUrl() = " + stbService.getEPGUrl() + " --- stbService.getTemplatename() = " + stbService.getTemplatename('tempname'));
            console.log("urlList = " + urlList);
            var dfd = $.Deferred().reject({
                retcode: "no_bootstrap_url"
            });

            console.warn("urlList", _.compact(urlList));
            _.each(_.compact(urlList), function(url) {
                var tmp = $.Deferred();
                dfd.fail(function() {
                    self.login({
                        url: url
                    }).then(tmp.resolve, tmp.reject);
                }).done(tmp.resolve);
                dfd = tmp;
            });

            return dfd;
        }
    };
    var stbService = {
        getSTBEvent: function() {
            return JSON.stringify(Utility.getEvent());
        },

        getUserId: function() {
            return Utility.getValueByName("ntvuseraccount");
        },

        getMainAuthUrl: function() {
            return Utility.getValueByName("Main_HomepageUrl");
        },

        getMacAddress: function() {
            return Utility.getValueByName("MACAddress");
        },

        getVersion: function() {
            return Utility.getValueByName("SoftwareVersion");
        },

        getAccessMode: function() {
            var mode = Utility.getValueByName("connecttype");
            if (mode == 1) {
                return mode = "PPPoE";
            } else if (mode == 2) {
                return mode = "DHCP";
            } else {
                return mode = "StaticIP";
            }
        },

        getIP: function() {
            return iPanel.ioctlRead("Network.op.NetIP");
        },

        getGateway: function() {
            return iPanel.ioctlRead("Network.op.NetGateway");
        },

        getSecondaryAuthUrl: function() {
            return Utility.getValueByName("Secondary_HomepageUrl");
        },
        getEPGUrl: function() {
            return localStorage.getItem("epgurl");
        },
        setEPGUrl: function(epgUrl) {
            return localStorage.setItem("epgurl", epgUrl);
        },
        setTemplatename: function(key, value, type) {
            type = type || 3;

            var obj = {
                key: key,
                value: value,
                type: type
            };
            return Utility.setValueByName("Tools.Record.AddRecord", JSON.stringify(obj));
        },
        getTemplatename: function(key) {
            var value = Utility.getValueByName('Tools.Record.GetRecord' + JSON.stringify({
                key: key
            }));
            return (/^undefined|null|^$/).test(value) ? null : value;
        },
        shutDownSTB: function() {
            Utility.setValueByName("hw_op_stb", "fullPowerOff");
        },
        openSetPage: function() {
            Utility.setValueByName("hw_op_stb", "setpage");
        },
        epgReady: function() {
            Utility.setValueByName('EPGReady', "XXXX");
        },
        upgradwait: function(path) {
            Utility.setValueByName('upgradeStart_wait', 'cancel,' + path);
        },

        upgradeStart: function() {
            Utility.setValueByName("hw_op_upgradeStart", '{"path":"IP"}');
        },
        cancleUpgrade: function() {
            Utility.setValueByName("currentUpgrade", "cancel");
        },
        write: function(key, value) {
            var ret = Utility.setValueByName(key, value + "");
            return ret;
        },
    };
    stbService.epgReady();
    var cangotoSettingPage = 0;
    var intervalId = null;
    var codeStr = "";
    var map = {};
    map["35"] = "#";
    map["105"] = "#";
    map["48"] = "0";
    map["49"] = "1";
    map["50"] = "2";
    map["51"] = "3";
    map["52"] = "4";
    map["53"] = "5";
    map["54"] = "6";
    map["55"] = "7";
    map["56"] = "8";
    map["57"] = "9";
    map["106"] = "*";

    var batchEvent = function(ascii) {
        codeStr = codeStr + map[ascii];
        clearTimeout(intervalId);

        intervalId = setTimeout(function() {

            log("Batch Code: " + codeStr);
            if (processMap[codeStr]) {
                processMap[codeStr]();
            }
            codeStr = "";
            document.getElementById("setDiv").innerHTML = "";
        }, 3 * 1000);
    };

    var processMap = {
        "*104030*": function() {
            cangotoSettingPage = 1;
         }
    };

    var eventManager = {
        authenticationReady: false,
        showCheckPage: false,
        reStart: false,
        /**
         * 事件管理器启动，捕获按键事件
         */
        start: function(desktop) {
            console.log(" 444");
            var handler = _.bind(this.handleEvent, this);
            document.onkeydown = handler;
            document.onsystemevent = handler;
        },

        handleEvent: function(event) {
            console.log("handleEvent:" + event.which);
            //batchEvent(event.which);

            switch (event.which) {
                case 768:
                    // 机顶盒事件
                    var eventString = Utility.getEvent();
                    var eventJson = JSON.parse(eventString);
                    var typeStr = eventJson ? eventJson.type : "";
                    console.log(" 111  typeStr = " + typeStr);
                    if (typeStr == "EVENT_AUTHENTICATION_READY") {
                        this.authenticationReady = true;
                        start();
                    } else if ((typeStr == "EVENT_IP_ADDRESS_CHANGED") || (typeStr == "EVENT_USER_INFO_TMS_UPDATED")) {
                        Utility.setValueByName("ShowPic", "2");
                        //document.getElementById("onekeyTest_window").style.visibility = "hidden";
                        document.getElementById("content").innerHTML = "";
                        document.getElementById("ctitle").innerHTML = defaultMessage[language + "_restart"];
                        document.getElementById("error_page").style.visibility = "visible";
                        this.reStart = true;
                        setTimeout(function() {
                            Utility.setValueByName('hw_op_restart', 'XXXX');
                        }, 5 * 1000);
                    } else if (typeStr == "EVENT_STB_ERROR") {
                        this.showError(eventJson);
                    } else if (typeStr == "EVENT_STB_RESTORE") {
                        console.log(" 222  authenticationReady = " + this.authenticationReady);
                        if (this.authenticationReady && (eventJson.error_code == 102001 || eventJson.error_code == 102004 || eventJson.error_code == 102005 || eventJson.error_code == 102007 || eventJson.error_code == 102016)) {
                            console.log(" 333");
                            start();
                        }
                    } else if (typeStr == "EVENT_NEW_VERSION") {
                        this.doSelect();
                        Utility.setValueByName("ShowPic", "2");
                        document.getElementById("new_version_page").style.visibility = "visible";
                        stbService.upgradwait(eventJson.path);
                        updateSTBTest.leftAction();
                    }
                    break;
                case 285:
                    if(cangotoSettingPage == 1){
                        stbService.openSetPage();
                    }
                    // eventJson.type = "SET_KEY";
                    break;
                case 256:
                    // eventJson.type = "POWER_KEY";
                    stbService.shutDownSTB();
                    break;
                    //LEFT_KEY
                case 37:
                    if (document.getElementById("new_version_page").style.visibility == "visible") {
                        updateSTBTest.leftAction();
                    }
                    break;
                    //RIGHT_KEY
                case 39:
                    if (document.getElementById("new_version_page").style.visibility == "visible") {
                        updateSTBTest.rightAction();
                    }
                    break;
                    // eventJson.type = "OK_KEY"
                case 13:
                    if (document.getElementById("new_version_page").style.visibility == "visible") {
                        updateSTBTest.okAction();
                    } else if (this.reStart) {
                        Utility.setValueByName('hw_op_restart', 'XXXX');
                    } else if (document.getElementById("error_page").style.visibility == "visible") {
                        location.href = "../miniepg/onekeytest.html";
                    }
                    break;
                case 8:
                    stbService.epgReady();
                    //  }
                    break;
                case 48:
                case 49:
                case 50:
                case 51:
                case 52:
                case 53:
                case 54:
                case 55:
                case 56:
                case 57:
                case 35:
                case 105:
                case 106:
                    batchEvent(event.which);
                    // eventJson.type = "NUM_KEY";
                    // eventJson.param = event.which * 1 - 48; // 此处要适配机顶盒键值表
                    document.getElementById("setDiv").innerHTML += map[event.which];
                    break;
                case 913979:
                    stbService.openSetPage();
                    break;
                case 1111:
                    Utility.setValueByName('exitIptvApp','XXXX');
                    break;   
                default:
                    break;
            }
        },
        doSelect: function() {
            if (document.getElementById("error_page").style.visibility == "visible") {
                document.getElementById("error_page").style.visibility = "hidden";
            }
        },
        showLogo: -1,
        showError: function(event) {
            Utility.setValueByName("ShowPic", "2");
            clearInterval(this.showLogo);
            var errorObj = errorMap[event.error_code];
            if (event.error_code == 102003) {
                document.getElementById("error_page").style.visibility = "hidden";
                document.getElementById("error_icon").style.background = 'url(' + errorObj.logoUrl + ')';
                this.showLogo = setTimeout(function() {
                    document.getElementById("error_icon").style.background = 'url(img/dot.gif)';
                }, 3 * 1000);
            } else {
                errorObj.suggestion = errorObj[language + "_suggestion"];
                errorObj.description = errorObj[language + "_detail"];
                var errorId = errorObj.code;
                var errorDesc = errorObj.description + "(" + errorId + ")";
                document.getElementById("content").innerHTML = defaultErrorMap[language + "_infodisplay_desc_code"] + errorId;
                document.getElementById("ctitle").innerHTML = errorDesc;
                document.getElementById("error_page").style.visibility = "visible";
                document.getElementById("error_icon").style.background = 'url(' + errorObj.logoUrl + ')';
            }

        },
        popMessage: function(json /* retcode,description */ ) {
            console.log(["code:" + json.retcode, "description:" + json.description, "reload page?"].join("\n"));
            console.log(" ------------- this.showCheckPage = " + this.showCheckPage);
            if (this.showCheckPage) {
                document.getElementById("error_page").style.visibility = "hidden";
            } else {
                var ctitleDesc = defaultErrorMap["en_infodisplay_desc"];
                console.log(" -------------503 = " + json.description.indexOf('503') != -1 );
                if(json.description.indexOf('503') != -1){
                    console.log(" ----------2---503 = string");
                    ctitleDesc = defaultErrorMap["en_http_503"];
                }
                Utility.setValueByName("ShowPic", "2");
                document.getElementById("content").innerHTML = defaultErrorMap["en_infodisplay_desc_code"] + json.retcode;
                document.getElementById("ctitle").innerHTML = ctitleDesc;
                document.getElementById("error_page").style.visibility = "visible";
            }
        },
    };

    var getClientRect = function() {
        var winW = screen.width || 1280,
            winH = screen.height || 720;

        var ret = {
            width: winW,
            height: winH
        };

        return ret;
    };

    var getParam = function() {
        var url = stbService.getMainAuthUrl() || stbService.getSecondaryAuthUrl();
        if (url) {
            return url.split("?")[1];
        }
    };

    // PostMessage监听
    var addPostMessageListener = function() {
        var onMessage = function(e) {
            switch (e.data) {
                case "TEMPLATE_READY":
                    // alert("iframe loaded");
                    console.log("iframe loaded");
                    releaseMiniEPGFocus();
                    break;
                default:
            }
        };

        //监听postMessage消息事件
        if (typeof window.addEventListener != 'undefined') {
            window.addEventListener('message', onMessage, false);
        } else if (typeof window.attachEvent != 'undefined') {
            window.attachEvent('onmessage', onMessage);
        }
    };

    var releaseMiniEPGFocus = function() {
        $("#templateIframe").focus();
    };

    var start = function() {
        if (eventManager.reStart) {
            return;
        }
        // document.getElementById("onekeyTest_window").style.visibility = "hidden";
        document.getElementById("new_version_page").style.visibility = "hidden";
        console.log("start");
        document.getElementById("error_page").style.visibility = "hidden";
        document.getElementById("error_icon").style.background = 'url(img/dot.gif)';

        // 添加对子窗口消息的监听
        addPostMessageListener();
        var self = this;
        iptv.threeTimesLogin().done(function(resp) {

            if (document.getElementById("new_version_page").style.visibility == "hidden") {
                var epgUrl = resp.epgUrl;
                self.templatename = stbService.getTemplatename('tempname');
                console.log("----main.js---resp.templatename = " + self.templatename);
                self.templatename = self.templatename ? self.templatename :"default_skyworth";
                console.log("----main.js---templatename = " + self.templatename);
                stbService.setEPGUrl(epgUrl);
                stbService.setTemplatename('tempname', self.templatename, '3');
                $.ajax({
                    'url': epgUrl + "/jsp/" + self.templatename + "/index.html",
                    'async': false
                }).fail(function(jqDfd) {
                    console.error('check server status fail, url[%s], status[%s].', '/jsp/' + self.templatename + '/index.html', jqDfd.status);
                    self.templatename = "default_skyworth";
                }).done(function() {
                    console.debug('check server status success, url[%s].');
                });
                var startupJSPath = epgUrl + "/jsp/" + self.templatename + "/index.html";
                var param = getParam();
                if (param) {
                    startupJSPath = startupJSPath + "?" + param;
                }
                if (eventManager.reStart) {
                    return;
                }
                // var $iframe = $("#templateIframe");
                // $iframe.css(getClientRect());
                // $iframe.attr("src", startupJSPath);
                window.location.href = '../miniepg/mainfest.html' //startupJSPath;
                // eventManager.popMessage(resp);
                console.log("=================== startup :" + startupJSPath);
            }
        }).fail(function(resp) {
            console.log("resp " + resp);
            clearInterval(intervalId);
            eventManager.popMessage(resp);
            // stbService.setEPGUrl("http://173.18.1.17:33200/EPG/");
            // window.location.href = '../miniepgzhengshi/mainfest.html';
        });
    };

    var updateSTBTest = {
        messageText: function() {
            document.getElementById("update_title").innerHTML = defaultMessage[language + "_Note"];
            document.getElementById("exit_title").innerHTML = defaultMessage[language + "_upgrade"];
            document.getElementById("button_0").innerHTML = defaultMessage[language + "_OK"];
            document.getElementById("button_1").innerHTML = defaultMessage[language + "_Close"];
        },

        leftAction: function() {
            updateFlag = 0;
            $("#button_0").css("color", "#FFF");
            $("#button_0").css("background", "url('img/com_bt_popleft_select.png')");
            $("#button_1").css("color", "#666");
            $("#button_1").css("background", "url('img/com_bt_popright_normal.png')");
        },

        rightAction: function() {
            updateFlag = 1;
            $("#button_0").css("color", "#666");
            $("#button_0").css("background", "url('img/com_bt_popleft_normal.png')");
            $("#button_1").css("color", "#FFF");
            $("#button_1").css("background", "url('img/com_bt_popright_select.png')");
        },

        okAction: function() {
            if (0 == updateFlag) {
                if (document.getElementById("new_version_page").style.visibility == "visible") {
                    document.getElementById("new_version_page").style.visibility = "hidden";
                    stbService.upgradeStart();
                }
            } else {
                if (document.getElementById("new_version_page").style.visibility == "visible") {
                    document.getElementById("new_version_page").style.visibility = "hidden";
                    stbService.cancleUpgrade();
                    stbService.epgReady();
                }
            }
        },
    };
    var defaultMessage = {
        "en_Note": "Note",
        "en_upgrade": "The New version is available now, upgrade now?",
        "en_OK": "OK",
        "en_Close": "Close",
        "en_restart": "STB will restart 5 seconds later. Do you need to restart immediately ? ",
        "en_retcode": "bootstrap url error",
        "en_description": "bootstrap url configure error,",
        "ts_Note": "Napomena",
        "ts_upgrade": "Nova verzija je dostupna. Ažuriraj sada?",
        "ts_OK": "OK",
        "ts_Close": "Zatvori",
        "ts_restart": "STB ce biti restaryovan 5 sekundi kasnije. Da li zelite da restartujete STB odmah?",
        "ts_retcode": "URL greska",
        "ts_description": "URL greska u konfigiraciji,",
    };
    var defaultErrorMap = {
        "en_infodisplay_desc": "Service is temporarily unavailable.",
        "en_infodisplay_desc_code": "Code:",
        "ts_infodisplay_desc": "Usluga je trenutno nedostupna.",
        "ts_infodisplay_desc_code": "Código:",
        "en_http_503": "The server is busy now, please try again later.",
        "ts_http_503": "Sistem je zauzet. Pokušaj kasnije."
    };
    var errorMap = {
        "102001": {
            "code": "102001",
            "en_detail": "Network Exception.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Greška na mreži.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 4,
            "isFatal": 1,
            "isNeedCheck": 1,
            "logoUrl": "img/sign_network.png"
        },
        "102003": {
            "code": "102003",
            "en_detail": "IP address conflict.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Neusaglašenost IP adrese.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 0,
            "isFatal": 0,
            "isNeedCheck": 1,
            "logoUrl": "img/sign_ip_conflict.png"
        },
        "102004": {
            "code": "102004",
            "en_detail": "Network Exception.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Greška na mreži.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 3,
            "isFatal": 1,
            "isNeedCheck": 1,
            "logoUrl": "img/sign_dhcp_timeout.png"
        },
        "102005": {
            "code": "102005",
            "en_detail": "Network Exception.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Greška na mreži.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 3,
            "isFatal": 1,
            "isNeedCheck": 1,
            "logoUrl": "img/sign_dhcp_timeout.png"
        },
        "102006": {
            "code": "102006",
            "en_detail": "Network Exception.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Greška na mreži.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 3,
            "isFatal": 1,
            "isNeedCheck": 1,
            "logoUrl": "img/sign_dhcp_timeout.png"
        },
        "102007": {
            "code": "102007",
            "en_detail": "Network Exception.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Greška na mreži.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 3,
            "isFatal": 1,
            "isNeedCheck": 1,
            "logoUrl": "img/sign_dhcp_timeout.png"
        },
        "102011": {
            "code": "102011",
            "en_detail": "Service is temporarily unavailable.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Usluga je trenutno nedostupna.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 1,
            "isFatal": 1,
            "isNeedCheck": 1,
            "logoUrl": "img/dot.gif"
        },
        "102013": {
            "code": "102013",
            "en_detail": "Service is temporarily unavailable.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Usluga je trenutno nedostupna.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 1,
            "isFatal": 0,
            "isNeedCheck": 1,
            "logoUrl": "img/dot.gif"
        },
        "102014": {
            "code": "102014",
            "en_detail": "Service is temporarily unavailable.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Usluga je trenutno nedostupna.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 0,
            "isFatal": 0,
            "isNeedCheck": 0,
            "logoUrl": "img/dot.gif"
        },
        "102015": {
            "code": "102015",
            "en_detail": "Network Exception.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Greška na mreži.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 3,
            "isFatal": 1,
            "isNeedCheck": 1,
            "logoUrl": "img/sign_dhcp_request.png"
        },
        "102016": {
            "code": "102016",
            "en_detail": "Service is temporarily unavailable.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Usluga je trenutno nedostupna.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 0,
            "isFatal": 0,
            "isNeedCheck": 0,
            "logoUrl": ""
        },
        "": {
            "code": "203021",
            "en_detail": "Network Exception.",
            "en_suggestion": "Please try again. If the problem persists, contact your service provider.",
            "ts_detail": "Greška na mreži.",
            "ts_suggestion": "Molimo pokušajte kasnije. Ako problem i dalje postoji, kontaktirajte servis provajdera.",
            "level": 3,
            "isFatal": 1,
            "isNeedCheck": 1,
            "logoUrl": "img/dot.gif"
        },
        "STB_EVENT": {
            "code": "network error",
            "en_detail": "Network Exception.",
            "en_suggestion": "Network Exception.",
            "ts_detail": "Greška na mreži.",
            "ts_suggestion": "Greška na mreži.",
            "level": 0,
            "isFatal": 0,
            "isNeedCheck": 0,
            "logoUrl": "img/dot.gif"
        }
    };

    updateSTBTest.messageText();
    eventManager.start();
});