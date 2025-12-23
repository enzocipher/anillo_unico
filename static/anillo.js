
(function(){
  function playFinalSound(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const now = ctx.currentTime
      const freqs = [440,660,880]
      freqs.forEach((f,i)=>{
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = i===1? 'sine' : 'triangle'; o.frequency.setValueAtTime(f, now + i*0.08)
        g.gain.setValueAtTime(0.0001, now)
        g.gain.linearRampToValueAtTime(0.12, now + 0.04 + i*0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.34 + i*0.06)
        o.connect(g); g.connect(ctx.destination); o.start(now + i*0.08); o.stop(now + 0.34 + i*0.06)
      })
      setTimeout(()=>{
        const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
        o2.type='sine'; o2.frequency.setValueAtTime(160, ctx.currentTime)
        g2.gain.setValueAtTime(0.6, ctx.currentTime)
        g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.36)
        const f = ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value = 900
        o2.connect(f); f.connect(g2); g2.connect(ctx.destination);
        o2.start(); o2.stop(ctx.currentTime + 0.36)
      }, 120)
    }catch(e){ console.warn('WebAudio not available', e) }
  }

  
  function startRenderer(){
    const canvas = document.getElementById('glcanvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if(!gl){ console.warn('WebGL not available'); return }
    function resize(){ canvas.width = Math.floor(canvas.clientWidth * devicePixelRatio); canvas.height = Math.floor(canvas.clientHeight * devicePixelRatio); gl.viewport(0,0,canvas.width,canvas.height) }
    window.addEventListener('resize', resize); resize()

    
    const vs = `attribute vec3 position;attribute vec3 normal;attribute vec2 uv;uniform mat4 mvp;uniform mat4 model;varying vec3 vNormal;varying vec2 vUv;void main(){vNormal = mat3(model)*normal;vUv=uv;gl_Position = mvp * vec4(position,1.0);}`
    const fs = `precision mediump float;varying vec3 vNormal;varying vec2 vUv;uniform sampler2D tex;uniform vec3 light;void main(){vec3 n = normalize(vNormal);float l = max(dot(n,normalize(light)),0.15);vec4 color = texture2D(tex,vUv);gl_FragColor = vec4(color.rgb * l, color.a);}`
    function compile(src, type){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s)); return s }
    const prog = gl.createProgram(); gl.attachShader(prog, compile(vs, gl.VERTEX_SHADER)); gl.attachShader(prog, compile(fs, gl.FRAGMENT_SHADER)); gl.linkProgram(prog); if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.warn(gl.getProgramInfoLog(prog)); gl.useProgram(prog)

    const attPosition = gl.getAttribLocation(prog,'position'); const attNormal = gl.getAttribLocation(prog,'normal'); const attUv = gl.getAttribLocation(prog,'uv')
    const uniMvp = gl.getUniformLocation(prog,'mvp'); const uniModel = gl.getUniformLocation(prog,'model'); const uniTex = gl.getUniformLocation(prog,'tex'); const uniLight = gl.getUniformLocation(prog,'light')

    
    
    
    function createTorus(R, r, segR, segr, scaleZ = 0.5, grooveDepth = 0.0, grooveWidth = 0.6, grooveTurns = 1.0){
      const positions=[]; const normals=[]; const uvs=[]; const indices=[]
      const TWO_PI = Math.PI*2
      function angleDiff(a,b){ 
        let d = a - b
        while(d <= -Math.PI) d += TWO_PI
        while(d > Math.PI) d -= TWO_PI
        return d
      }

      for(let i=0;i<=segR;i++){
        const theta = i/(segR)*TWO_PI
        const cosT = Math.cos(theta), sinT = Math.sin(theta)
        
        const targetPhiForTheta = (theta * grooveTurns) % TWO_PI
        for(let j=0;j<=segr;j++){
          const phi = j/(segr)*TWO_PI
          const cosP = Math.cos(phi), sinP = Math.sin(phi)
          
          const dphi = angleDiff(phi, targetPhiForTheta)
          
          const groove = -grooveDepth * Math.exp(- (dphi*dphi) / (2 * grooveWidth * grooveWidth))

          
          const cx = R * cosT, cy = R * sinT, cz = 0
          
          const radial = r * cosP + groove
          const x = (R + radial) * cosT
          const y = (R + radial) * sinT
          const z = r * sinP * scaleZ
          positions.push(x,y,z)

          
          let nx = x - cx, ny = y - cy, nz = z - cz
          const len = Math.hypot(nx,ny,nz) || 1
          nx/=len; ny/=len; nz/=len
          normals.push(nx,ny,nz)
          uvs.push(i/segR, j/segr)
        }
      }
      for(let i=0;i<segR;i++){
        for(let j=0;j<segr;j++){
          const a = i*(segr+1)+j
          const b = (i+1)*(segr+1)+j
          indices.push(a,b,a+1,b,b+1,a+1)
        }
      }
      return {positions:new Float32Array(positions), normals:new Float32Array(normals), uvs:new Float32Array(uvs), indices:new Uint16Array(indices)}
    }

    
    
    const tor = createTorus(
    1.0,    
    0.16,   
    128,
    80,
    1.6,    
    0.05,
    0.45,
    1.0
    )



    function makeBuffer(data, itemSize, attrib){ const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(attrib); gl.vertexAttribPointer(attrib, itemSize, gl.FLOAT, false, 0, 0); return buf }
    const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,posBuf); gl.bufferData(gl.ARRAY_BUFFER, tor.positions, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(attPosition); gl.vertexAttribPointer(attPosition,3,gl.FLOAT,false,0,0)
    const nBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,nBuf); gl.bufferData(gl.ARRAY_BUFFER, tor.normals, gl.STATIC_DRAW); gl.enableVertexAttribArray(attNormal); gl.vertexAttribPointer(attNormal,3,gl.FLOAT,false,0,0)
    const uvBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,uvBuf); gl.bufferData(gl.ARRAY_BUFFER, tor.uvs, gl.STATIC_DRAW); gl.enableVertexAttribArray(attUv); gl.vertexAttribPointer(attUv,2,gl.FLOAT,false,0,0)
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tor.indices, gl.STATIC_DRAW)

    
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([180,220,200,255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    function loadTextureFrom(url){
      const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = ()=>{
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        
        const isPowerOf2 = (v) => (v & (v - 1)) === 0;
        if (isPowerOf2(img.width) && isPowerOf2(img.height)){
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        } else {
          
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
      }
      img.onerror = ()=>console.warn('Texture failed to load:', url)
      img.src = url
    }

    
    const params = new URLSearchParams(location.search); const texUrl = params.get('tex') || '/static/doro.jpg'
    loadTextureFrom(texUrl)

    
    function perspective(out, fovy, aspect, near, far){ const f = 1/Math.tan(fovy/2); out[0]=f/aspect; out[1]=0; out[2]=0; out[3]=0; out[4]=0; out[5]=f; out[6]=0; out[7]=0; out[8]=0; out[9]=0; out[10]=(far+near)/(near-far); out[11]=-1; out[12]=0; out[13]=0; out[14]=(2*far*near)/(near-far); out[15]=0 }
    function multiply(a,b){ const o = new Float32Array(16); for(let i=0;i<4;i++){ for(let j=0;j<4;j++){ let s=0; for(let k=0;k<4;k++) s+=a[k*4 + j]*b[i*4 + k]; o[i*4 + j]=s }} return o }
    function identity(){ const m = new Float32Array(16); m[0]=1; m[5]=1; m[10]=1; m[15]=1; return m }
    function translate(m, v){ const r = identity(); r[12]=v[0]; r[13]=v[1]; r[14]=v[2]; return multiply(m,r) }
    function rotateY(m, a){ const r = identity(); const c=Math.cos(a), s=Math.sin(a); r[0]=c; r[2]=s; r[8]=-s; r[10]=c; return multiply(m,r) }
    function lookAt(eye, center, up){ const z0=eye[0]-center[0], z1=eye[1]-center[1], z2=eye[2]-center[2]; let len=Math.hypot(z0,z1,z2); const zx=z0/len, zy=z1/len, zz=z2/len; const xx= up[1]*zz - up[2]*zy; const xy = up[2]*zx - up[0]*zz; const xz = up[0]*zy - up[1]*zx; len=Math.hypot(xx,xy,xz); const x0=xx/len, x1=xy/len, x2=xz/len; const y0 = zy*x2 - zz*x1, y1 = zz*x0 - zx*x2, y2 = zx*x1 - zy*x0; const m = new Float32Array(16); m[0]=x0; m[4]=x1; m[8]=x2; m[12]=0; m[1]=y0; m[5]=y1; m[9]=y2; m[13]=0; m[2]=zx; m[6]=zy; m[10]=zz; m[14]=0; m[3]=0; m[7]=0; m[11]=0; m[15]=1; const trans = identity(); trans[12] = -eye[0]; trans[13] = -eye[1]; trans[14] = -eye[2]; return multiply(m, trans)
    }

    let then = 0; let rotationY = 0; let rotationX = -0.15; let camDist = 3.6
    let isPointerDown = false; let lastX = 0; let lastY = 0; let autoRotate = true; const autoSpeed = 0.6

    
    function onPointerDown(e){ isPointerDown = true; autoRotate = false; const p = e.touches? e.touches[0] : e; lastX = p.clientX; lastY = p.clientY; }
    function onPointerMove(e){ if(!isPointerDown) return; const p = e.touches? e.touches[0] : e; const dx = p.clientX - lastX; const dy = p.clientY - lastY; lastX = p.clientX; lastY = p.clientY; rotationY += dx * 0.01; rotationX += dy * 0.01; rotationX = Math.max(-1.3, Math.min(1.3, rotationX)); }
    function onPointerUp(){ isPointerDown = false; setTimeout(()=>{ autoRotate = true }, 1800) }
    canvas.addEventListener('mousedown', onPointerDown); window.addEventListener('mousemove', onPointerMove); window.addEventListener('mouseup', onPointerUp)
    canvas.addEventListener('touchstart', onPointerDown, {passive:true}); canvas.addEventListener('touchmove', onPointerMove, {passive:true}); canvas.addEventListener('touchend', onPointerUp)
    canvas.addEventListener('wheel', (ev)=>{ ev.preventDefault(); camDist += ev.deltaY * 0.0025; camDist = Math.max(1.2, Math.min(8, camDist)); }, {passive:false})

    function rotateX(m, a){ const r = identity(); const c=Math.cos(a), s=Math.sin(a); r[5]=c; r[6]=-s; r[9]=s; r[10]=c; return multiply(m,r) }

    function render(now){ now *= 0.001; const dt = now - then; then = now; if(autoRotate && !isPointerDown) rotationY += dt*autoSpeed
      resize()
      gl.enable(gl.DEPTH_TEST); gl.clearColor(0.03,0.03,0.02,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
      const aspect = canvas.width / canvas.height; const proj = new Float32Array(16); perspective(proj, Math.PI/3, aspect, 0.1, 100)
      const cam = lookAt([0,1.2,camDist],[0,0,0],[0,1,0])
      
      const model = rotateX(rotateY(identity(), rotationY), rotationX)
      const mvp = multiply(proj, multiply(cam, model))
      gl.useProgram(prog)
      gl.uniformMatrix4fv(uniMvp,false,mvp); gl.uniformMatrix4fv(uniModel,false,model)
      gl.uniform3fv(uniLight, new Float32Array([1.0,1.0,0.8]))
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture); gl.uniform1i(uniTex, 0)
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.vertexAttribPointer(attPosition,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(attPosition)
      gl.bindBuffer(gl.ARRAY_BUFFER, nBuf); gl.vertexAttribPointer(attNormal,3,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(attNormal)
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf); gl.vertexAttribPointer(attUv,2,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(attUv)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib)
      gl.drawElements(gl.TRIANGLES, tor.indices.length, gl.UNSIGNED_SHORT, 0)
      requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
  }

  
  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    startRenderer(); setTimeout(playFinalSound, 160)
  } else { window.addEventListener('DOMContentLoaded', ()=>{ startRenderer(); setTimeout(playFinalSound,160) }) }
})();
