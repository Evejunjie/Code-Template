/**
 * ©版权所有 归开发者 junjie
 * 用于 html 节点文档渲染
 * @date 2019-11-08
 */
(function (wind, custom) {
    "use strict";
    var initial = {
        get: function (attr, elem, data, params) {
            return new CodeElemAttr(this, attr, elem, data, params);
        },
        getNode: function (attr, elem, data, params) {
            var func = initial[attr.name];
            if (typeof (func) == "function") {
                return func.apply(func, arguments);
            } else {
                return initial.get.apply({}, arguments);
            }
        },
        "c-text": function () {
            return initial.get.apply({}, arguments);
        },
        "c-number": function () {
            return initial.get.apply({
                bin: 10, //-> 显示的进制
                round: NaN, //-> 舍入,如果有保留小数则使用保留小数位置,没有就是从正数舍入
                retain: NaN, //-> 保留小数 正数表示小数 负数表示正数
                format: {
                    len: -1,
                    str: "-"
                }, //-> 分割,下标0为分割的长度,1位分割符号
                fill: null
            }, arguments);
        },
        "c-date": function (attr, elem, data, params) {
            return initial.get.apply({
                format: "yyyy-MM-dd hh:mm:ss",
            }, arguments);
        },
        /**
         *  node:{
         *      inverse:boolean //-> 是否取反
         *      key: string //-> 键值
         *      
         * }
         */
        "c-if": function (attr, elem, data, params) {
            var inverse = attr.value.trim().charAt(0) == "!";
            if (inverse) {
                attr.value = attr.value.trim().substr(1);
            }
            return initial.get.apply({
                inverse: inverse, //-> 是否取反,可以使用 ! 来代替
                deleted: false, //-> 是否直接删除,  这是可恢复的, 如果为 false 则是隐藏
            }, arguments);

        },
        "c-name": function (attr, elem, data, params) {
            return initial.get.apply({
                timely: true, //-> 开启即时更新 如果为false 则控件输入时不会改变,而是通过 值改变事件触发的,
                deal: true, //-> 开启值改变更新,如果关闭 表单控件改变后 不会影响 data 里面的值
            }, arguments);
        },
        "c-for": function () {
            return initial.get.apply({
                index: "__index_key", //-> 当前下标 或者 建 
            }, arguments);
        },
        "c-href": function () {
            return initial.get.apply({
                top: "", //-> 头部地址  比如http://,
                params: [], //-> 希望带上的参数
                paramskv: {}, //-> 希望带上的参数,键值对, 建为name,值为value
                anchor: "" //-> 锚点 需要你自己控制 # 
            }, arguments);
        },
        "c-src": function () {
            return initial.get.apply({
                top: "", //-> 头部地址
                params: [], //-> 加载参数,会递归触发,直到加载完成 或者加载失败时结束,如果是对象则会在 data 进行寻址,若是字符,则直接拼接
                error: "", //-> 当加载错误时显示的默认图片地址 , 你可以在全局变量中自定义配置,
            }, arguments);
        },
        "c-attr": function (attr, elem, data, params) {
            return initial.get.apply({
                remove: false, //-> 是否可以跟随这值得置空而移除 [null,undefined]
            }, arguments);
        },
        "c-switch": function () {
            return initial.get.apply({}, arguments);
        },
        "c-html": function () {
            return initial.get.apply({}, arguments);
        },
        /** class 绑定 */
        "c-class": function () {
        	return initial.get.apply({},arguments);
        },
        /** 指向 为了简写层级 */
        "c-point": function () {

        },
        "c-ternary": function () {

        },
        "c-eval": function () {

        }
    }

    var dataSet = {
        set: function (node, val, elem, data) {
            var func = dataSet[node.attrName];
            if (typeof (func) == "function") {
                func.apply(elem, arguments);
            } else {
                console.warn("警告:没有处理这样的属性函数[" + node.attrName + "];来自于:", elem);
            }
        },
        "c-text": function (node, val, elem, data) {
            util.setInnerText(elem, val);
        },
        "c-number": function (node, val, elem, data) {

        },
        /**
         * 默认的是 yyyy-MM-dd HH:mm:ss
         * @param {*} node 
         * @param {*} val 
         * @param {*} elem 
         * @param {*} data 
         */
        "c-date": function (node, val, elem, data) {
            if (!(val instanceof Date)) {
                var d = new Date(val);
                if (isNaN(d.getTime())) {
                    console.warn("无法处理此格式的日期:[" + val + "];格式[" + node.key + "];节点[" + elem + "]");
                } else {
                    val = d;
                }
            }
            if (val instanceof Date) {
                val = util.date.format(val, node.format);
            }
            elem.innerText = val;
        },
        "c-if": function (node, val, elem, data) {
            if (node.inverse) {
                val = !val;
            }
            if (node.deleted) {
                if (!node.parentNode) {
                    node.parentNode = elem.parentNode;
                }
                if (val) {
                    if( elem.parentNode){
                        elem.parentNode.removeChild(elem);
                    }
                } else {
                    //-> 判断是否已经添加了
                    if(!elem.parentNode){
                        node.parentNode.appendChild(elem);
                    }
                }
            } else {
                if (val) {
                    elem.style.display = "none";
                } else if (elem.style.display == "none") {
                    elem.style.display = "";
                }
            }
        },
        //-> 移除自己 克隆本生 将elem 改变为父级
        "c-for": function (node, val, elem, data) {
            if (node.parentNode == undefined) {
                node.parentNode = elem.parentNode;
                //-> 移除自己 
                elem.parentNode.removeChild(elem);
                elem.removeAttribute(node.attrName);
            }
            if (typeof (val) === "number") {
                if (val <= 0) {
                    console.warn("VAL[" + val + "]不能循环;他不是一个正整数!");
                    return;
                }
                var i = val;
                val = new Array(val);
                for (; i > val.length;) {
                    val.push(val.length);
                }
            }
            var one, brother;
            for (var key in val) {
                brother = elem.cloneNode(true);
                one = val[key];
                Object.defineProperty(one, node.index, {
                    writable: false,
                    enumerable: false,
                    configurable: true,
                    value: key,
                });
                fill(brother, one, {});
                node.parentNode.appendChild(brother);
            }
        },
        "c-href": function (node, val, elem, data) {
            var href = document.createAttribute("href");
            var value = node.top + val;
            if (value.indexOf("?") == -1) {
                value += "?";
            } else if (value.charAt(value.length - 1) != "&") {
                value += "&";
            }
            var v;
            for (var k of node.params) {
                v = util.lookFor(k, data);
                if (v === undefined) {
                    v = "";
                }
                value += (k + "=" + v + "&")
            }
            for (var k in node.paramskv) {
                v = util.lookFor(k, data);
                if (v === undefined) {
                    v = "";
                }
                value += (k + "=" + v + "&")
            }
            href.value = value;
            elem.setAttributeNode(href);
        },
        "c-src": function (node, val, elem, data) {
            var src = document.createAttribute("src");
            src.value = val;
            elem.setAttributeNode(src);
        },
        "c-attr": function (node, val, elem, data, name) {
            var attrkv = elem.attributes.getNamedItem(name);
            if (val == null || val == undefined) {
                if (attrkv != null) {
                    if (node.remove == "true") {
                        elem.removeAttribute(name);
                    } else {
                        attrkv.value = val;
                    }
                }
                return;
            }
            if (attrkv == null) {
                attrkv = document.createAttribute(name);
                elem.setAttributeNode(attrkv);
            }
            attrkv.value = val;
        },
        "c-switch": function (node, val, elem, data) {
            if (node.childrens == undefined) {
                node.caseDef = "";
                node.childrens = {};
                for (var chi of elem.children) {
                    var ccase = chi.getAttribute("c-case");
                    if (ccase) {
                        node.childrens[ccase] = chi;
                    } else if (ccase === "") {
                        node.caseDef = chi;
                    }
                    chi.removeAttribute("c-case");
                }
            }
            if (node.caseDef.parentNode != null) {
                elem.removeChild(node.caseDef);
            }
            var chi;
            for (var ch in node.childrens) {
                chi = node.childrens[ch];
                if (chi.parentNode != null) {
                    elem.removeChild(chi);
                }
            }
            var flag = true;
            for (var caseVale in node.childrens) {
                if (caseVale == val) {
                    flag = false;
                    chi = node.childrens[caseVale];
                    //-> 渲染他
                    elem.appendChild(chi);
                    if (chi.processed === undefined) {
                        fill(chi, data, {});
                        chi.processed = true;
                    }
                }
            }
            if (flag) {
                elem.appendChild(node.caseDef);
                if (node.caseDef.processed === undefined) {
                    fill(node.caseDef, data, {});
                    node.caseDef.processed = true;
                }
            }
        },
        "c-html": function (node, val, elem, data) {
            if (val === null || val === undefined) {
                val = ""
            }
            elem.innerHTML = val;
        },
        /**
         * 
         */
        "c-name": function (node, val, elem, data) {
            if (!elem.attributes.name) {
                for (var  key in node.attrMap) {
                    elem.setAttribute("name",node.attrMap[key]);
                    break;
                }
            }
            dataSet["c-value"].apply(dataSet, arguments);
        },
        "c-value": function (node, val, elem, data) {
            if (node.timely && !node.event) {
                node.event = function (event) {
                    node.valueOf(elem.value,elem.name);
                    if (event) {
                        event.preventDefault();
                    } else {
                        window.event.returnValue = false;
                    }
                }.bind(elem);
                //-> 绑定值改变事件
                elem.addEventListener("input", node.event);
                elem.addEventListener("change", node.event);
            }
            if (val == null || val == undefined) {
                this.value = "";
                return;
            }
            //->根据标签做相应的处理
            dataSet.cValue.execute.apply(elem, arguments);
        },
        cValue: {
            execute: function () {
                var func = dataSet.cValue[this.type];
                if (typeof (func) == "function") {
                    func.apply(this, arguments);
                } else {
                    this.value = arguments[1];
                }
            },
            "color": function (node, val) {
                if (val.charAt(0) != "#") {
                    val = "#" + val;
                }
                this.value = val;
            },
            "setDate": function (elem, date, format) {
                var d = util.date.formatDate(date, format);
                if (d) {
                    elem.value = d;
                } else {
                    console.warn("警告:该值无法初始化为时间:[" + date + "];格式:[" + format + "]", elem);
                }
            },
            "date": function () {
                dataSet.cValue.setDate(arguments[2], arguments[1], "yyyy-MM-dd");
            },
            "datetime-local": function () {
                dataSet.cValue.setDate(arguments[2], arguments[1], "yyyy-MM-ddThh:mm");
            },
            "month": function () {
                dataSet.cValue.setDate(arguments[2], arguments[1], "yyyy-MM");
            },
            "time": function () {
                dataSet.cValue.setDate(arguments[2], arguments[1], "hh:mm");
            },
            "week": function (node, date) {
                if (!(date instanceof Date)) {
                    date = new Date(date);
                    if (isNaN(date.getTime())) {
                        return;
                    }
                }
                var w = (Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 604800000));
                this.value = date.getFullYear() + "-W" + (w < 10 ? '0' + w : w);
            },
            "file": function () {},
            "radio": function (note, val, elem) {
                if ("value" in elem.attributes) {
                    elem.checked = (elem.value == val);
                } else {
                    elem.checked = !!val;
                }
            },
            "checkbox": function (node, val, elem) {
                if (val instanceof Array) {
                    elem.checked = val.indexOf(this.value) != -1;
                } else {
                    elem.checked = (elem.value == val);
                }
            },
            "image": function () {
                //-> 只会改变src 
                this.src = arguments[1];
            },
            "select-multiple": function () {

            },
        }
    }


    /** 
     * 属性节点的处理操作
     * 存储这个属性的映射信息
     */
    function CodeElemAttr(kv, attr, elem, data, code) {
        if (!kv) {
            kv = {};
        }
        //-> key值映射信息
        this.hierarchy = {};
        this.attrMap = {};
        //-> 属性名称
        this.attrName = attr.name;
        //-> 将自己添加到节点元素中去
        if (elem.attrNodes == null) {
            elem.attrNodes = new Array();
        }
        elem.attrNodes.push(this);
        this.init = function () {
            //-> 处理 attr value
            kv.key = {};
            this.setKeyArr = function (value) {
                if (value instanceof Array) {
                    kv.isArray = true;
                    for (var v of value) {
                        kv.key[v] = v;
                    }
                }
            }
            var value = attr.value.trim();
            if (value.charAt(0) == "[") {
                this.setKeyArr(util.valueAnalysis(value));
            } else if (value.charAt(0) == "{") {
                value = util.valueAnalysis(value);
                value.__proto__ = kv;
                kv = value;
                if (kv.key instanceof Array) {
                    var vs = kv.key;
                    kv.key = {};
                    this.setKeyArr(vs);
                } else {
                    var vs = kv.key;
                    kv.key = {};
                    kv.key[vs] = vs;
                }
            } else {
                kv.key[value] = value;
            }
            for (const key in kv) {
                this[key] = kv[key];
            }
        }
        this.init();
        //-> 开始处理 kv 里面的 key
        this.load = function () {

            var v;
            for (var key in kv.key) {
                v = kv.key[key];
                var hi = util.hierarchy(v, data, code.data);
                if (hi == undefined) {
                    console.warn(attr, elem)
                    continue;
                }
                //-> 保存这个映射
                this.attrMap[v] = hi[1];
                //-> 保存数据信息
                this.hierarchy[v] = hi[0];
                //-> 判断层级是否出现问题
                if (!(hi[0].__obje__.get(hi[1]))) {
                    console.warn("错误:目标对象层级出现问题,在改层级中找不到[" + hi[1] + "]层级对象;参考:", hi[0]);
                    continue;
                } else {
                    //-> 设置初始值
                    dataSet.set(this, hi[0][hi[1]], elem, data, v, code);
                    //->如果没问题则吧elem 进行绑定
                    hi[0].__obje__.get(hi[1]).appendHtml(elem);
                }
            }
        }

        //-> 判断是否包含 key 包含则返回true
        this.contain = function (key) {
            for (var name in this.attrMap) {
                if (key == this.attrMap[name]) {
                    return true;
                }
            }
            return false;
        }
        this.valueOf=function(val,name){
            for (var  key in  this.hierarchy) {
                if(this.attrMap[key] == name){
                    this.hierarchy[key][name]=val;
                }
            }
        }
    }

/**
 * 键值双向绑定, 
 * 一个键值绑定多个 html节点元素
 */
    function TwoWay(parent, key, code) {
        this.value = parent[key];
        this.valueType = typeof (this.value);
        this.htmls = new Array();
        this.appendHtml = function (elem) {
            if (this.htmls.indexOf(elem) == -1) {
                this.htmls.push(elem);
            }
        }
        this.get = function () {
            return code.params.get(this.value, this.htmls);
        }
        this.set = function (value) {
            if (typeof (value) != this.valueType) {
                //-> 类型转换
                value = util.typeConversion(this.valueType, value);
            }
            if (parent instanceof ProxyArray) {
                this.value = value;
                parent.valueChange("set", key, value);
            } else if (code.params.set(value, parent, key) !== false) {
                for (var elem of this.htmls) {
                    for (var node of elem.attrNodes) {
                        if (node.contain(key)) {
                            dataSet.set(node, value, elem, code.data, key, code);
                        }
                    }
                }
                this.value = value;
            }
        }
        Object.defineProperty(parent, key, {
            configurable: true,
            enumerable: true,
            get: this.get.bind(this),
            set: this.set.bind(this),
        })
    }

    var util = {
        typeConversion: function (expectations, goals, value) {
            if (!value) {
                value = goals;
                goals = typeof (value);
            }
            if (expectations == goals) {
                return value;
            }
            if (expectations == "number") {
                return Number(value);
            } else if (expectations == "string") {
                if (goals == "object") {
                    return value == null ? null : value.toString();
                }
                return value + "";
            } else if (expectations == "boolean") {
                if (goals == "string") {
                    return value.toLowerCase() === "true" ? true : false;
                }
                return !!value;
            }
            return value;
        },
        valueAnalysis: function (str) {
            var att = new String(str);
            var crux = ",{}[]:/";
            var index = 1
            var strBuff = new Array();
            var end = att.length - 1;
            var qm = "\"";
            strBuff.push(att[0]);
            if (crux.indexOf(att[1]) == -1) {
                strBuff.push(qm);
            }
            while (index < end) {
                if (att[index] == "/") {
                    index++;
                    strBuff.push(att[index++]);
                    continue;
                }
                if (crux.indexOf(att[index]) != -1) {
                    if (crux.indexOf(att[index - 1]) == -1) {
                        if (att[index - 1] != ' ') {
                            strBuff.push(qm);
                        }
                    }
                    strBuff.push(att[index]);
                    if (crux.indexOf(att[index + 1]) == -1) {
                        strBuff.push(qm);
                    }
                } else {
                    strBuff.push(att[index]);
                }
                index++;
            }
            if (crux.indexOf(att[index - 1]) == -1) {
                strBuff.push(qm);
            }
            strBuff.push(att[index]);
            return JSON.parse(strBuff.join(""));
        },
        /**
         * 获取多级数据,
         * 找不到则返回 未定义 undefined 
         * @param {*} value 键值
         * @param {*} data 数据来源
         */
        lookFor: function (value, data) {
            if (value == undefined) {
                return data;
            } else if (typeof (value) == 'string') {
                var kv = data;
                for (var key of value.split(".")) {
                    kv = kv[key];
                    if (kv == undefined) {
                        break;
                    }
                }
                return kv;
            } else if (typeof value == "number") {
                return data[value];
            } else {
                return undefined;
            }
        },
        /**
         * 获取指定位置的父级
         * @param {*} keys 指定位置
         * @param {*} data 祖父层级
         */
        hierarchy: function (keys, data) {
            if (keys.indexOf(".") == -1) {
                return [data, keys];
            } else {
                var array = keys.split(".");
                var len = array.length - 1;
                for (var i = 0; i < len; i++) {
                    data = data[array[i]];
                    if (data == undefined && i < len) {
                        console.warn("警告:无法获取指定层级[" + keys + "];层级[" + data + "]");
                        return undefined;
                    }
                }
                return [data, array[len]];
            }

        },
        date: {
            value: function () {
                return {
                    "yyyy": this.getFullYear(), //-> 年
                    "yy": this.getFullYear() - (parseInt(this.getFullYear() / 100) * 100), //-> 后两位年
                    "MM": this.getMonth() < 9 ? "0" + (this.getMonth() + 1) : (this.getMonth() + 1), //-> 月
                    "M": this.getMonth() + 1, //-> 一位月
                    "dd": this.getDate() < 10 ? "0" + this.getDate() : this.getDate(), //-> 日
                    "d": this.getDate(), //-> 一位日
                    "hh": this.getHours() < 10 ? "0" + this.getHours() : this.getHours(), //-> 时
                    "mm": this.getMinutes() < 10 ? "0" + this.getMinutes() : this.getMinutes(), //-> 分
                    "ss": this.getSeconds() < 10 ? "0" + this.getSeconds() : this.getSeconds(), //-> 秒
                    "SS": this.getMilliseconds(), //-> 毫秒
                    "W": this.getDay() == 0 ? 7 : this.getDay() //-> 周
                }
            },
            format: function (date, format) {
                date = util.date.value.call(date);
                for (var k in date) {
                    format = format.replace(k, date[k]);
                }
                return format;
            },
            formatDate: function (date, format) {
                if (date instanceof Date) {
                    return util.date.format(date, format);
                } else {
                    date = new Date(date);
                    if (isNaN(date.getTime())) {
                        return null;
                    } else {
                        return util.date.format(date, format);
                    }
                }

            }
        },
        setInnerText: function (elem, val) {
            if (val == undefined) {
                elem.innerText = "";
            } else {
                elem.innerText = val;
            }
        }
    }
    wind.util = util;

    var dataGet = {
        get: function (node, elem, data) {
            return node.valueOf();

        },
        "c-text": function (node, elem, data) {
            return elem.innerText;
        }

    }



    var breakNames = ["c-for", "c-skip"];

    var fill = function (elem, data, params) {
        var end = false;
        var attrs = new Array();
        var attributes = elem.attributes;
        var len = attributes.length;
        var attr = null;
        var max = 0;
        for (var i = 0; i < len; i++) {
            attr = attributes[i];
            if (attr.name.charAt(0) == "c" && attr.name.charAt(1) == "-") {
                if (attrs.indexOf(attr) != -1) {
                    continue;
                }
                var node = initial.getNode(attr, elem, data, params);
                if (node != null) {
                    if (node instanceof Array) {
                        for (var n of node) {
                            n.init();
                        }
                    } else {
                        node.load();
                    }
                }
                if (CodeT.breakNames.indexOf(attr.name) != -1) {
                    end = true;
                    break;
                } else {
                    attrs.push(attr);
                }
            }
            if (len != attributes.length) {
                attributes = elem.attributes;
                len = attributes.length;
                i = 0;
            }
        }
        for (var attr of attrs) {
            attributes.removeNamedItem(attr.name);
        }
        if (end) {
            return true;
        }
        //-> 是否继续想下执行
        var children = elem.children;
        var len = children.length;
        for (var i = 0; i < len; i++) {
            fill(children[i], data, params);
            if (len != children.length) {
                i--;
                children = elem.children;
                len = children.length;
            }
        }
    }

    function ProxyArray(array, name, parent, code) {
        var length = 0;
        Object.defineProperty(this, "length", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: length,
        });
        var htmls = new Array();
        if (array instanceof Array) {
            this.push.apply(this, array);
        }
        var twoWay = {};
        ////-----------------------------> 监听函数
        var funcProxy = {
            get: function (key) {
                return twoWay[key];
            },
            getVelue: function () {
                return code.params.get(this, htmls);
            },
            setValue: function (value) {

            },
            append: function (key, tw) {
                twoWay[key] = tw;
            },
            appendHtml: function (elem) {
                if (htmls.indexOf(elem) == -1) {
                    htmls.push(elem);
                }
            },
            htmls: function () {
                return htmls;
            },
            pop: function () {
                return ProxyArray.prototype.pop.apply(this, arguments);
            },
            push: function () {
                return ProxyArray.prototype.push.apply(this, arguments);
            },
            shift: function () {
                return ProxyArray.prototype.shift.apply(this, arguments)
            },
            splice: function () {
                return ProxyArray.prototype.splice.apply(this, arguments)
            },
            unshift: function () {
                return ProxyArray.prototype.unshift.apply(this, arguments)
            },
            item: function () {

            },
            put: function (i, value) {
                if (i > length || i < 0) {
                    throw "抱歉:数组下标越界,目标[" + i + "];数组实际长度[" + length + "]";
                }
                if (i == length) {
                    return this.push(value);
                } else {
                    this[i] = value;
                }
            },
            appendArray: function (arr) {
                if (arguments.length > 1) {
                    this.push.apply(this, arguments);
                } else {
                    this.push.apply(this, (arr instanceof Array) ? arr : [arr]);
                }
            },
            valueChange: function (funcName, index, value) {

                for (var elem of htmls) {
                    for (var node of elem.attrNodes) {
                        //-> 如果节点 是 for 循环 需要二外处理
                        if (funcName == "set" || node.key == funcName) {
                            dataSet.set(node, this, elem, code.data);
                        }
                    }
                }
                console.log(arguments);

            },
            loop: function () {

            }
        };
        for (const key in funcProxy) {
            Object.defineProperty(this, key, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: funcProxy[key].bind(this),
            });
        }
        Object.defineProperty(parent, name, {
            configurable: true,
            enumerable: true,
            get: this.getVelue.bind(this),
            set: this.setValue.bind(this),
        });

        ///------------------------------

    }
    ProxyArray.prototype = Array.prototype;

    function SubsetTwoWay(oneself) {
        var twoWay = {};
        this.get = function (key) {
            return twoWay[key];
        }
        this.append = function (key, tw) {
            twoWay[key] = tw;
        }
    }

    function CodeT(elem, data, params) {
        if (!(this instanceof CodeT)) {
            return new CodeT(elem, data, params);
        }
        this.data = data;
        this.elems = new Array();
        this.params = {
            get: function (val, node, elem) {
                return val;
            },
            set: function (val, node, elem) {
                return true;
            },
        }
        this.weifor = function (value, name, parent) {
            if (value instanceof Array) {
                parent[name] = new ProxyArray(value, name, parent, this);
                value = parent[name];
                for (var i = 0; i < value.length; i++) {
                    value.append(i, this.weifor(value[i], i, value));
                }
                return value;
            } else if (typeof (value) == "object") {
                for (var key in value) {
                    if (!(value.__obje__ instanceof SubsetTwoWay)) {
                        value.__obje__ = new SubsetTwoWay(value);
                    }
                    var tw = this.weifor(value[key], key, value);
                    if (tw) {
                        value.__obje__.append(key, tw);
                    }
                }
                return new TwoWay(parent, name, this);
            } else {
                return new TwoWay(parent, name, this);
            }
        }
        this.load = function () {
            if (document.readyState == "loading") {
                setTimeout(this.load.bind(this), 100);
                return false;
            }
            if (!(elem instanceof HTMLElement)) {
                if (elem instanceof Array) {
                    for (var e of elem) {
                        this.elems.push(e);
                    }
                }
                this.elems = document.querySelectorAll(elem);
            } else {
                this.elems.push(elem);
            }
            //-> 给每个数据都绑定 

            this.weifor(data, "data", this);

            //-> 开始渲染
            for (var els of this.elems) {
                fill(els, data, this.params);
            }
        }
        this.load();
    }

    CodeT.version = "1.0.0";
    CodeT.breakNames = breakNames;
    CodeT.util = util;
    wind.CodeT = CodeT;





})(typeof window !== "undefined" ? window : this, {
    attr: {
        /** 仅适用于 获取表单数据 */
        "c-get": function () {

        },
        /**仅适用于提交数据,默认为FormDate */
        "c-post": function () {

        },
        /** 需要指定触发类型(初始化,还是表单提交),以及提交类型 */
        "c-ajax": function () {
            var v = {
                "type": "post",
                "url": "/user/add",
                "defParams": {},
                "trigger": "(load|submit)",
                "point": "data.list",
                "ajax": {},
                "success": function () {

                },
                "error": function () {

                },

            };

        },
        /** 这是是表单控件,往往配合这 c-post 使用, 这个几个属性都是待定的 */
        "c-form": function () {
            var v = {
                control: [{
                    "name": "age",
                    "maxlength": 10,
                    "pattern": "[0-9]",
                    "display": "class|up*2",
                    "tips": {
                        "maxlength": "不能超过10位",
                        "num": "输入的值不是数字",
                        "pattern": "输入的值应当在0到9之间"
                    },
                    "CanVerify": true,
                    "verify": function () {
                        if (isNaN(this.value)) {
                            return "num"
                        }
                    },
                    "change": function () {
                        this.valid();
                    },
                    "value": function () {
                        this.value;
                    }
                }, ],
                //-> 表单提交时才会触发, 如果有成功 成功函数返回false 表示手动触发,负责自动触发
                "verify": {
                    success: function () {
                        this.submit();
                    },
                    error: function () {},
                    //-> 不管什么情况,就算是 异常都会执行,往往是用于关闭动画
                    complete: function () {},
                },
                //-> 提交的时候你要做点什么, retrun false 表示终止交易,  如果你使用了 c-form 不推荐你在这里面写ajax 而是 做动画之类的处理
                submit: function () {

                }
            }
        },
    },
    set: {},
});