
document.addEventListener('DOMContentLoaded', ()=>{
  const progress = document.getElementById('progress')
  const final = document.getElementById('final')
  const finalImage = document.getElementById('finalImage')
  const captionText = document.getElementById('captionText')
  const stars = document.getElementById('stars')
  const termPre = document.getElementById('termPre')
  const stream = document.getElementById('stream')
  const hud = document.getElementById('hud')

  for(let i=0;i<80;i++){
    const s=document.createElement('div')
    s.className='star'
    const size = Math.random()*2+0.4
    s.style.width = s.style.height = size+'px'
    s.style.left = Math.random()*100+'%'
    s.style.top = Math.random()*100+'%'
    s.style.opacity = 0.2+Math.random()*0.8
    stars.appendChild(s)
  }


  const canvas = document.getElementById('matrix')
  const ctx = canvas.getContext('2d')
  function resize(){ canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight }
  window.addEventListener('resize', resize); resize()
  const cols = Math.floor(canvas.width/12)
  const drops = Array(cols).fill(1)
  function drawMatrix(){
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = 'rgba(60,255,60,0.9)'
    ctx.font = '12px monospace'
    for(let i=0;i<drops.length;i++){
      const text = String.fromCharCode(0x30A0 + Math.random()*96)
      ctx.fillText(text, i*12, drops[i]*12)
      if(drops[i]*12 > canvas.height && Math.random() > 0.975) drops[i]=0
      drops[i]++
    }
  }
  let matInterval = setInterval(drawMatrix, 60)


  let musicCtx = null
  let musicNodes = []
  let musicPlaying = false
  let audioEl = null
  const musicUrl = '/static/drama.mp3'

  function playHackerMusic(){
    if(musicPlaying) return
    if(musicUrl){
      
      audioEl = new Audio(musicUrl)
      audioEl.crossOrigin = 'anonymous'
      audioEl.loop = true
      audioEl.volume = 0.65
      const p = audioEl.play()
      if(p && p.catch){ p.catch(()=>{ /* ya sabes, no carga hasta que el user interactue, esa politica antitroleos XD */ }) }
      musicPlaying = true
      return
    }

    
    try{
      musicCtx = new (window.AudioContext || window.webkitAudioContext)()
      const now = musicCtx.currentTime
      
      const bass = musicCtx.createOscillator(); const bassG = musicCtx.createGain();
      bass.type = 'sawtooth'; bass.frequency.setValueAtTime(55, now)
      bassG.gain.setValueAtTime(0.0, now); bassG.gain.linearRampToValueAtTime(0.12, now + 0.3)
      bass.connect(bassG); bassG.connect(musicCtx.destination); bass.start();
      musicNodes.push({osc:bass, gain:bassG})

      
      const arpGain = musicCtx.createGain(); arpGain.gain.value = 0.0; arpGain.connect(musicCtx.destination)
      musicNodes.push({gain:arpGain})
      const scale = [220, 277.18, 329.63, 415.30]
      let arpIx = 0
      const arpInt = setInterval(()=>{
        const o = musicCtx.createOscillator(); const g = musicCtx.createGain();
        o.type = 'square'; o.frequency.setValueAtTime(scale[arpIx % scale.length], musicCtx.currentTime)
        g.gain.setValueAtTime(0.0001, musicCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.06, musicCtx.currentTime + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, musicCtx.currentTime + 0.22)
        o.connect(g); g.connect(arpGain); o.start(); o.stop(musicCtx.currentTime + 0.26)
        arpIx++
      }, 220)
      musicNodes.push({interval:arpInt})

      
      const shimmer = musicCtx.createOscillator(); const shimmerG = musicCtx.createGain(); shimmer.type='sine'; shimmer.frequency.setValueAtTime(1200, now)
      shimmerG.gain.setValueAtTime(0.02, now); shimmer.connect(shimmerG); shimmerG.connect(musicCtx.destination); shimmer.start(); musicNodes.push({osc:shimmer, gain:shimmerG})

      musicPlaying = true
    }catch(e){ console.warn('No WebAudio', e) }
  }

  function stopHackerMusic(){
    try{
      if(audioEl){ try{ audioEl.pause(); audioEl.src = '' }catch(e){} audioEl = null }
      musicNodes.forEach(n=>{
        if(n.osc) try{ n.osc.stop() }catch(e){}
        if(n.gain) try{ n.gain.disconnect() }catch(e){}
        if(n.interval) clearInterval(n.interval)
      })
      if(musicCtx && musicCtx.close) musicCtx.close()
    }catch(e){/*ignore*/}
    musicCtx = null; musicNodes=[]; musicPlaying=false
  }

  
  try{ playHackerMusic() }catch(e){}
  function userResume(){ if(musicCtx && musicCtx.state==='suspended') musicCtx.resume().then(()=>{}); if(audioEl && audioEl.paused) audioEl.play().catch(()=>{}); playHackerMusic(); window.removeEventListener('pointerdown', userResume); window.removeEventListener('touchstart', userResume) }
  window.addEventListener('pointerdown', userResume)
  window.addEventListener('touchstart', userResume)

  
  const msgs = [
    'handshake -> sat-node-7', 'recv: ACK', 'decrypting payload...', 'allocating mesh...',
    'assembling ring segments', 'calibrating field coils', 'stabilizing plasma', 'render pipeline ok'
  ]
  let msgIx = 0
  function pushLog(t){ termPre.textContent += '\n' + t; termPre.scrollTop = termPre.scrollHeight }

  
  progress.innerText = 'Inicializando subsistemas...'
  pushLog('$ iniciando secuencia')
  const t1 = setInterval(()=>{
    pushLog('> ' + msgs[msgIx % msgs.length] + ' · ' + (Math.random()*100|0))
    stream.textContent = '[LOG] ' + msgs[msgIx % msgs.length]
    msgIx++
  }, 400)

  
  setTimeout(()=>{ progress.innerText = 'Formando anillo...'; hud.textContent='SISTEMA: FORMADO · NODOS: 64' ; document.getElementById('arc1').style.boxShadow='0 0 48px rgba(60,255,60,0.18)'; },900)
  setTimeout(()=>{ progress.innerText = 'Alineando módulos...'; hud.textContent='SISTEMA: SINCRONIZANDO · NODOS: 92'; document.getElementById('arc2').style.boxShadow='0 0 42px rgba(60,255,60,0.12)'; },2800)
  setTimeout(()=>{ progress.innerText = 'Encendiendo propulsores...'; hud.textContent='SISTEMA: A PROPULSION'; document.getElementById('arc3').style.boxShadow='0 0 36px rgba(60,255,60,0.14)'; },5200)

  
  let flick = 0
  const flickerI = setInterval(()=>{
    const t = 0.9 + Math.random()*0.2
    hud.style.opacity = t
    stream.style.opacity = 0.4 + Math.random()*0.7
    flick++
    if(flick>24) clearInterval(flickerI)
  }, 180)

  
  const total = 8200
  setTimeout(()=>{
    clearInterval(t1)
    progress.innerText = 'Objeto generado.'
    pushLog('> generación completada')
    
    clearInterval(matInterval)
    
    stopHackerMusic()
    setTimeout(()=>{ window.location.href = '/anillo' }, 260)
  }, total)

  
});
