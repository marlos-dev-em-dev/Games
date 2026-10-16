/* =============================================================
   KINGDOMS OF TACTICS — engine.js
   Mini-engine WebGL 1.0: matemática, geometria procedural,
   renderização, câmera, picking e partículas. Zero dependências.
   ============================================================= */
'use strict';

/* ===================== MATEMÁTICA ===================== */
const TAU = Math.PI * 2;
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function lerp(a,b,t){ return a+(b-a)*t; }
function rand(a,b){ return a+Math.random()*(b-a); }
function randInt(a,b){ return Math.floor(a+Math.random()*(b-a+1)); }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function smooth(t){ t=clamp(t,0,1); return t*t*(3-2*t); }
function lerpAngle(a,b,t){ let d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI; return a+d*t; }
function mulberry32(s){ return function(){ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hex(n){ return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255]; }

function vAdd(a,b){ return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
function vSub(a,b){ return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function vScl(a,s){ return [a[0]*s,a[1]*s,a[2]*s]; }
function vDot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function vCross(a,b){ return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function vLen(a){ return Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]); }
function vNorm(a){ const l=vLen(a)||1; return [a[0]/l,a[1]/l,a[2]/l]; }
function vDist(a,b){ return vLen(vSub(a,b)); }
function vDistXZ(a,b){ const dx=a[0]-b[0],dz=a[2]-b[2]; return Math.sqrt(dx*dx+dz*dz); }
function vLerp(a,b,t){ return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]; }

function m4(){ const m=new Float32Array(16); m[0]=m[5]=m[10]=m[15]=1; return m; }
function m4Mul(a,b){ const o=new Float32Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++){ let s=0;
    for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; } return o; }
function m4T(x,y,z){ const m=m4(); m[12]=x; m[13]=y; m[14]=z; return m; }
function m4S(x,y,z){ const m=m4(); m[0]=x; m[5]=y; m[10]=z; return m; }
function m4RX(a){ const c=Math.cos(a),s=Math.sin(a),m=m4(); m[5]=c; m[6]=s; m[9]=-s; m[10]=c; return m; }
function m4RY(a){ const c=Math.cos(a),s=Math.sin(a),m=m4(); m[0]=c; m[2]=-s; m[8]=s; m[10]=c; return m; }
function m4RZ(a){ const c=Math.cos(a),s=Math.sin(a),m=m4(); m[0]=c; m[1]=s; m[4]=-s; m[5]=c; return m; }
function m4Persp(fovy,asp,n,f){ const t=1/Math.tan(fovy/2), nf=1/(n-f), m=new Float32Array(16);
  m[0]=t/asp; m[5]=t; m[10]=(f+n)*nf; m[11]=-1; m[14]=2*f*n*nf; return m; }
function m4Look(eye,ctr,up){ const z=vNorm(vSub(eye,ctr)), x=vNorm(vCross(up,z)), y=vCross(z,x);
  const m=new Float32Array(16);
  m[0]=x[0];m[1]=y[0];m[2]=z[0];m[3]=0; m[4]=x[1];m[5]=y[1];m[6]=z[1];m[7]=0;
  m[8]=x[2];m[9]=y[2];m[10]=z[2];m[11]=0;
  m[12]=-vDot(x,eye);m[13]=-vDot(y,eye);m[14]=-vDot(z,eye);m[15]=1; return m; }
function m4Inv(a){ const o=new Float32Array(16);
  const a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7],
        a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
  const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,
        b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,
        b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
  if(!det) return null; det=1/det;
  o[0]=(a11*b11-a12*b10+a13*b09)*det; o[1]=(a02*b10-a01*b11-a03*b09)*det;
  o[2]=(a31*b05-a32*b04+a33*b03)*det; o[3]=(a22*b04-a21*b05-a23*b03)*det;
  o[4]=(a12*b08-a10*b11-a13*b07)*det; o[5]=(a00*b11-a02*b08+a03*b07)*det;
  o[6]=(a32*b02-a30*b05-a33*b01)*det; o[7]=(a20*b05-a22*b02+a23*b01)*det;
  o[8]=(a10*b10-a11*b08+a13*b06)*det; o[9]=(a01*b08-a00*b10-a03*b06)*det;
  o[10]=(a30*b04-a31*b02+a33*b00)*det; o[11]=(a21*b02-a30*b04-a23*b00)*det;
  o[12]=(a11*b07-a10*b09-a12*b06)*det; o[13]=(a00*b09-a01*b07+a02*b06)*det;
  o[14]=(a31*b01-a30*b03-a32*b00)*det; o[15]=(a20*b03-a21*b01+a22*b00)*det; return o; }
function m4Point(m,p){ const x=p[0],y=p[1],z=p[2];
  const w=(m[3]*x+m[7]*y+m[11]*z+m[15])||1;
  return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w,(m[1]*x+m[5]*y+m[9]*z+m[13])/w,(m[2]*x+m[6]*y+m[10]*z+m[14])/w]; }
function m3FromM4(m){ return new Float32Array([m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10]]); }

/* ===================== GEOMETRIA PROCEDURAL ===================== */
function MB(){ this.p=[]; this.n=[]; this.c=[]; }
MB.prototype._v=function(p,n,c){
  this.p.push(p[0],p[1],p[2]); this.n.push(n[0],n[1],n[2]);
  this.c.push(c[0],c[1],c[2],c[3]===undefined?1:c[3]); };
MB.prototype.tri=function(a,b,c,col,mat){
  if(mat){ a=m4Point(mat,a); b=m4Point(mat,b); c=m4Point(mat,c); }
  const n=vNorm(vCross(vSub(b,a),vSub(c,a)));
  this._v(a,n,col); this._v(b,n,col); this._v(c,n,col); };
MB.prototype.quad=function(a,b,c,d,col,mat){ this.tri(a,b,c,col,mat); this.tri(a,c,d,col,mat); };
MB.prototype.box=function(x,y,z,w,h,d,col,mat){
  const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
  this.quad([x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],col,mat);
  this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],col,mat);
  this.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],col,mat);
  this.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],col,mat);
  this.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],col,mat);
  this.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],col,mat); };
MB.prototype.cyl=function(x,y,z,rB,rT,h,seg,col,mat,caps){
  for(let i=0;i<seg;i++){
    const a0=i/seg*TAU, a1=(i+1)/seg*TAU;
    const p0=[x+Math.cos(a0)*rB,y,z+Math.sin(a0)*rB], p1=[x+Math.cos(a1)*rB,y,z+Math.sin(a1)*rB];
    const p2=[x+Math.cos(a1)*rT,y+h,z+Math.sin(a1)*rT], p3=[x+Math.cos(a0)*rT,y+h,z+Math.sin(a0)*rT];
    this.quad(p0,p3,p2,p1,col,mat);
    if(caps){ this.tri([x,y,z],p0,p1,col,mat); this.tri([x,y+h,z],p2,p3,col,mat); }
  } };
MB.prototype.sphere=function(x,y,z,r,seg,rings,col,mat){
  for(let j=0;j<rings;j++){
    const p0=j/rings*Math.PI, p1=(j+1)/rings*Math.PI;
    for(let i=0;i<seg;i++){
      const t0=i/seg*TAU, t1=(i+1)/seg*TAU;
      const P=(ph,th)=>[x+r*Math.sin(ph)*Math.cos(th), y+r*Math.cos(ph), z+r*Math.sin(ph)*Math.sin(th)];
      const A=P(p0,t0),B=P(p0,t1),C=P(p1,t1),D=P(p1,t0);
      if(j>0) this.tri(A,B,C,col,mat);
      if(j<rings-1) this.tri(A,C,D,col,mat);
    } } };
MB.prototype.cone=function(x,y,z,r,h,seg,col,mat){ this.cyl(x,y,z,r,0,h,seg,col,mat,true); };
MB.prototype.merge=function(o,mat){
  if(!mat){ this.p.push.apply(this.p,o.p); this.n.push.apply(this.n,o.n); this.c.push.apply(this.c,o.c); return; }
  for(let i=0;i<o.p.length;i+=3){
    const p=m4Point(mat,[o.p[i],o.p[i+1],o.p[i+2]]);
    const n=m4Point(mat,[o.n[i],o.n[i+1],o.n[i+2]]);
    this.p.push(p[0],p[1],p[2]); this.n.push(n[0],n[1],n[2]);
    this.c.push(o.c[i/3*4],o.c[i/3*4+1],o.c[i/3*4+2],o.c[i/3*4+3]); } };
MB.prototype.build=function(gl,dyn){
  const mp=new Float32Array(this.p), mn=new Float32Array(this.n), mc=new Float32Array(this.c);
  const mk=(data)=>{ const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,data,dyn?gl.DYNAMIC_DRAW:gl.STATIC_DRAW); return b; };
  return { vbP:mk(mp), vbN:mk(mn), vbC:mk(mc), count:this.p.length/3, dyn:!!dyn,
           dataP:mp, dataN:mn, dataC:mc }; };

/* ===================== RENDERER ===================== */
const ENGINE_ERRORS=[];
function Renderer(canvas){
  this.canvas=canvas;
  const opt={antialias:true,alpha:false,depth:true};
  const gl=canvas.getContext('webgl',opt)||canvas.getContext('experimental-webgl',opt);
  if(!gl){ ENGINE_ERRORS.push('WebGL indisponível neste navegador.'); return; }
  this.gl=gl;
  const VS=`
    attribute vec3 aPos; attribute vec3 aNormal; attribute vec4 aColor;
    uniform mat4 uProj,uView,uModel; uniform mat3 uNormalMat;
    varying vec4 vColor; varying vec3 vNormal; varying vec3 vWorld;
    void main(){ vec4 w=uModel*vec4(aPos,1.0); vWorld=w.xyz;
      vNormal=normalize(uNormalMat*aNormal); vColor=aColor;
      gl_Position=uProj*uView*w; }`;
  const FS=`
    precision mediump float;
    varying vec4 vColor; varying vec3 vNormal; varying vec3 vWorld;
    uniform vec3 uLightDir,uLightCol,uAmbient,uCamPos,uFogCol;
    uniform float uUnlit,uAlpha,uFogNear,uFogFar;
    uniform vec4 uTint;
    void main(){
      vec3 n=normalize(vNormal);
      float d=max(dot(n,normalize(uLightDir)),0.0);
      float back=max(dot(n,normalize(-uLightDir)),0.0)*0.18;
      vec3 col=vColor.rgb*(uAmbient+uLightCol*d+vec3(back));
      vec3 vd=normalize(uCamPos-vWorld);
      col+=uLightCol*pow(1.0-max(dot(n,vd),0.0),3.0)*0.10;
      if(uUnlit>0.5) col=vColor.rgb;
      col=mix(col,uTint.rgb,uTint.a);
      float f=clamp((length(vWorld-uCamPos)-uFogNear)/(uFogFar-uFogNear),0.0,1.0);
      col=mix(col,uFogCol,f*0.55);
      gl_FragColor=vec4(col,vColor.a*uAlpha); }`;
  const sh=(t,src)=>{ const s=gl.createShader(t); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) ENGINE_ERRORS.push('Shader: '+gl.getShaderInfoLog(s));
    return s; };
  const pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
  gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) ENGINE_ERRORS.push('Link: '+gl.getProgramInfoLog(pr));
  this.pr=pr; gl.useProgram(pr);
  this.aPos=gl.getAttribLocation(pr,'aPos');
  this.aNrm=gl.getAttribLocation(pr,'aNormal');
  this.aCol=gl.getAttribLocation(pr,'aColor');
  gl.enableVertexAttribArray(this.aPos); gl.enableVertexAttribArray(this.aNrm); gl.enableVertexAttribArray(this.aCol);
  this.u={}; ['uProj','uView','uModel','uNormalMat','uLightDir','uLightCol','uAmbient','uCamPos',
    'uFogCol','uUnlit','uAlpha','uFogNear','uFogFar','uTint'].forEach(k=>this.u[k]=gl.getUniformLocation(pr,k));
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CCW);
  gl.uniform3fv(this.u.uLightDir,vNorm([0.55,0.92,0.36]));
  gl.uniform3fv(this.u.uLightCol,[1.02,0.95,0.82]);
  gl.uniform3fv(this.u.uAmbient,[0.40,0.43,0.50]);
  gl.uniform3fv(this.u.uFogCol,[0.60,0.72,0.84]);
  gl.uniform1f(this.u.uFogNear,44); gl.uniform1f(this.u.uFogFar,110);
  gl.uniform4fv(this.u.uTint,[0,0,0,0]);
  this.resize();
}
Renderer.prototype.resize=function(){
  const gl=this.gl; if(!gl) return;
  const d=Math.min(window.devicePixelRatio||1,2);
  const w=Math.floor(this.canvas.clientWidth*d), h=Math.floor(this.canvas.clientHeight*d);
  if(this.canvas.width!==w||this.canvas.height!==h){ this.canvas.width=w; this.canvas.height=h; }
  gl.viewport(0,0,w,h); this.aspect=w/Math.max(1,h);
};
Renderer.prototype.begin=function(cam){
  const gl=this.gl; if(!gl) return;
  gl.clearColor(0.585,0.725,0.855,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(this.pr);
  gl.uniformMatrix4fv(this.u.uProj,false,m4Persp(cam.fov,this.aspect,0.5,220));
  gl.uniformMatrix4fv(this.u.uView,false,cam.viewMatrix());
  const e=cam.eye(); gl.uniform3fv(this.u.uCamPos,e);
  this._cam=cam;
};
Renderer.prototype.draw=function(mesh,model,o){
  const gl=this.gl; o=o||{};
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vbP); gl.vertexAttribPointer(this.aPos,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vbN); gl.vertexAttribPointer(this.aNrm,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vbC); gl.vertexAttribPointer(this.aCol,4,gl.FLOAT,false,0,0);
  gl.uniformMatrix4fv(this.u.uModel,false,model||m4());
  gl.uniformMatrix3fv(this.u.uNormalMat,false,m3FromM4(model||m4()));
  gl.uniform1f(this.u.uUnlit,o.unlit?1:0);
  gl.uniform1f(this.u.uAlpha,o.alpha===undefined?1:o.alpha);
  gl.uniform4fv(this.u.uTint,o.tint||[0,0,0,0]);
  if(o.doubleSide) gl.disable(gl.CULL_FACE);
  if(o.blend){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    if(!o.depthWrite) gl.depthMask(false); }
  gl.drawArrays(gl.TRIANGLES,0,mesh.count);
  if(o.doubleSide) gl.enable(gl.CULL_FACE);
  if(o.blend){ gl.disable(gl.BLEND); gl.depthMask(true); }
};
/* Quadras dinâmicas orientadas à câmera (barras de vida, partículas, textos) */
Renderer.prototype.billboards=function(list){
  const gl=this.gl; if(!gl||!list.length) return;
  const cam=this._cam; const e=cam.eye(), t=cam.target;
  const fwd=vNorm(vSub(t,e)), right=vNorm(vCross([0,1,0],fwd)), up=vCross(fwd,right);
  const n=list.length;
  if(!this._bb){ this._bb=new MB(); }
  const mb=new MB();
  for(let i=0;i<n;i++){
    const it=list[i], hw=it.w/2, hh=it.h/2;
    const c=it.p;
    const a=vAdd(vAdd(c,vScl(right,-hw)),vScl(up,-hh));
    const b=vAdd(vAdd(c,vScl(right,hw)),vScl(up,-hh));
    const d=vAdd(vAdd(c,vScl(right,hw)),vScl(up,hh));
    const e2=vAdd(vAdd(c,vScl(right,-hw)),vScl(up,hh));
    mb.quad(a,b,d,e2,it.col);
  }
  const m=mb.build(gl,true);
  this.draw(m,m4(),{unlit:true,blend:true,depthWrite:false,doubleSide:true});
  gl.deleteBuffer(m.vbP); gl.deleteBuffer(m.vbN); gl.deleteBuffer(m.vbC);
};

/* ===================== CÂMERA ===================== */
function Camera(){
  this.target=[0,1,0]; this.dist=30; this.yaw=0.7; this.pitch=0.85; this.fov=Math.PI/4.2;
  this.goal={target:[0,1,0],dist:30,yaw:0.7,pitch:0.85};
}
Camera.prototype.set=function(t,d,y,p,instant){
  this.goal.target=t.slice(); this.goal.dist=d; this.goal.yaw=y; this.goal.pitch=p;
  if(instant){ this.target=t.slice(); this.dist=d; this.yaw=y; this.pitch=p; }
};
Camera.prototype.update=function(dt){
  const k=1-Math.exp(-dt*4.2);
  this.target=vLerp(this.target,this.goal.target,k);
  this.dist=lerp(this.dist,this.goal.dist,k);
  this.yaw=lerpAngle(this.yaw,this.goal.yaw,k);
  this.pitch=lerp(this.pitch,this.goal.pitch,k);
};
Camera.prototype.eye=function(){
  return [this.target[0]+this.dist*Math.cos(this.pitch)*Math.sin(this.yaw),
          this.target[1]+this.dist*Math.sin(this.pitch),
          this.target[2]+this.dist*Math.cos(this.pitch)*Math.cos(this.yaw)];
};
Camera.prototype.viewMatrix=function(){ return m4Look(this.eye(),this.target,[0,1,0]); };

/* ===================== PICKING ===================== */
function screenRay(cam,aspect,mx,my){
  const inv=m4Inv(m4Mul(m4Persp(cam.fov,aspect,0.5,220),cam.viewMatrix()));
  if(!inv) return null;
  const a=m4Point(inv,[mx,my,-1]), b=m4Point(inv,[mx,my,1]);
  return {o:a,d:vNorm(vSub(b,a))};
}
function rayPlane(r,y){ if(Math.abs(r.d[1])<1e-5) return null;
  const t=(y-r.o[1])/r.d[1]; return t>0? vAdd(r.o,vScl(r.d,t)) : null; }
function raySphere(r,c,rad){
  const oc=vSub(c,r.o); const b=vDot(oc,r.d);
  if(b<0) return Infinity;
  const h=vDot(oc,oc)-b*b; if(h>rad*rad) return Infinity;
  return b-Math.sqrt(Math.max(0,rad*rad-h));
}

/* ===================== PARTÍCULAS ===================== */
function FX(){ this.list=[]; }
FX.prototype.emit=function(p,col,n,spd,life,size,grav,spread){
  if(this.list.length>900) return;
  n=Math.round(n);
  for(let i=0;i<n;i++){
    const a=Math.random()*TAU, e=Math.random()*Math.PI-Math.PI/2;
    const s=(spread===undefined?1:spread);
    this.list.push({p:p.slice(),
      v:[Math.cos(a)*Math.cos(e)*spd*s,Math.abs(Math.sin(e))*spd*s*0.9+spd*0.25,Math.sin(a)*Math.cos(e)*spd*s],
      life:life,max:life,size:size*(0.6+Math.random()*0.8),col:col,grav:grav===undefined?9:grav});
  }
};
FX.prototype.text=function(p,txt,col){ /* números de dano via billboard */
  if(this.list.length>900) return;
  this.list.push({p:p.slice(),v:[0,2.6,0],life:1.05,max:1.05,size:0.85,col:col,grav:0,txt:txt});
};
FX.prototype.update=function(dt){
  for(let i=this.list.length-1;i>=0;i--){
    const q=this.list[i];
    q.p=vAdd(q.p,vScl(q.v,dt)); q.v[1]-=q.grav*dt; q.life-=dt;
    if(q.life<=0) this.list.splice(i,1);
  }
};
FX.prototype.draw=function(r){
  if(!this.list.length) return;
  const out=[];
  for(const q of this.list){
    const t=q.life/q.max;
    const a=q.txt?Math.min(1,t*1.6):(t*t);
    out.push({p:q.p,w:q.size*(q.txt?2.4:1),h:q.size*(q.txt?1.0:1),
      col:[q.col[0],q.col[1],q.col[2],a*(q.col[3]===undefined?1:q.col[3])]});
  }
  r.billboards(out);
};

/* ================================================
   STATIC BRIDGE — permite FX.emit() sem instância
   ================================================ */
(function(){
  const _fx = new FX();
  FX._shared = _fx;
  FX.emit  = function(){ return _fx.emit.apply(_fx, arguments); };
  FX.text  = function(){ return _fx.text.apply(_fx, arguments); };
  FX.update= function(dt){ return _fx.update(dt); };
  FX.draw  = function(r){ return _fx.draw(r); };
})();