// Controla la secuencia de animación y el sonido final
document.addEventListener('DOMContentLoaded', ()=>{
  const progress = document.getElementById('progress')
  const final = document.getElementById('final')
  const finalImage = document.getElementById('finalImage')
  const captionText = document.getElementById('captionText')
  const stars = document.getElementById('stars')
  const termPre = document.getElementById('termPre')
  const stream = document.getElementById('stream')
  const hud = document.getElementById('hud')

  // Generar starfield
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

  // Matrix rain canvas
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

  // Background 'hacker' music: support user-provided MP3 via ?music=URL, otherwise fallback to synth
  let musicCtx = null
  let musicNodes = []
  let musicPlaying = false
  let audioEl = null
  // No URL parameters allowed. Use a default local file placed in `static/generar.mp3`.
  // If you want custom music, drop the MP3 into the `static/` folder and name it `generar.mp3`.
  const musicUrl = '/static/drama.mp3'

  function playHackerMusic(){
    if(musicPlaying) return
    if(musicUrl){
      // play provided MP3 via HTMLAudioElement (simpler and more compatible)
      audioEl = new Audio(musicUrl)
      audioEl.crossOrigin = 'anonymous'
      audioEl.loop = true
      audioEl.volume = 0.65
      const p = audioEl.play()
      if(p && p.catch){ p.catch(()=>{ /* may be blocked until user gesture */ }) }
      musicPlaying = true
      return
    }

    // fallback synth if no MP3 provided
    try{
      musicCtx = new (window.AudioContext || window.webkitAudioContext)()
      const now = musicCtx.currentTime
      // bass drone
      const bass = musicCtx.createOscillator(); const bassG = musicCtx.createGain();
      bass.type = 'sawtooth'; bass.frequency.setValueAtTime(55, now)
      bassG.gain.setValueAtTime(0.0, now); bassG.gain.linearRampToValueAtTime(0.12, now + 0.3)
      bass.connect(bassG); bassG.connect(musicCtx.destination); bass.start();
      musicNodes.push({osc:bass, gain:bassG})

      // rhythmic arpeggio using periodic notes
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

      // subtle high shimmer
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

  // Start music now if allowed, otherwise wait for first user interaction to resume audio
  try{ playHackerMusic() }catch(e){}
  function userResume(){ if(musicCtx && musicCtx.state==='suspended') musicCtx.resume().then(()=>{}); if(audioEl && audioEl.paused) audioEl.play().catch(()=>{}); playHackerMusic(); window.removeEventListener('pointerdown', userResume); window.removeEventListener('touchstart', userResume) }
  window.addEventListener('pointerdown', userResume)
  window.addEventListener('touchstart', userResume)

  // Terminal logs
  const msgs = [
    'handshake -> sat-node-7', 'recv: ACK', 'decrypting payload...', 'allocating mesh...',
    'assembling ring segments', 'calibrating field coils', 'stabilizing plasma', 'render pipeline ok'
  ]
  let msgIx = 0
  function pushLog(t){ termPre.textContent += '\n' + t; termPre.scrollTop = termPre.scrollHeight }

  // Rapid fake activity
  progress.innerText = 'Inicializando subsistemas...'
  pushLog('$ iniciando secuencia')
  const t1 = setInterval(()=>{
    pushLog('> ' + msgs[msgIx % msgs.length] + ' · ' + (Math.random()*100|0))
    stream.textContent = '[LOG] ' + msgs[msgIx % msgs.length]
    msgIx++
  }, 400)

  // Orquestación de eventos estilo hacker
  setTimeout(()=>{ progress.innerText = 'Formando anillo...'; hud.textContent='SISTEMA: FORMADO · NODOS: 64' ; document.getElementById('arc1').style.boxShadow='0 0 48px rgba(60,255,60,0.18)'; },900)
  setTimeout(()=>{ progress.innerText = 'Alineando módulos...'; hud.textContent='SISTEMA: SINCRONIZANDO · NODOS: 92'; document.getElementById('arc2').style.boxShadow='0 0 42px rgba(60,255,60,0.12)'; },2800)
  setTimeout(()=>{ progress.innerText = 'Encendiendo propulsores...'; hud.textContent='SISTEMA: A PROPULSION'; document.getElementById('arc3').style.boxShadow='0 0 36px rgba(60,255,60,0.14)'; },5200)

  // Small UI flicker effects
  let flick = 0
  const flickerI = setInterval(()=>{
    const t = 0.9 + Math.random()*0.2
    hud.style.opacity = t
    stream.style.opacity = 0.4 + Math.random()*0.7
    flick++
    if(flick>24) clearInterval(flickerI)
  }, 180)

  // End: reveal anticlimactic image + caption and sound
  const total = 8200
  setTimeout(()=>{
    clearInterval(t1)
    progress.innerText = 'Objeto generado.'
    pushLog('> generación completada')
    // stop activity and navigate to the minimal /anillo page (sound will play there)
    clearInterval(matInterval)
    // stop music before leaving
    stopHackerMusic()
    setTimeout(()=>{ window.location.href = '/anillo' }, 260)
  }, total)

  // (No sound here — sound plays on /anillo)
});
