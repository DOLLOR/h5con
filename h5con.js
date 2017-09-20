// This file will log info on web page
!(function initSelf(g){
	"use strict";
	//html--------------------------------------------------------------------------------
	const elCon = document.createElement('div');
	elCon.className = 'h5-console';
	elCon.innerHTML = `
	<style>
		.h5-console{
			box-sizing: border-box;
			position: fixed;
			top:0;
			right: 0;
			max-width: 100%;
			z-index: 1000;
		}
			.h5-console *{
				box-sizing: border-box;
			}
			.h5-console-number{
				width: 1.5em;
				height: 1.5em;
				color: #000;
				display: inline-block;
				text-decoration: none;
				border: 1px dotted currentColor;
				opacity: 0.1;
			}
			.h5-console-panel{
				width: 100vw;
			}
				.h5-console-panel textarea,.h5-console-panel select{
					width: 100%;
				}
				.h5-console-log{
					background-color: #fff;
					border: 1px solid #d6d6d6;
					height: 200px;
					overflow: auto;
					-webkit-overflow-scrolling: touch;
				}
					.h5-console-log-item{
						font-size: 12px;
						border-bottom:1px dotted #000;
						word-wrap: break-word;
						word-break: break-all;
						white-space: pre-wrap;
						min-height: 1em;
						overflow-y: hidden;
					}
					.h5-console-log-item::before{
						content: ': ';
					}
					.h5-console-log-item-cin::before{
						content: '> ';
					}
					.h5-console-log-item-cout::before{
						content: '< ';
					}
					.h5-console-log-item-info{
						color:#0087ff;
					}
					.h5-console-log-item-error{
						color:#f00;
					}
					.h5-console-log-item-warn{
						color:#ff9800;
					}
	</style>
	<a class="h5-console-number" href="javascript:void(0);">0</a>
	<div class="h5-console-panel">
		<div class="h5-console-button-list">
			<button type="button">top</button>
			<button type="button">bottom</button>
			<button type="button">×log</button>
			<button type="button">×input</button>
			<button type="button">run</button>
			<button type="button">close</button>
		</div>
		<select></select>
		<textarea rows="4" placeholder="JavaScript here..."></textarea>
		<div class="h5-console-log"></div>
	</div>`;
	const insertToBody = function(){
		const body = document.body||document.getElementsByTagName('body')[0];
		if(!body){
			addEventListener('load',insertToBody);
		}else{
			body.appendChild(elCon);
		}
	};
	insertToBody();
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
				return str;
			}
		},
		pushCommands(commands){
			for(let key in commands){
				if(Object.prototype.hasOwnProperty.call(commands,key)){
					let val = commands[key];
					if(typeof val === 'function'){
						//函数命令
						let fname = `commandFunc_${key}`;
						this._commandFunc[fname] = val;
						conEl.pushOption(key,fname);
					}else{
						//字符串命令
						conEl.pushOption(key,val);
					}
				}
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
				conEl.pushLog(args.map(stringify).join('\t'),method);
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
	//----------------------------------------------------------------
	const gebq = function(selector,pEle=document){
		return pEle.querySelector(selector);
	};
	const gelbq = function(selector,pEle=document){
		return Array.from(pEle.querySelectorAll(selector));
	};
	const conEl = {
		num:gebq('.h5-console-number',elCon),
		panel:gebq('.h5-console-panel',elCon),
		log:gebq('.h5-console-log',elCon),
		select:gebq('select',elCon),
		textarea:gebq('textarea',elCon),
		pushLog(str,method){
			let time = (function(currentDate){
				let hour = currentDate.getHours();
				let minute = currentDate.getMinutes();
				let second = currentDate.getSeconds();
				let milli = currentDate.getMilliseconds();
				return `${hour}:${minute}:${second}:${milli}`;
			})(new Date());
			str = newConsole.logFilter(str);
			if(str==null)return;
			let div = document.createElement('div');
			div.className = `h5-console-log-item h5-console-log-item-${method}`;
			div.innerText = `${time}| ${str}`;
			div.style.maxHeight = '5em';
			div.onclick = function(){
				this.style.maxHeight = this.style.maxHeight ? '' : '5em';
				this.style.backgroundColor = this.style.backgroundColor ? '' : '#efefef';
			};
			this.log.appendChild(div);
			this.num.innerText = this.num.innerText * 1 +1;
		},
		pushOption(key,val){
			let elOp = document.createElement('option');
			elOp.innerText = key;
			elOp.value = val;
			this.select.appendChild(elOp);
		},
	};
	//init el--------------------------------------------------
	conEl.panel.style.display = 'none';
	conEl.num.onclick = function(){
		if(conEl.panel.style.display){
			conEl.panel.style.display = '';
		}else{
			conEl.panel.style.display = 'none';
		}
	};
	conEl.select.onchange = function(ev){
		conEl.textarea.value = this.value;
	};
	gebq('.h5-console-button-list',conEl.panel).onclick = function(ev){
		if(!ev) ev = event;
		let action = ev.target ? ev.target.innerText : ev.srcElement.innerText;
		switch(action){
			case 'top':
				conEl.log.scrollTop = 0;
				break;
			case 'bottom':
				conEl.log.scrollTop = conEl.log.scrollHeight;
				break;
			case '×log':
				conEl.log.innerHTML = '';
				break;
			case '×input':
				conEl.textarea.value = '';
				break;
			case 'run':{
				let str = conEl.textarea.value;
				newConsole.cin(str);
				let fun;
				if(newConsole._commandFunc[str]){
					fun = ()=>newConsole._commandFunc[str]();
				}else{
					fun = ()=>g.eval(str);
				}
				try{
					str = fun();
					newConsole.cout(str);
					break;
				}catch(er){
					newConsole.cout(er);
					throw er;
				}
			}
			case 'close':
				conEl.panel.style.display = 'none';
		}
		
	};
	//init con-------------------------------------------------
	newConsole.log('location.href=',location.href);
	newConsole.pushCommands({
		'--commands--':'',
		localStorage:'localStorage',
		cookie:'document.cookie',
		box:
`[].forEach.call(document.all,function(a){
	try{
		a.style.outline="1px solid #"+(~~(Math.random()*(1<<24))).toString(16)
	}catch(er){}
});`,
		testError(){
			setTimeout(()=>testErrorrrrrrrrrrrr,500);
		},
	});
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
