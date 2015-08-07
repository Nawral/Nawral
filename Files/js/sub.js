var values = {};
$(function(){
  navigator.getUserMedia = navigator.webkitGetUserMedia;
  var lCanvas = document.getElementById('left'),
      rCanvas = document.getElementById('right'),
      gap     = document.getElementById('gap'),
      body    = document.getElementsByTagName('body')[0],
      audioContext = new webkitAudioContext(),
      rafID,
      lAnalyser,
      rAnalyser,
      lArray,
      rArray,
      width,
      lctx = lCanvas.getContext('2d'),
      rctx = rCanvas.getContext('2d'),
      constraints =   {audio: { mandatory: { echoCancellation: false } } };
  window.addEventListener('storage', updateValues);

  updateValues();
  startAudio();

  function startAudio(){
    navigator.getUserMedia(constraints, analyse, function(e){});
    setTimeout(function(){
      if(!window.stream){
        startAudio();
      }
    }, 1000);
  }

  function updateValues(e){
    if(rafID){
        window.cancelAnimationFrame(rafID);
        clearInterval(rafID);
    }

    values = JSON.parse(localStorage.getItem('settings'));

    if(lAnalyser){
      lAnalyser.fftSize = rAnalyser.fftSize = values.bars * 2;
      rAnalyser.minDecibels = lAnalyser.minDecibels = values.minDecibels;
      rAnalyser.maxDecibels = lAnalyser.maxDecibels = values.maxDecibels;
      rAnalyser.smoothingTimeConstant = lAnalyser.smoothingTimeConstant = values.stc / 1000;

      lArray = new Uint8Array(lAnalyser.frequencyBinCount);
      rArray = new Uint8Array(rAnalyser.frequencyBinCount);
    }

    overwolf.windows.getCurrentWindow(function(d){
      overwolf.windows.maximize(d.window.id, function(){
        width = Math.ceil(d.window.width * (values.barWidth/100));
        lCanvas.height = rCanvas.height = lCanvas.width = rCanvas.width = 0;
        if(values.alternate){
          lCanvas.style.marginRight = rCanvas.style.marginLeft= 0;
          rCanvas.width = 0;
          gap.style.width = 0;
          lCanvas.width  = width * 2;
        } else {
          lCanvas.width  = rCanvas.width = width;
          gap.style.width = values.seperation + '%';
        }
        lCanvas.height = rCanvas.height = Math.ceil(d.window.height * (values.height/100));
        body.style.marginTop = values.offset + '%';
      });
    });
    rafID = frameLimit(updateAnalyser, values.fps);
  }

  function analyse(stream){
    window.stream = stream;

    var input = audioContext.createMediaStreamSource(stream),
        splitter = audioContext.createChannelSplitter(2);

    lAnalyser = audioContext.createAnalyser();
    rAnalyser = audioContext.createAnalyser();
    input.channelInterpretation = 'explicit';
    updateValues();

    lAnalyser.channelCount = rAnalyser.channelCount = 2;

    input.connect(splitter);
    splitter.connect(lAnalyser, 0, 0);
    splitter.connect(rAnalyser, 1, 0);
  }

  function updateAnalyser(){
    lAnalyser.getByteFrequencyData(lArray);
    rAnalyser.getByteFrequencyData(rArray);
    lctx.clearRect(0, 0, lCanvas.width, lCanvas.height);
    rctx.clearRect(0, 0, rCanvas.width, rCanvas.height);
    var barHeight = Math.floor(lCanvas.height / lAnalyser.frequencyBinCount),
        y = 0,
        i,
        x,
        lBarWidth,
        rBarWidth,
        color = 'rgba('+values.color.r+','+values.color.g+','+values.color.b+',';
        barHeight = barHeight<=.5?.5:barHeight;
    if(values.alternate){
      for(i = lAnalyser.frequencyBinCount; i--;) {
        x = values.bassFirst?-i+lAnalyser.frequencyBinCount:i;

        barWidth = (lArray[x] - rArray[x])/255;

        x==10?console.log(-barWidth*width):'';
        lctx.fillStyle = color + (values.dynamicOpacity?(Math.pow(Math.abs(barWidth) + 1, values.opacity) - 1):values.opacity) + ')';
        lctx.fillRect(lCanvas.width/2, Math.ceil(y), -barWidth*width, barHeight<=0?1:barHeight<=1?1:Math.ceil(barHeight));

        y += barHeight;
      }
    } else {
      for(i = lAnalyser.frequencyBinCount; i--;) {
        x = values.bassFirst?-i+lAnalyser.frequencyBinCount:i;

        lBarWidth = (values.subtractive?lArray[x] - rArray[x]:lArray[x])/255;
        rBarWidth = (values.subtractive?rArray[x] - lArray[x]:rArray[x])/255;

        if(lBarWidth > 0){
          lctx.fillStyle = color + (values.dynamicOpacity?(Math.pow(lBarWidth + 1, values.opacity) - 1):values.opacity) + ')';
          lctx.fillRect(0+            (values.outward?lCanvas.width:0), Math.ceil(y) + values.gap,  lBarWidth*width*(values.outward?-1:1), barHeight<=1?1:Math.ceil(barHeight) - values.gap);
        }
        if(rBarWidth > 0){
          rctx.fillStyle = color + (values.dynamicOpacity?(Math.pow(rBarWidth + 1, values.opacity) - 1):values.opacity) + ')';
          rctx.fillRect(rCanvas.width-(values.outward?rCanvas.width:0), Math.ceil(y) + values.gap, -rBarWidth*width*(values.outward?-1:1), barHeight<=1?1:Math.ceil(barHeight) - values.gap);
        }

        y += barHeight;
      }
    }
  }

  function frameLimit(fn, fps){
    if(fps == 0){
      function repeat(){
        requestAnimationFrame(fn)
        rafID = requestAnimationFrame(repeat);
      }
      return requestAnimationFrame(repeat);
    } else {
       fps = fps || 30;
       var then = Date.now(),
        interval = 1000/fps,
        last;
      return setInterval(function(){
        if(last){
          cancelAnimationFrame(last);
        }
        last = requestAnimationFrame(fn);
      }, interval);
    }
  }
});
