$(function() {
    var log = function(str, level) {
        console.log("On key Test| " + str);
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
    var lang = Utility.getValueByName('lang') ? Utility.getValueByName('lang') : 1;

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
            return Utility.getValueByName("stbIP");
        },

        getGateway: function() {
            return Utility.getValueByName("gateway");
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
        shutDownSTB: function() {
            Utility.setValueByName("hw_op_stb", "fullPowerOff");
        },
        openSetPage: function() {
            Utility.setValueByName("hw_op_stb", "setpage");
        },
        epgReady: function() {
            Utility.setValueByName('EPGReady', "XXXX");
        },
        allPageLoadFinish: function() {
            Utility.setValueByName("AllPageLoadFinish", 1);
        },
        showSplash: function() {
            Utility.setValueByName("ShowPic", 2);
        },

        write: function(key, value) {
            var ret = Utility.setValueByName(key, value + "");
            return ret;
        },
    };
    var intervalId = null;
    var stbMessage = [" ", "STB informacije", "STB Info Presentation"];
    var macAdderss = [" ", "MAC adresa:", "MAC Address:"];
    var tvAccount = [" ", "TV nalog Broj:", "TV Account Number:"];
    var version = [" ", "Broj verzije:", "Version Number:"];
    var accountMode = [" ", "Access Mode:", "Access Mode:"];
    var ipAddress = [" ", "IP adresa:", "IP Address:"];
    var ipGateway = [" ", "Veza ka IP mreži:", "IP Gateway:"];
    var currentTime = [" ", "Trenutno vreme:", "Current Time:"];
    var prompting_message = [" ", "Za testiranje pritisni Start", "For testing press Start"];
    var step_0 = [" ", "Korak 1: Test kabla", "Step 1: Cable Test"];
    var step_1 = [" ", "Korak 2: Test IP povezanosti", "Step 2: IP Test"];
    var step_2 = [" ", "Korak 3: Test veze ka IP mreži", "Step 3: Gateway Test"];
    var step_3 = [" ", "Korak 4: NTP test", "Step 4: NTP Test"];
    var step_4 = [" ", "Korak 5: Test centralne lokacije", "Step 5: Central Site Test"];
    var step_5 = [" ", "Korak 6: DNS povezivanje", "Step 6: DNS connectivity"];
    var start_button = [" ", "Start", "Start"];
    var test_1 = [" ", "Testiranje...", "Testing..."];
    var test_2 = [" ", "za povratak unazad", "to return"];
    var test_3 = [" ", "Nazad", "Back"];
    var string_fail = [" ", "Neuspešno", "Failed"];
    var string_ok = [" ", "OK", "OK"];
    var string_skip = [" ", "Skipped", "Skipped"];
    var onekeyTest = {
        messageText: function() {
            document.getElementById("customer_title").innerHTML = test_1[lang];
            document.getElementById("head_back_title").innerHTML = test_2[lang];
            document.getElementById("head_back_button").innerHTML = test_3[lang];


            document.getElementById("stbMessage").innerHTML = stbMessage[lang];
            document.getElementById("macAdderss").innerHTML = macAdderss[lang];
            document.getElementById("tvAccount").innerHTML = tvAccount[lang];
            document.getElementById("version").innerHTML = version[lang];
            //document.getElementById("accountMode").innerHTML = accountMode[lang];
            document.getElementById("ipAddress").innerHTML = ipAddress[lang];
            //document.getElementById("ipGateway").innerHTML = ipGateway[lang];
           // document.getElementById("currentTime").innerHTML = currentTime[lang];
            document.getElementById("prompting_message").innerHTML = prompting_message[lang];
            document.getElementById("step_0").innerHTML = step_0[lang];
            document.getElementById("step_1").innerHTML = step_1[lang];
            document.getElementById("step_2").innerHTML = step_2[lang];
            document.getElementById("step_3").innerHTML = step_3[lang];
            document.getElementById("step_4").innerHTML = step_4[lang];
           // document.getElementById("step_5").innerHTML = step_5[lang];
            document.getElementById("start_button").innerHTML = start_button[lang];
        },

        setSTBinfo: function() {
            document.getElementById("macAdderss_msg").innerHTML = stbService.getMacAddress();
            document.getElementById("tvAccount_msg").innerHTML = stbService.getUserId();
            document.getElementById("version_msg").innerHTML = stbService.getVersion();
            //document.getElementById("accountMode_msg").innerHTML = stbService.getAccessMode();
            document.getElementById("ipAddress_msg").innerHTML = stbService.getIP();
            //document.getElementById("ipGateway_msg").innerHTML = stbService.getGateway();
        },

        setSTBtime: function() {
            clearTimeout(this.currentTime);
            document.getElementById("currentTime_msg").innerHTML = onekeyTest.dateToString(new Date());
            this.currentTime = setTimeout(function() {
                onekeyTest.setSTBtime();
            }, 6000);
        },
        dateToString: function(date) {
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            var hour = date.getHours();
            var minute = date.getMinutes();
            var second = date.getSeconds();
            var week = date.getDay();

            if (Math.floor(day) < 10) {
                day = '0' + day;
            }
            if (Math.floor(month) < 10) {
                month = '0' + month;
            }
            if (Math.floor(hour) < 10) {
                hour = '0' + hour;
            }
            if (Math.floor(minute) < 10) {
                minute = '0' + minute;
            }
            if (Math.floor(second) < 10) {
                second = '0' + second;
            }

            return hour + ':' + minute + " " + day + '/' + month + "/" + year;

        },
        //clearTimeout(this.currentTime);  离开页面时，清除定时器

        startTest: function() {
            Utility.setValueByName('NetDiagnoseTool.DiagnoseMode', 'Service');
            var self = this;
            var test_4 = [" ", "Testiranje...", "Testing..."];
            document.getElementById("prompting_message").innerHTML = prompting_message[lang];
            document.getElementById("start_button").innerHTML = test_4[lang];
            /** ******************根据mode类型将调用的类型push进typeList************************** */
            var typeList = ["Basic.PhysicalNet", "Basic.Address", "Basic.Gateway"];

            var mode = Utility.getValueByName("NetDiagnoseTool.DiagnoseMode");
            //Utility.getValueByName("connecttype");
            if (mode == "ICMP") {
                typeList.push("Basic.NTP.ICMP", "Basic.CentralArea.ICMP");
            } else {
                typeList.push("Basic.NTP.Service", "Basic.CentralArea.Service");
            }
           // typeList.push("Basic.DNS");
            var self = this;
            var checkStb = function(type, flag) {
                var dfd = $.Deferred();
                if (flag == true) {
                    STBCheckApp.startCheck(type);
                    var intervalId = setInterval(function() {
                        var retJson = STBCheckApp.getCheckResult(type);
                        var status = retJson.TestState;
                        var result = retJson.TestResult;
                        if (2 == status) {

                        } else if (1 == status) {
                            clearInterval(intervalId);
                            if (1 == result) {
                                dfd.resolve(retJson);
                            } else {
                                dfd.reject(retJson);
                            }
                        } else {
                            clearInterval(intervalId);
                            dfd.reject(retJson);
                        }
                    }, 100);
                    return dfd;
                } else {
                    dfd.reject({
                        TestResult: 0
                    });
                    return dfd;
                }
            };
            var isNeedContinue = true;
            Util.sequenceDeferred(_.map(typeList, function(type, index) {
                return function() {
                    self.indexFlag = index;
                    if (!isNeedContinue) {
                        for (var i = index; i < typeList.length; i++) {
                            var elFinal = document.getElementById("result_final_" + i);
                            var elFront = document.getElementById("result_front_" + i);
                            var elGoing = document.getElementById("result_going_" + i);
                            elGoing.src = 'url(img/dot.gif)';
                            elFront.src = 'url(img/fail.png)';
                            elFront.style.width = 'calc(1.5 * 18px)';
                            elFront.style.height = 'calc(1.5 * 18px)';
                            elFinal.innerHTML = string_skip[lang];
                        }
                        var message_reminder = ["", "Za testiranje pritisni Start", "For testing press Start"];
                        var message_start = ["", "Start", "Start"];
                        document.getElementById("prompting_message").innerHTML = message_reminder[lang];
                        document.getElementById("start_button").innerHTML = message_start[lang];
                        self.indexFlag = -1;
                        eventManager.intesting = false;
                        return $.Deferred();
                    }
                    var elFront = document.getElementById("result_front_" + index);
                    var elFinal = document.getElementById("result_final_" + index);
                    var elGoing = document.getElementById("result_going_" + index);
                    elFront.src = 'img/setting_ic_testing.png';
                    elFront.style.width = 'calc(1.5 * 14px)';
                    elFront.style.height = 'calc(1.5 * 21px)';
                    elFinal.innerHTML = "ongoing";
                    elGoing.style.src = 'url(img/ongoing.gif)';
                    return checkStb(type, true).always(function(result) {
                        elFront.src = 'url(img/record_ic_choose_1.png)';
                        elFront.style.width = 'calc(1.5 * 19px)';
                        elFront.style.height = 'calc(1.5 * 19px)';
                        if (1 == result.TestResult) {
                            elFront.src = 'img/record_ic_choose_1.png';
                            elFront.style.width = 'calc(1.5 * 19px)';
                            elFront.style.height = 'calc(1.5 * 19px)';
                            elFinal.innerHTML = string_ok[lang];
                            elGoing.style.background = 'url(img/dot.gif)';
                        } else {
                            if (self.indexFlag < 3) {
                                isNeedContinue = false;
                            }
                            elFront.src = 'img/fail.png';
                            elFront.style.width = 'calc(1.5 * 18px)';
                            elFront.style.height = 'calc(1.5 * 18px)';
                            elFinal.innerHTML = string_fail[lang];
                            elGoing.style.background = 'url(img/dot.gif)';
                        }
                        if (4 == self.indexFlag) {
                            var message_reminder = ["", "Za testiranje pritisni Start", "For testing press Start"];
                            var message_start = ["", "Start", "Start"];
                            document.getElementById("prompting_message").innerHTML = message_reminder[lang];
                            document.getElementById("start_button").innerHTML = message_start[lang];
                            self.indexFlag = -1;
                            eventManager.intesting = false;
                        }
                    });
                };
            }));

        }
    };

    var Util = {
        sequenceDeferred: function(handlerList) {
            var dfd = $.Deferred().resolve();
            _.each(handlerList, function(handler, index) {
                var currDfd = $.Deferred();
                dfd.always(function() {
                    handler(index).then(currDfd.resolve, currDfd.reject);
                });
                dfd = currDfd;
            });
            return dfd;
        },
    };

    var STBCheckApp = {
        startCheck: function(checkType) {
            var flag = TerminalInfo.testStart(checkType);
            return flag;
        },
        getCheckResult: function(checkType) {
            var obj = TerminalInfo.getCheckResult(checkType);
            return obj;
        },
    };

    var TerminalInfo = {
        testStart: function(option) {
            var result = stbService.write('NetDiagnoseTool.TestStart', option);
            return result;
        },

        getCheckResult: function(option) {
            var str = Utility.getValueByName('NetDiagnoseTool.GetTestResult,TestType=' + option);
            var info = JSON.parse(str);
            return info;
        },
    };

    var cangotoSettingPage = 0;
    var intervalSetId = null;
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
        clearTimeout(intervalSetId);

        intervalSetId = setTimeout(function() {

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
        intesting: false,
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
            log("handleEvent:" + event.which);

            switch (event.which) {
                case 13:
                    if (this.reStart) {
                        Utility.setValueByName('hw_op_restart', 'XXXX');
                    } else if (!this.intesting) {
                        for (var i = 0; i < 5; i++) {
                            var elFront = document.getElementById("result_front_" + i);
                            var elFinal = document.getElementById("result_final_" + i);
                            var elGoing = document.getElementById("result_going_" + i);
                            elFront.src = 'img/dot.gif';
                            elFinal.innerHTML = "";
                            elGoing.style.background = 'url(img/dot.gif)';
                        }
                        document.getElementById("test_statue").innerHTML = "";
                        this.intesting = true;
                        onekeyTest.startTest();
                    }
                    break;
                case 8:
                case 66:
                    if (!this.intesting) {
                        history.go(-1);
                    }
                    break;
                case 256:
                    Utility.setValueByName("hw_op_stb", "powerOff");
                    break;
                case 285:
                    if(cangotoSettingPage == 1){
                        stbService.openSetPage();
                    }
                    break;
                case 768:
                    // 机顶盒事件
                    var eventString = Utility.getEvent();
                    var eventJson = JSON.parse(eventString);
                    var typeStr = eventJson ? eventJson.type : "";
                    console.log(" 111  typeStr = " + typeStr);
                    if ((typeStr == "EVENT_AUTHENTICATION_READY") || (typeStr == "EVENT_STB_RESTORE")) {
                        location.href = "../miniepg/index.html";
                    } else if ('EVENT_NEW_VERSION' === typeStr) {
                        Utils.setValueByName('upgradeStart_wait', 'cancel,' + eventJson.path);
                    } else if (typeStr == "EVENT_USER_INFO_TMS_UPDATED") {
                        var message = ["", "STB will restart 5 seconds later, do you need to restart immediately ?", "STB will restart 5 seconds later, do you need to restart immediately ?"]
                        document.getElementById("content").innerHTML = "";
                        document.getElementById("ctitle").innerHTML = message[lang];
                        document.getElementById("error_page").style.visibility = "visible";
                        this.reStart = true;
                        setTimeout(function() {
                            Utility.setValueByName('hw_op_restart', 'XXXX');
                        }, 5 * 1000);

                    }
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
                default:
                    break;
            }
            return 0;
        },
        doSelect: function() {
            if (document.getElementById("error_page").style.visibility == "visible") {
                document.getElementById("error_page").style.visibility = "hidden";
            }
        },
    };
    var TestDomain = Utility.getValueByName('NetDiagnoseTool.TestDomain');
    if (!TestDomain) {
        Utility.setValueByName('NetDiagnoseTool.TestDomain', 'eds.tv.telekom.rs');
    }

    stbService.allPageLoadFinish();
    stbService.showSplash();
    onekeyTest.messageText();
    onekeyTest.setSTBinfo();
   // onekeyTest.setSTBtime();
    eventManager.start();
});