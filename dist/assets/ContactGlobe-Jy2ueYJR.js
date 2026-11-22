import{O as e,d as t,f as n,g as r,s as i}from"./mount-DZml_-xe.js";import{_ as a,a as o,c as s,f as c,g as l,h as u,l as d,m as ee,n as f,o as p,p as te,r as m,s as h,t as g,u as ne,v as re}from"./three.module-BYgBlZ87.js";var _=e(),v=i(),y=Math.PI/180;function ie(e,t,n=1){let r=e*y,i=t*y;return new a(Math.cos(r)*Math.cos(i)*n,Math.sin(r)*n,-Math.cos(r)*Math.sin(i)*n)}var ae=`
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vFacing;
  varying float vSeed;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vFacing = n.z;
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.65 + aSeed * 0.7);
  }
`,b=`
  uniform vec3 uColor;
  uniform float uTime;
  varying float vFacing;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, d);
    float facing = smoothstep(-0.15, 0.55, vFacing);
    float twinkle = 0.75 + 0.25 * sin(uTime * 1.5 + vSeed * 40.0);
    gl_FragColor = vec4(uColor, a * facing * twinkle * 0.85);
  }
`,oe=`
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,se=`
  uniform vec3 uColor;
  varying vec3 vNormal;
  void main() {
    float i = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
    gl_FragColor = vec4(uColor, 1.0) * i * 0.85;
  }
`;function x({reduced:e,mobile:i}){let x=(0,_.useRef)(null),S=(0,_.useRef)([]);return(0,_.useEffect)(()=>{let _=x.current,v;try{v=new re({antialias:!0,alpha:!0,powerPreference:`high-performance`})}catch{_.classList.add(`is-fallback`);return}let C=Math.min(window.devicePixelRatio,i?1.5:2);v.setPixelRatio(C),v.setClearColor(0,0),_.prepend(v.domElement);let w=new ee,T=new ne(32,1,.1,50);T.position.set(0,0,4.4);let E=new o,D=new o;E.add(D),w.add(E),E.rotation.x=34*y;let O=-Math.PI/2-36*y;D.rotation.y=O,D.add(new s(new l(.985,64,64),new d({color:`#081a44`})));let k=i?1800:3400,A=new Float32Array(k*3),j=new Float32Array(k),ce=Math.PI*(3-Math.sqrt(5));for(let e=0;e<k;e++){let t=1-e/(k-1)*2,n=Math.sqrt(1-t*t),r=ce*e;A[e*3]=Math.cos(r)*n,A[e*3+1]=t,A[e*3+2]=Math.sin(r)*n,j[e]=Math.random()}let M=new f;M.setAttribute(`position`,new g(A,3)),M.setAttribute(`aSeed`,new g(j,1));let N=new u({vertexShader:ae,fragmentShader:b,transparent:!0,depthWrite:!1,uniforms:{uSize:{value:i?2.4:2.8},uPixelRatio:{value:C},uColor:{value:new m(`#8DB8F2`)},uTime:{value:0}}});D.add(new c(M,N));let le=new s(new l(1.16,64,64),new u({vertexShader:oe,fragmentShader:se,blending:2,side:1,transparent:!0,depthWrite:!1,uniforms:{uColor:{value:new m(`#3f8ef0`)}}}));w.add(le);let P=t.map(e=>{let t=ie(e.lat,e.lon,1.002),n=new s(new l(e.hq?.03:.022,20,20),new d({color:e.hq?`#ffffff`:`#bfd8ff`}));n.position.copy(t);let r=new s(new te(.035,.045,48),new d({color:`#5aa0f5`,transparent:!0,opacity:.8,depthWrite:!1}));return r.position.copy(t.clone().multiplyScalar(1.001)),r.lookAt(t.clone().multiplyScalar(2)),D.add(n,r),{p:t,ring:r,hq:!!e.hq}}),F=P.find(e=>e.hq),ue=P.filter(e=>!e.hq).map((e,t)=>{let n=[],r=F.p.angleTo(e.p);for(let t=0;t<=96;t++){let i=t/96,o=new a().copy(F.p).lerp(e.p,i).normalize();o.multiplyScalar(1+Math.sin(Math.PI*i)*r*.32),n.push(o)}let i=new f().setFromPoints(n);i.setDrawRange(0,0);let o=new p(i,new h({color:`#6fb0ff`,transparent:!0,opacity:.85})),c=new s(new l(.016,12,12),new d({color:`#ffffff`}));return D.add(o,c),{pts:n,geo:i,comet:c,offset:t*.5}}),I=[];for(let e=0;e<=200;e++){let t=e/200*Math.PI*2;I.push(new a(Math.cos(t)*1.42,0,Math.sin(t)*1.42))}let L=new p(new f().setFromPoints(I),new h({color:`#8DB8F2`,transparent:!0,opacity:.18}));L.rotation.set(1.25,.2,.3),w.add(L);let R=()=>{let e=_.clientWidth,t=_.clientHeight;v.setSize(e,t,!1),T.aspect=e/t,T.updateProjectionMatrix()};R();let z=new ResizeObserver(R);z.observe(_);let B={x:0,y:0,sx:0,sy:0},V=e=>{B.x=e.clientX/window.innerWidth-.5,B.y=e.clientY/window.innerHeight-.5};!i&&!e&&window.addEventListener(`pointermove`,V,{passive:!0});let H=new a,U=new a,W=0,G=performance.now(),K=0,q=!0,J=e=>{W+=e,B.sx+=(B.x-B.sx)*Math.min(1,e*3),B.sy+=(B.y-B.sy)*Math.min(1,e*3),N.uniforms.uTime.value=W,D.rotation.y=O+Math.sin(W*.12)*.14+B.sx*.4,E.rotation.x=34*y+B.sy*.25,L.rotation.z+=e*.05,P.forEach((e,t)=>{let n=(W*.6+t*.33)%1;e.ring.scale.setScalar(1+n*2.2),e.ring.material.opacity=(1-n)*.8}),ue.forEach(e=>{let t=Math.min(1,Math.max(0,(W-.6-e.offset)/1.4));e.geo.setDrawRange(0,Math.floor(t*97));let n=(W*.35+e.offset)%1,r=Math.max(0,Math.min(96,Math.floor(n*96)));e.comet.position.copy(e.pts[r]),e.comet.visible=t>=1}),v.render(w,T),T.getWorldDirection(U),P.forEach((e,n)=>{let r=S.current[n];if(!r)return;e.ring.getWorldPosition(H);let i=H.clone().normalize().dot(U.clone().negate());H.project(T);let a=(H.x*.5+.5)*_.clientWidth,o=(-H.y*.5+.5)*_.clientHeight,s=t[n].hq?16:t[n].lon>60?-16:0;r.style.transform=`translate3d(${a.toFixed(1)}px, ${(o+s).toFixed(1)}px, 0) translateY(-50%)`,r.style.opacity=String(Math.max(0,Math.min(1,(i-.1)*4)))})},Y=e=>{let t=Math.max(0,Math.min((e-G)/1e3,.05));G=e,J(t),q&&!r()&&(K=requestAnimationFrame(Y))},X=()=>{W<3&&(W=3),J(0)},Z=()=>{cancelAnimationFrame(K),!q||e||r()||(G=performance.now(),K=requestAnimationFrame(Y))};e||r()?X():K=requestAnimationFrame(Y);let Q=new IntersectionObserver(([e])=>{q=e.isIntersecting,Z()});Q.observe(_);let $=()=>r()?(cancelAnimationFrame(K),X()):Z();return window.addEventListener(n,$),()=>{cancelAnimationFrame(K),window.removeEventListener(n,$),Q.disconnect(),z.disconnect(),window.removeEventListener(`pointermove`,V),w.traverse(e=>{let t=e;t.geometry?.dispose(),t.material?.dispose?.()}),v.dispose(),v.domElement.remove()}},[i,e]),(0,v.jsx)(`div`,{className:`globe`,ref:x,"aria-hidden":`true`,children:t.map((e,t)=>(0,v.jsxs)(`span`,{className:`globe__label ${e.hq?`is-hq`:``}`,ref:e=>S.current[t]=e,children:[(0,v.jsx)(`i`,{}),(0,v.jsxs)(`span`,{children:[e.region,e.hq&&(0,v.jsx)(`b`,{children:`HQ`})]})]},e.region))})}export{x as default};