/**
 * 对象, 渲染的核心 白玫瑰,
 * 数据填充器, 
 * 
 */
(function (win) {
	"use strict";

	//-> 需要保留的 属性节点 
	function attrInfo(node, attr, data) {
		//-> 从 data 中获取的路径 key值
		this.key = attr.value;
		//-> 属性的名字
		this.attrName = attr.name;
		//- > 默认不排空 ,当值不可用时
		this.empit = false;
		//-> 不处理
		if (this.key == "") {
			return;
		}
		//-> key 是 文本 还是可以解析的  对象, 
		if (this.key[0] == "{" && this.key[this.key.length - 1] == "}") {
			var attrObje = util.strToObj(this.key);
			for (var k in attrObje) {
				this[k] = attrObje[k];
			}
		}
		//-> 保存节点
		this.node = node;
		//-> 保存节点属性
		this.attr = attr;
		//-> 开始 从 data 中取值 , 以 [ . ] 为分割 
		this.value = util.lookFor(this.key, data);
		//-> 没有值则提示
		if (this.value == undefined) {
			this.value = "";
			if (window.log == "debug") {
				console.warn("No value of [" + this.key + "] mapping was found, value def ['']", this.node);
			}
		}
		//-> 从标签上移除这个节点 
		this.node.removeAttribute(this.attrName);
	}


	/**
	 * 文本控制器
	 */
	var text = {
		/**
		 * 自定义属性: 
		 */
		textValue: function (data, attr) {
			if (attr.empit) {
				attr.node.innerText = "";
			}
			//-> 有比较则比较
			if (attr.eq) {
				attr.value = control.eq(data, attr) ? attr.t : attr.f;
			}
			var my = document.createTextNode(attr.value);
			var brothers = attr.node.children;
			if (attr.position && brothers.length > 0) {
				if (brothers.length > attr.position) {
					attr.node.insertBefore(my, brothers[attr.position]);
				} else {
					attr.node.insertBefore(my, brothers[brothers.length - 1]);
				}
			} else {
				attr.node.appendChild(my);
			}
		},
		/**
		 * 数字处理 , 给工具处理 , 方便开发者调用
		 * {
		 * 	retain  : 5,  保留的小数位数
		 *  rounding: 4   舍入条件 , 大于他才会进位, 小于则舍去, 需要retain的支持,不然无效
		 *  integer : 5,  整数,不足则补0 , 需要 repair 的支持
		 *  repair  : 补位, 小数不够0来凑, 整数不够0来凑 , 需要  retain 或者  integer 支持
		 *  format  : {
		 *  			partition: 分隔符
		 *  			digit	 : 多少位插入分隔 
		 *  		} 
		 *  zero: true| false , 0 做保留吗?  补位时 忽略掉
		 * }
		 */
		number: function (data, attr) {
			attr.node.appendChild(document.createTextNode(util.number(attr.value, attr)));
		},
		/**
		 * 时间标签, 支持时间 和日期 默认格式 : yyyy-MM-dd,
		 * format: 查看 Date.Format 支持的格式, 
		 */
		time: function (data, attr) {
			if (!attr.format) {
				attr.format = "yyyy-MM-dd";
			}
			attr.node.appendChild(document.createTextNode(new Date(attr.value).Format(attr.format)));
		},
		/**
		 * 时隔多久? 
		 * format: 显示的世界格式
		 * who: 和谁比较, 默认则是当前的时间 
		 */
		timeLapse: function () {

		},
		/**
		 * heml, 用于html 文本填充  会解析 &lt; &gt;
		 * entity : 转义 &lt; &gt;  <> 
		 */
		html: function (data, attr) {
			if (attr.entity == "true" || attr.entity === true) {
				var div = document.createElement("div");
				div.innerHTML = attr.value;
				attr.value = div.innerText;
			}
			attr.node.innerHTML = attr.value
		}



	}
	/**
	 * 控制层面
	 */
	var control = {
		/**
		 * 返回属性信息
		 */
		command: function (data, attr) {
			return attr;
		},
		//-> 是 if 标签的替代品
		remove: function (data, attr) {
			if (control.eq(data, attr)) {
				attr.node.parentNode.removeChild(attr.node);
			}
		},
		/**
		 * 比较
		 */
		eq: function (data, attr) {
			var del = false;
			if (attr.eq && attr.who == undefined) {
				del = eval(attr.value + attr.eq);
			} else if (attr.who) {
				del = eval(attr.value + attr.eq + util.lookFor(attr.who, data));
			} else {
				del = !!attr.value;
			}
			return del;
		},
		/**
		 * 循环 , w-for
		 */
		loop: function (data, attr) {
			//-> 指向父级
			attr.parentNode = attr.node.parentNode;
			//-> 移除自己
			attr.node.parentNode.removeChild(attr.node);
			//-> 孩子
			var iterators = new Array();
			if (attr.value) {
				for (var k in attr.value) {
					//-> 克隆出来
					var newNode = attr.node.cloneNode(true);
					//-> 保存当前的下标
					attr.value[k]["_index"] = k;
					//-> 保存父级索引
					if (attr.value["_indexs"]) {
						attr.value[k]["_indexs"] = attr.value["_indexs"] + "." + k;
					} else {
						attr.value[k]["_indexs"] = k;
					}
					iterators.push(new iterator(newNode, attr.value[k]));
					if (attr.append) {
						//- > 追击动画 
					} else {
						attr.parentNode.appendChild(newNode);
					}
				}
			} else {
				var f = new Number(attr["for"]);
				for (var k = 0; k < f; k++) {
					var newNode = attr.node.cloneNode(true);
					iterators.push(new iterator(newNode, {
						"_index": k
					}));
					if (attr.append) {
						//- > 追击动画 
					} else {
						attr.parentNode.appendChild(newNode);
					}
					iterators.push(new iterator(newNode, {
						"_index": k
					}));
					if (attr.append) {
						//- > 追击动画 
					} else {
						attr.parentNode.appendChild(newNode);
					}
				}
			}
			return {
				attrName: attr.attrName,
				iter: iterators
			};
		}
	}

	/**
	 * 属性控制器
	 */
	var attribute = {
		/**
		 * 属性: 
		 */
		attr: function (data, attr) {
			//-> 数组
			if (attr.array) {
				for (var i = 0; i < attr.array.length; i++) {
					attr.node.setAttribute(attr.array[i], util.lookFor(attr.array[i], attr.value));
				}
			}
			//-> 映射
			if (attr.map) {
				for (var key in attr.map) {
					attr.node.setAttribute(key, util.lookFor(key, attr.value));
				}
			}
			//-> 单个
			if (attr.name) {
				attr.node.setAttribute(attr.name, util.lookFor(attr.name, attr.value));
			}
		},
		// -> 设置标签的name值,
		name: function (data, attr) {
			// 1 不管有没有,先生成属性
			attr.node.setAttribute("name", attr.key);
			// 2 调用 value 属性
			attribute.value(data, attr);
		},
		/**
		 * value , 只会支持 有 value 属性的标签 , 当然 没有则当属性处理
		 */
		value: function (data, attr) {
			var node = attr.node;
			// ? 什么属性?
			var type = node.getAttribute("type");
			if (type == "" || type == null) {
				type = (node.tagName == "BUTTON" ? "button" : node.tagName == "INPUT" ? "text" : null);
			}
			switch (type) {
				case null:
					node.setAttribute("value", attr.value);
					break;
					/* 值处理 */
				case "text":
				case "password":
				case "number":
					node.value = attr.value;
					break;

					// -> 单选 , 比较 值是否一致,一致则选中
				case "radio":
					// -> 复选, 比较 值是否一致,一致则选中
				case "checkbox":
					// -> 他可能是比较,也可能是赋值,那么判断是否有值 有则比较,没有则赋值
					if (node.value == "") {
						node = attr.value;
					}
					// -> 没有则比较
					else {
						node.checked = (node.value == attr.value);
					}
					break;

					/**
					 * 下面是时间的处理, 对于时间戳 会格式化为响应的 字符串,对于字符串是直接等于,而不是创建时间对象
					 * 年月
					 */
				case "month":
					node.value = new Date(attr.value).Format("yyyy-MM");
					break;
				case "datetime-local":
					node.value = new Date(attr.value).Format("yyyy-MM-ddThh:mm");
					break;
				case "date":
					node.value = new Date(attr.value).Format("yyyy-MM-dd");
					break;
					// -> 对于未知的 采取直接赋值
				default:
					node.value = attr.value;
					break;
			}
		},
		/**
		 * 添加class
		 */
		addClass: function (data, attr) {
			if (control.eq(data, attr)) {
				attr.node.classList.add(attr.t);
			} else {
				attr.node.classList.add(attr.f);
			}
		}
	}

	//-> 映射方法
	var mapper = {
		"w-text": text.textValue,
		"w-number": text.number,
		"w-time": text.time,
		"w-html": text.html,
		//-> 属性层
		"w-attr": attribute.attr,
		"w-name": attribute.name,
		"w-value": attribute.value,
		"w-class": attribute.addClass,
		//-> 控制层
		"w-skip": control.command,
		"w-end": control.command,
		"w-if": control.remove,
		"w-for": control.loop

	};

	/**
	 * 循环处理
	 */
	function iterator(node, data) {
		//- > 保存 这些 属性 
		this.attr = new Array();
		//->  孩子
		this.children = new Array();
		// -> 获取本节点上的属性
		var attrs = node.attributes;
		var func, attr;
		for (var i = 0; i < attrs.length;) {
			if (attrs[i].name.indexOf('w-') != 0) {
				i++;
				continue;
			}
			//->  是否有这个方法 ?  没有则跳过不处理
			func = mapper[attrs[i].name];
			if (!func) {
				console.error(" Handler with attribute [%s] not found. Program skip without processing", attrs[i].name);
				i++;
				continue;
			}
			//-> 生成对应的属性处理器: 
			attr = new attrInfo(node, attrs[i], data);
			var result = func(data, attr);
			if (result) {
				switch (result.attrName) {
					//-> 提供结束标签  单不推荐使用! , 请在 构造时 try ! 
					case "w-end":
						throw "end";
						//-> 结束
					case "w-for":
						this.children = this.children.concat(result.iter);
					case "w-skip":
						return;
					default:
						break;
				}

				//-> 基本上 是 改变当前取值域
			}
			this.attr.push(attr);
		}
		// -> 获取去所有的孩子,依次循环他们
		var chi = node.children;
		var len = chi.length;
		for (var i = 0; i < chi.length;) {
			this.children.push(new iterator(chi[i], data));
			//-> 没有删除时 才加
			if (len == chi.length) {
				i++;
			} else {
				len = chi.length;
			}
		}
	}

	/**
	 * 核心控制
	 * parameter:{
	 * 	node    : 从那里开始,
	 *  data    : 需要处理的数据
	 *  
	 * }
	 */
	function rose(parameter) {
		//-> 开始位置, 从那里开始 , 没有则是整个网页
		this.node = !parameter.node ? document.body : parameter.node;
		//-> 数据,生成数据依据
		this.data = parameter.data;
		//-> 处理迭代器
		this.iterator = new iterator(this.node, this.data);

	}

	/**
	 * 工具
	 */
	var util = {
		/**
		 *  字符串在 转 json 对象
		 *  / 表示跳过他,不处理 : 往往用于 boolean 值 和数字 和关键字 
		 */
		strToObj: function (str) {
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
		// -> 指定域中获取值
		lookFor: function (value, data) {
			if (value == undefined) {
				return data;
			}
			var keys;
			if (typeof (value) == 'string') {
				keys = value.split('.');
			} else if (value instanceof Array) {
				keys = value
			} else {
				return undefined;
			}
			for (var i = 0; i < keys.length; i++) {
				data = data[keys[i]];
				if (data == undefined) {
					break;
				}
			}
			return data;
		},
		/**
		 * n : 需要处理的 值, -> new Number(n) 请确保他能够正常处理 
		 * expect: 请查看 text.number 的注释
		 * {
		 * 	retain  : 5,  保留的小数位数
		 *  rounding: 4   舍入条件 , 大于他才会进位, 小于则舍去, 需要retain的支持,不然无效
		 *  integer : 5,  整数,不足则补0 , 需要 repair 的支持
		 *  repair  : 补位, 小数不够0来凑, 整数不够0来凑 , 需要  retain 或者  integer 支持
		 *  format  : {
		 *  			part: 分隔符  默认是 [ - ]
		 *  			digit	 : 多少位插入分隔 默认是 4 位
		 *  			posi	 : 前面 还是后面?  left - right ,默认是 从 left开始
		 *  		}
		 *  zero: true 保留| false不保留 , 0 做保留吗?  补位时 忽略掉, 默认保留,
		 *  calc: 计算  实质调用 eval函数 , 主要是用于 0 变 1
		 * }
		 */
		number: function (n, expect) {
			n = new Number(n).valueOf();
			if (expect.calc) {
				n = eval((n + expect.calc));
			}
			//- > 是NaN 则不做任何处理
			if (isNaN(n)) {
				return "";
			}
			//-> 保留小数 
			if (expect.retain != undefined) {
				expect.retain = parseInt(expect.retain);
				var newN = parseInt(n * Math.pow(10, expect.retain));
				//-> 是否有舍入
				if (expect.rounding) {
					var str = new Number(n * Math.pow(10, expect.retain + 1)).toString();
					if (str[str.length - 1] > expect.rounding) {
						newN++;
					}
				}
				n = newN / Math.pow(10, expect.retain);
			}
			//-> 补位 
			if (expect.repair == "true" || expect.repair === true) {
				var req = (n + "").split(".");
				//-> 整数处理
				if (!isNaN(expect.integer)) {
					while (req[0].length < expect.integer) {
						req[0] = "0" + req[0];
					}
				}
				//-> 后面的小数处理
				if (expect.retain) {
					if (req.length == 1) {
						req.push("");
					}
					while (req[1].length < expect.retain) {
						req[1] += "0";
					}
				}
				n = req.join('.');
			}
			//-> 0 处理 默认是不处理的 只有 等于 false 才做处理  意味着 是 0 则不要, 对于补位 来说 0 处理会被覆盖掉
			else if (expect.zero == "false" || expect.zero === false) {
				if (n === 0.0) {
					n = "";
				}
			}
			//-> 拆分处理 , 对小数支持不是很友好
			if (expect.format) {
				var fn = n.toString().split('.');
				if (!expect.format.part) {
					expect.format.part = '-';
				}
				if (isNaN(expect.format.digit)) {
					expect.format.digit = 4;
				}
				n = util.division(expect.format, fn[0]);
				if (fn.length == 2) {
					n += "." + util.division(expect.format, fn[1]);
				}
			}
			return n;
		},
		/**
		 * 分割
		 * 值 : 	1112244555
		 * l ->	1111 2244 555
		 * r ->	111 1224 4555
		 * format  : {
		 *  			part: 分隔符  默认是 [ - ]
		 *  			digit	 : 多少位插入分隔 默认是 4 位
		 *  			posi	 : 前面 还是后面?  left - right ,默认是 从 left开始
		 *  		} 
		 */
		division: function (format, strNum) {
			var numArr = new Array();
			var _index = 0;
			if (format.posi === "right") {
				_index = strNum.length;
				while (_index > 0) {
					numArr.push(strNum.substring(_index - format.digit, _index));
					_index -= format.digit;
				}
				//->倒序
				numArr.reverse();
			} else {
				while (_index < strNum.length) {
					numArr.push(strNum.substring(_index, (_index += format.digit)));
				}
			}
			return numArr.join(format.part);
		}

	}
	//-> 赋值
	win.Rose = rose;
	win.Rose.util = util;

})(typeof window !== "undefined" ? window : this);

/**
 * 时间格式化
 */
Date.prototype.Format = function (format) {
	var f = {
		"yyyy": this.getFullYear(), //-> 年
		"yy": this.getFullYear() - (parseInt(this.getFullYear() / 100) * 100), //-> 后两位年
		"MM": this.getMonth() < 9 ? "0" + (this.getMonth() + 1) : (this.getMonth() + 1), //-> 月
		"M": this.getMonth() + 1, //-> 一位月
		"dd": this.getDate() < 9 ? "0" + this.getDate() : this.getDate(), //-> 日
		"d": this.getDate(), //-> 一位日
		"hh": this.getHours(), //-> 时
		"mm": this.getMinutes(), //-> 分
		"ss": this.getSeconds(), //-> 秒
		"SS": this.getMilliseconds(), //-> 毫秒
		"W": this.getDay() == 0 ? 7 : this.getDay() //-> 周
	}
	for (var k in f) {
		format = format.replace(k, f[k]);
	}
	return format;
}