// This file will log info onto server
!(function initSelf(g){
	"use strict";
	/**
	 * The api address where the logs will be post to
	 */
	let serverLogUrl = `${location.pathname.split('/').slice(0,2).join('/')}/wxweblog.do?method=printLog`;

	/**
	 * max length for each log item
	 */
	let maxLength = 1500;

	let logFilter = function(str){
		if(
			this &&
			this._oldConsole &&
			typeof this._oldConsole.logFilter === 'function'
		){
			return this._oldConsole.logFilter(str);
		}else{
			return str.slice(0,maxLength);
		}
	};

	/**
	 * The list where logs will be stored in
	 */
	let logs = [];

	/**
	 * Send logs automatically
	 */
	setInterval(()=>{
		sendLogXhr(getLogs());
	},3000);

	/**
	 * Get logs from list
	 */
	function getLogs(){
		if(logs.length<1) return '';
		logs.unshift(
			'-----href-----',
			location.href,
			'-----UA-----',
			navigator.userAgent
		);
		let str = logs.join('\n');
		logs = [];
		return str;
	}

	/**
	 * send logs by img tag
	 * @param {*} str 
	 */
	function sendLogImg(str){
		if(!str)return;
		let url = `${serverLogUrl}&log=${encodeURIComponent(str)}`;
		let el = document.createElement('img');
		el.src = url;
	}

	/**
	 * send logs by xhr post
	 * @param {*} str 
	 */
	function sendLogXhr(str){
		if(!str)return;
		let xhr = new XMLHttpRequest();
		xhr.open('POST',serverLogUrl,true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.send(`log=${encodeURIComponent(str)}`);
	}

	/**
	 * send logs by navigator.sendBeacon api
	 * @param {*} str 
	 */
	function sendLogBeacon(str){
		if(!str)return;
		let url = `${serverLogUrl}&log=${encodeURIComponent(str)}`;
		navigator.sendBeacon(url, 'Beacon');
	}

	/**
	 * handle unload event
	 * @param {Event} ev
	 */
	const unloadHandler = function(ev){
		let logString = getLogs();
		if(!logString) return;
		if(navigator.sendBeacon){
			logString = `sendBeacon, ${ev.type}\n${logString}`;
			sendLogBeacon(logString);
		}else{
			logString = `sendPic, ${ev.type}\n${logString}`;
			sendLogImg(logString);
		}
	};
	window.addEventListener('unload',unloadHandler);
	window.addEventListener('beforeunload',unloadHandler);
	window.addEventListener('pagehide',unloadHandler);
	document.addEventListener('visibilitychange',unloadHandler);
	//newConsole-------------------------------------------------------------------
	/**
	 * new console api
	 */
	const newConsole = {
		_oldConsole:typeof console !== typeof undefined ?
				console:
				null,
		_commandFunc:{},
		logFilter,
		log:null,
		info:null,
		warn:null,
		error:null,
	};
	//console api list
	const oldConsole = newConsole._oldConsole;
	const consoleMethods = ["cin","cout","debug", "error", "info", "log", "warn", "dir", "dirxml", "table", "trace", "group", "groupCollapsed", "groupEnd", "clear", "count", "assert", "markTimeline", "profile", "profileEnd", "timeline", "timelineEnd", "time", "timeEnd", "timeStamp", "memory"];
	if(oldConsole){
		for(let m in oldConsole){
			if(
				Object.prototype.hasOwnProperty.call(oldConsole,m)&&
				consoleMethods.indexOf(m)<0&&
				!(m in newConsole)&&
				oldConsole[m]
			){
				consoleMethods.push(m);
			}
		}
	}
	//console api implement
	for(let i=0;i<consoleMethods.length;i++){
		let method = consoleMethods[i];

		//console.log, etc
		newConsole[method] = function(...args){
			let time = (function(currentDate){
				let year = currentDate.getFullYear();
				let month = currentDate.getMonth()+1;
				let day = currentDate.getDate();
				let hour = currentDate.getHours();
				let minute = currentDate.getMinutes();
				let second = currentDate.getSeconds();
				let milli = currentDate.getMilliseconds();
				return `${year}.${month}.${day}/${hour}:${minute}:${second}:${milli}`;
			})(new Date()),
				res;

			log2browserConsole:{
				if(!oldConsole || !oldConsole[method]) break log2browserConsole;
				try{
					res = oldConsole[method](...args);
				}catch(er){
					res = oldConsole[method](args.join('\t'));
				}
			}

			let logBody = args.map(stringify).join('\t');
			logBody = newConsole.logFilter(logBody);
			if(logBody==null) return res;

			let logHead = `${time} ${method}`;

			logs.push(`-----${logHead}-----\n${logBody}`);
			return res;
		};
	}
	/**
	 * convert any object to string
	 * @param {*} o 
	 */
	const stringify = function(o){
		if(o==null){
			return String(o);
		}else if(typeof o.stack === 'string' && typeof o.message ==='string'){
			return `${o.message}\n${o.stack}`;
		}else if(typeof o !== 'string'){
			let res = JSON.stringify(o,function(key,value){
				if(typeof value === "function"){
					return value.toString();
				}
				return value;
			},"  ");
			return res;
		}else if(o ===''){
			return '\'\'';
		}else{
			return o;
		}
	};
	//catch error----------------------------------------------------------
	/**
	 * handle global error event
	 * @param {String} msg - error message
	 * @param {String} url - file
	 * @param {Number} lineNo - line number
	 * @param {Number} columnNo - column number
	 * @param {Error} error - error object
	 */
	const logError = function(msg, url, lineNo, columnNo, error){
		//log stack
		newConsole.error(error);
		//log error info
		newConsole.error(
`Caught an error event!
page:${location.href}
url:${url}
line:${lineNo}:${columnNo}
${msg}`
		);
	};
	if(typeof addEventListener !== typeof undefined){
		addEventListener('error',function({filename,lineno,colno,message,error}){
			logError(message,filename,lineno,colno,error);
		});
	}
	else if(typeof attachEvent !== typeof undefined){
		attachEvent('onerror',function(msg, url, lineNo, columnNo, error){
			logError(msg,url,lineNo,columnNo,error);
		});
	}
	else{
		onerror = function(msg, url, lineNo, columnNo, error){
			logError(msg,url,lineNo,columnNo,error);
		};
	}

	//replace console with new console
	g.console = newConsole;
})(this);
