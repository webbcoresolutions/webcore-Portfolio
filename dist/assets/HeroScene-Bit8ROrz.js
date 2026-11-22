import{O as e,f as t,g as n,s as r}from"./mount-DZml_-xe.js";import{_ as i,a,c as o,d as s,f as c,g as l,h as u,i as d,l as f,m as p,n as m,o as h,r as g,s as _,t as v,u as y,v as b}from"./three.module-BYgBlZ87.js";import{t as x}from"./main-FTO_u9Xl.js";var S=e(),C=r(),w=new g(`#2579DC`),T=new g(`#1653A9`),E=new g(`#8DB8F2`),D=`
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aSeed;
  varying float vAlpha;
  varying float vSeed;
  varying float vNear;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.18 + aSeed * 6.2831) * 0.28;
    p.y += cos(uTime * 0.14 + aSeed * 4.0) * 0.28;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uSize * aScale * uPixelRatio * (10.0 / max(depth, 0.1));
    vAlpha = smoothstep(42.0, 8.0, depth) * smoothstep(0.2, 1.4, depth);
    // Points close to the lens fall out of focus: bigger, softer, fainter (bokeh).
    vNear = smoothstep(5.0, 1.2, depth);
    gl_PointSize *= 1.0 + vNear * 2.2;
    vSeed = aSeed;
  }
`,O=`
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vSeed;
  varying float vNear;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float sharp = pow(smoothstep(0.5, 0.0, d), 1.7);
    float soft = smoothstep(0.5, 0.15, d) * 0.9;
    float a = mix(sharp, soft, vNear) * mix(1.0, 0.28, vNear);
    gl_FragColor = vec4(mix(uColorA, uColorB, vSeed), a * vAlpha * 0.85);
  }
`,k=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,A=`
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float edge = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
    float along = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
    vec3 col = mix(uColor, vec3(1.0), (1.0 - vUv.y) * 0.45);
    gl_FragColor = vec4(col, pow(edge, 0.8) * along * uOpacity);
  }
`;function j(e,t){let n=new m,r=new Float32Array(e*3),i=new Float32Array(e),a=new Float32Array(e);for(let t=0;t<e;t++)r[t*3]=(Math.random()-.5)*30,r[t*3+1]=(Math.random()-.5)*18,r[t*3+2]=6-Math.random()*64,i[t]=.35+Math.random()*Math.random()*1.6,a[t]=Math.random();n.setAttribute(`position`,new v(r,3)),n.setAttribute(`aScale`,new v(i,1)),n.setAttribute(`aSeed`,new v(a,1));let o=new u({vertexShader:D,fragmentShader:O,transparent:!0,depthWrite:!1,uniforms:{uTime:{value:0},uSize:{value:9},uPixelRatio:{value:t},uColorA:{value:w},uColorB:{value:E}}});return new c(n,o)}function M(e){let t=new a,n=new s(1,1),r=[w,E,w,T],i=Array.from({length:e},(e,i)=>{let a=i%2==0?-1:1,s={y:(Math.random()-.5)*9,rot:(i%3==0?-1:1)*(.42+Math.random()*.08),speed:.2+Math.random()*.35,phase:Math.random()*Math.PI*2},c=new o(n,new u({vertexShader:k,fragmentShader:A,transparent:!0,depthWrite:!1,side:2,uniforms:{uColor:{value:r[i%r.length]},uOpacity:{value:.1+Math.random()*.2}}}));return c.position.set(a*(3.2+Math.random()*7),s.y,2-Math.random()*34),c.rotation.z=s.rot,c.scale.set(.12+Math.random()*.32,4+Math.random()*6,1),t.add(c),s});return{group:t,update:e=>{t.children.forEach((t,n)=>{let r=i[n];t.position.y=r.y+Math.sin(e*r.speed+r.phase)*.35,t.rotation.z=r.rot+Math.sin(e*r.speed*.6+r.phase)*.03})}}}function N(e,t,n){let r=new a;r.rotation.set(...t);let s=new a,c=[];for(let t=0;t<=160;t++){let n=t/160*Math.PI*2;c.push(new i(Math.cos(n)*e,Math.sin(n)*e,0))}s.add(new h(new m().setFromPoints(c),new _({color:`#7FA9EC`,transparent:!0,opacity:n})));let u=new o(new l(.07,16,16),new f({color:`#2579DC`}));u.position.set(e,0,0);let d=new o(new l(.04,12,12),new f({color:`#8DB8F2`}));return d.position.set(-e*.7071,e*.7071,0),s.add(u,d),r.add(s),{outer:r,spin:s}}function P({active:e,reduced:r,mobile:i,onReady:o}){let s=(0,S.useRef)(null),c=(0,S.useRef)(null);return(0,S.useEffect)(()=>{let e=s.current,t;try{t=new b({antialias:!i,alpha:!0,powerPreference:`high-performance`})}catch{return}let l=Math.min(window.devicePixelRatio,i?1.5:2);t.setPixelRatio(l),t.setClearColor(0,0),e.appendChild(t.domElement);let u=new p;u.fog=new d(`#F3F7FF`,10,40);let f=new y(45,1,.1,80);f.position.set(0,0,8);let m=new a;u.add(m);let h=j(i?650:1700,l);m.add(h);let g=M(i?8:16);m.add(g.group);let _=new a;_.position.z=-3;let v=[{...N(5.6,[1.15,.2,0],.45),speed:.05},{...N(7.4,[1.3,-.35,.4],.3),speed:-.035},...i?[]:[{...N(4.2,[.9,.5,-.3],.25),speed:.07}]];v.forEach(e=>_.add(e.outer)),m.add(_);let S=()=>{let n=e.clientWidth,r=e.clientHeight;t.setSize(n,r,!1),f.aspect=n/r,f.updateProjectionMatrix()};S();let C=new ResizeObserver(S);C.observe(e);let w={p:x.progress,x:0,y:0},T=0,E=performance.now(),D=0,O=e=>{T+=e;let n=1-.001**e;w.p+=(x.progress-w.p)*n,w.x+=(x.pointerX-w.x)*n*.6,w.y+=(x.pointerY-w.y)*n*.6;let r=w.p*w.p*(3-2*w.p),i=x.exit;h.material.uniforms.uTime.value=T,g.update(T),v.forEach(t=>t.spin.rotation.z+=e*t.speed),m.rotation.z=r*.18+i*.12,f.position.set(w.x*.7,-w.y*.45-r*.6-i*1.5,8-r*22-i*12),f.lookAt(w.x*.2,-r*1.2-i*2,f.position.z-10),t.render(u,f)},k=e=>{let t=Math.max(0,Math.min((e-E)/1e3,.05));E=e,O(t),D=requestAnimationFrame(k)};return c.current={start:()=>{D||(E=performance.now(),D=requestAnimationFrame(k))},stop:()=>{cancelAnimationFrame(D),D=0},renderOnce:()=>O(.016)},r||n()?c.current.renderOnce():c.current.start(),requestAnimationFrame(()=>o?.()),()=>{c.current?.stop(),c.current=null,C.disconnect(),u.traverse(e=>{let t=e;t.geometry?.dispose(),t.material?.dispose?.()}),t.dispose(),t.domElement.remove()}},[i,r]),(0,S.useEffect)(()=>{if(r)return;let i=()=>{e&&!n()?c.current?.start():c.current?.stop()};return i(),window.addEventListener(t,i),()=>window.removeEventListener(t,i)},[e,r]),(0,C.jsx)(`div`,{ref:s,className:`hero__gl`,"aria-hidden":`true`})}export{P as default};