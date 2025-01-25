!function(){"use strict";(t=>{const{screen:{width:e,height:a},navigator:{language:r},location:n,document:i,history:c}=t,{hostname:o,href:s,origin:u}=n,{currentScript:l,referrer:d}=i,f=s.startsWith("data:")?void 0:t.localStorage;if(!l)return;const h="data-",m=l.getAttribute.bind(l),p=m(h+"website-id"),g=m(h+"host-url"),y=m(h+"tag"),b="false"!==m(h+"auto-track"),v="true"===m(h+"exclude-search"),w=m(h+"domains")||"",S=w.split(",").map((t=>t.trim())),N=`${(g||""||l.src.split("/").slice(0,-1).join("/")).replace(/\/$/,"")}/api/send`,T=`${e}x${a}`,A=/data-umami-event-([\w-_]+)/,x=h+"umami-event",O=300,U=m(h+"url-overwrite"),j=t=>{if(t){try{const e=decodeURI(t);if(e!==t)return e}catch(e){return t}return encodeURI(t)}},k=e=>{try{const{pathname:t,search:a,hash:r}=new URL(e,n.href);e=t+a+r}catch(t){}const a=v?e.split("?")[0]:e;return U&&"function"==typeof t[U]&&t[U](a)||a},E=()=>({website:p,hostname:o,screen:T,language:r,title:j(C),url:j(_),referrer:j(q),tag:y||void 0}),L=(t,e,a)=>{a&&(q=_,_=k(a.toString()),_!==q&&setTimeout(R,O))},$=()=>!p||f&&f.getItem("umami.disabled")||w&&!S.includes(o),I=async(t,e="event")=>{if($())return;const a={"Content-Type":"application/json"};void 0!==D&&(a["x-umami-cache"]=D);try{const r=await fetch(N,{method:"POST",body:JSON.stringify({type:e,payload:t}),headers:a}),n=await r.text();return D=n}catch(t){}},K=()=>{W||(R(),(()=>{const t=(t,e,a)=>{const r=t[e];return(...e)=>(a.apply(null,e),r.apply(t,e))};c.pushState=t(c,"pushState",L),c.replaceState=t(c,"replaceState",L)})(),(()=>{const t=new MutationObserver((([t])=>{C=t&&t.target?t.target.text:void 0})),e=i.querySelector("head > title");e&&t.observe(e,{subtree:!0,characterData:!0,childList:!0})})(),i.addEventListener("click",(async t=>{const e=t=>["BUTTON","A"].includes(t),a=async t=>{const e=t.getAttribute.bind(t),a=e(x);if(a){const r={};return t.getAttributeNames().forEach((t=>{const a=t.match(A);a&&(r[a[1]]=e(t))})),R(a,r)}},r=t.target,i=e(r.tagName)?r:((t,a)=>{let r=t;for(let t=0;t<a;t++){if(e(r.tagName))return r;if(r=r.parentElement,!r)return null}})(r,10);if(!i)return a(r);{const{href:e,target:r}=i,c=i.getAttribute(x);if(c)if("A"===i.tagName){const o="_blank"===r||t.ctrlKey||t.shiftKey||t.metaKey||t.button&&1===t.button;if(c&&e)return o||t.preventDefault(),a(i).then((()=>{o||(n.href=e)}))}else if("BUTTON"===i.tagName)return a(i)}}),!0),W=!0)},R=(t,e)=>I("string"==typeof t?{...E(),name:t,data:"object"==typeof e?e:void 0}:"object"==typeof t?t:"function"==typeof t?t(E()):E()),B=t=>I({...E(),data:t},"identify");t.umami||(t.umami={track:R,identify:B});let D,W,_=k(s),q=d.startsWith(u)?"":d,C=i.title;b&&!$()&&("complete"===i.readyState?K():i.addEventListener("readystatechange",K,!0))})(window)}();
