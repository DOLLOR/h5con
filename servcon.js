// This file will log info onto server
!(function initSelf(g){
	"use strict";
	function sendLog(str){
		let url = `/log.do?method=printLog&log=${encodeURIComponent(str)}`;
		let el = document.createElement('img');
		el.src = url;
	}
	//创建对象newConsole-------------------------------------------------------------------
	const newConsole = {
		_oldConsole:typeof console !== typeof undefined ?
				console:
				null,
		_commandFunc:{},
		logFilter(str){
			return str;
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
				let time = new Date().toString().match(/\d+\:\d+\:\d+/)[0],
					res;

				log2browserConsole:{
					if(!oldConsole || !oldConsole[method]) break log2browserConsole;
					try{
						res = oldConsole[method](...args);
					}catch(er){
						res = oldConsole[method](args.join('\t'));
					}
				}
				//log to h5console
				sendLog(args.map(stringify).join('\t'),method);
				return res;
			};
		}
		const stringify = function(o){
			if(o==null){
				return String(o);
			}else if(typeof o.stack === 'string' && typeof o.message ==='string'){
				return `${o.message}\n${o.stack}`;
			}else if(typeof o !== 'string'){
				var res = JSON.stringify(o,function(key,value){
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
