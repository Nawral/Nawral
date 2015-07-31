var values = {};
$(function(){
  navigator.getUserMedia = navigator.webkitGetUserMedia;
  var lCanvas = document.getElementById('left'),
      rCanvas = document.getElementById('right'),
      audioContext = new webkitAudioContext(),
      rafID,
      lAnalyser,
      rAnalyser,
      rArray,
      lArray,
      lctx = lCanvas.getContext('2d'),
      rctx = rCanvas.getContext('2d'),
      constraints =   {audio: { mandatory: { echoCancellation: false } } };
  window.addEventListener('storage', updateValues);
  updateValues();

  navigator.getUserMedia(constraints, analyse, function(e){
    throw(e);
  });

  function updateValues(e){
    if(rafID){
        window.cancelAnimationFrame(rafID);
        clearInterval(rafID);
    }
    values = JSON.parse(localStorage.getItem('settings'));
    if(lAnalyser){
      lAnalyser.fftSize = rAnalyser.fftSize = values.bars * 2;
      rAnalyser.smoothingTimeConstant = lAnalyser.smoothingTimeConstant = values.stc / 1000;
    }
    overwolf.windows.getCurrentWindow(function(d){
      overwolf.windows.maximize(d.window.id, function(){
        lCanvas.height = 0;
        rCanvas.height = 0;
        if(values.alternate){
          lCanvas.style.marginRight = rCanvas.style.marginLeft= 0;
          rCanvas.width = 0;
          lCanvas.width  = 255 * 2 * values.scale;
        } else {
          lCanvas.width  = Math.ceil(rCanvas.width  = 255 * values.scale);
          lCanvas.style.marginRight = rCanvas.style.marginLeft= ((d.window.width-rCanvas.width*2)/100)*values.width/2 + 'px';
        }
        lCanvas.height = rCanvas.height = Math.ceil(d.window.height * (values.height/100) + values.gap + 1);
        lCanvas.style.marginTop   = rCanvas.style.marginTop = values.offset + 'px';
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
    lAnalyser.fftSize = values.bars * 2;
    rAnalyser.fftSize = values.bars * 2;
    rAnalyser.minDecibels = lAnalyser.minDecibels = -90;
    rAnalyser.maxDecibels = lAnalyser.maxDecibels = -10;
    rAnalyser.smoothingTimeConstant = lAnalyser.smoothingTimeConstant = values.stc / 1000;

    lAnalyser.channelCount = rAnalyser.channelCount = 2;

    lArray = new Uint8Array(lAnalyser.frequencyBinCount);
    rArray = new Uint8Array(rAnalyser.frequencyBinCount);

    input.connect(splitter);
    splitter.connect(lAnalyser, 0, 0);
    splitter.connect(rAnalyser, 1, 0);
  }

  function updateAnalyser(){
    lAnalyser.getByteFrequencyData(lArray);
    rAnalyser.getByteFrequencyData(rArray);
    lctx.clearRect(0, 0, lCanvas.width, lCanvas.height);
    rctx.clearRect(0, 0, rCanvas.width, rCanvas.height);
    var barHeight = Math.round(lCanvas.height / lAnalyser.frequencyBinCount) - values.gap,
        y = 0,
        i,
        x,
        lBarWidth,
        rBarWidth,
        color = 'rgba('+values.color.r+','+values.color.b+','+values.color.g+',';
    if(values.alternate){
      for(i = lAnalyser.frequencyBinCount; i--;) {
        x = values.bass?-i+lAnalyser.frequencyBinCount:i;

        lBarWidth = lArray[x] - rArray[x];

        lctx.fillStyle = color + (Math.pow(Math.abs(lBarWidth)/255 + 1, values.opacity) - 1) + ')';
        lctx.fillRect(lCanvas.width/2, y, -lBarWidth*values.scale, barHeight);

        y += barHeight + values.gap;
      }
    } else {
      for(i = lAnalyser.frequencyBinCount; i--;) {
        x = values.bass?-i+lAnalyser.frequencyBinCount:i;

        lBarWidth = values.subtractive?lArray[x] - rArray[x]:lArray[x];
        rBarWidth = values.subtractive?rArray[x] - lArray[x]:rArray[x];

        if(lBarWidth > 0){
          lctx.fillStyle = color + (Math.pow(lBarWidth/255 + 1, values.opacity) - 1) + ')';
          lctx.fillRect(0+            (values.outward?lCanvas.width:0), y,  lBarWidth*values.scale*(values.outward?-1:1) + .5, barHeight);
        }
        if(rBarWidth > 0){
          rctx.fillStyle = color + (Math.pow(lBarWidth/255 + 1, values.opacity) - 1) + ')';
          rctx.fillRect(rCanvas.width-(values.outward?rCanvas.width:0), y, -rBarWidth*values.scale*(values.outward?-1:1) + .5, barHeight);
        }

        y += barHeight + values.gap;
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
