// This file will log info onto server
!(function initSelf(g){
	"use strict";
	let serverLogUrl = `${location.pathname.split('/').slice(0,2).join('/')}/wxweblog.do?method=printLog`;
	let logs = [];
	setInterval(()=>{
		sendLogXhr(getLogs());
	},3000);
	function getLogs(){
		let str = logs.join('\n');
		logs = [];
		return str;
	}
	function sendLogImg(str){
		if(!str)return;
		let url = `${location.pathname.split('/').slice(0,2).join('/')}/wxweblog.do?method=printLog&log=${encodeURIComponent(str)}`;
		let el = document.createElement('img');
		el.src = url;
	}
	function sendLogXhr(str){
		if(!str)return;
		let xhr = new XMLHttpRequest();
		xhr.open('POST',serverLogUrl,true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.send(`log=${encodeURIComponent(str)}`);
	}
	function sendLogBeacon(str){
		if(!str)return;
		navigator.sendBeacon(serverLogUrl, `log=${encodeURIComponent(str)}`);
	}
	if(navigator.sendBeacon){
		window.addEventListener('unload', ()=>{
			console.log('The page was unloaded.');
			sendLogBeacon(getLogs());
		});
	}
	//创建对象newConsole-------------------------------------------------------------------
	const newConsole = {
		_oldConsole:typeof console !== typeof undefined ?
				console:
				null,
		_commandFunc:{},
		logFilter:function logFilter(str){
			if(typeof console !== typeof undefined &&
				typeof console.logFilter === 'function' &&
				console.logFilter !== logFilter
			){
				return console.logFilter(str);
			}else{
				return str.slice(0,1500);
			}
		},
		log:null,
		info:null,
		warn:null,
		error:null,
	};
	{
		//收集console功能
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
		//console api
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
	}
	//catch error----------------------------------------------------------
	const logError = function(msg, url, lineNo, columnNo, error){
		//log stack
		newConsole.error(error);
		//log error info
		newConsole.error(
`Caught an error event!
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
	g.console = newConsole;
})(this);
