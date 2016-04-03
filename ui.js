
var ui = {};

//DOM node list
ui.dom = {
  view: {
    progress: elm( "view-progress" ),
    config: elm( "view-config" ),
    result: elm( "view-result" )
  },
  
  fileSelector: elm( "file-selector" ),
  useSample: elm( "file-selector-usesample" ),
  captureVideo: elm( "capture-video" ),
  setCapturePoint: elm( "set-capture-point" ),
  clearCapturePoint: elm( "clear-capture-point" ),
  capturePointNumber: elm( "capture-point-number" ),
  capturePointList: elm( "capture-point-list" ),
  configBW: elm( "config-bw" ),
  configBH: elm( "config-bh" ),
  configStriction: elm( "config-striction" ),
  configRMDefault: elm( "config-rm-default" ),
  configRMBlend: elm( "config-rm-blend" ),
  fitToSource: elm( "fit-to-source" ),
  startButton: elm( "start-button" ),
  progBox: elm( "progress-box" ),
  progMsg: elm( "progress-msg" ),
  progColor: elm( "progress-color" ),
  resultContainer: elm( "result-container" )
};

//Capture canvas
ui.captureCanvasDom = document.createElement( "canvas" );
ui.captureCanvasContext = ui.captureCanvasDom.getContext( "2d" );

//Media data
ui.media = {
  width: 0,
  height: 0
};

//Capture point list
var tmpCapturePoints = [];

//Initialize
function init(){
  tmpCapturePoints = [];
  ui.dom.capturePointList.innerHTML = "";
  
}

function handleStartButton( e ){
  e.preventDefault();
  
  var m = {};
  m.width = ui.media.width;
  m.height = ui.media.height;
  
  if( tmpCapturePoints.length < 1 ){
    alert( "Error : No capture points were found" );
    return false;
  }
  
  var bw = parseInt( ui.dom.configBW.value );
  var bh = parseInt( ui.dom.configBH.value );
  if( !bw || !bh ){
    alert( "Error : Incorrect resolution configurations" );
    return false;
  }
  
  m.blockLength = {};
  m.blockLength.width = bw;
  m.blockLength.height = bh;
  
  var st = parseInt( ui.dom.configStriction.value );
  if( !st ){
    alert( "Error : Incorrect striction configuration" );
    return false;
  }
  
  st = Math.max( 1, Math.min( 255, st ) );
  m.striction = st;
  
  var renderMode = 0;
  if( elm( "config-rm-blend" ).checked ){
    renderMode = 1;
  }
  
  m.renderMode = renderMode;
  
  m.sampleShots = tmpCapturePoints;
  
  ui.dom.view.config.style.display = "none";
  ui.dom.view.result.style.display = "none";
  ui.dom.view.progress.style.display = "block";
  
  start( m );
  
}

function setProgress( msg, perc ){
  ui.dom.progMsg.innerHTML = msg;
  ui.dom.progColor.style.width = perc * 100 + "%";
}

function readFile( e ){
  var f = e.target.files[0];
  var r = new FileReader();
  
  if( !f.type.match( "video.*" ) ){
    return false;
  }
  
  setResourceToPlayer( URL.createObjectURL( f ) );
  
}

function setSampleFile( e ){
  e.preventDefault();
  setResourceToPlayer( "sample.webm" );
  
}

function setResourceToPlayer( url ){
  ui.dom.captureVideo.src = url;
  
}

//Add capture point
function setCapturePoint( e ){
  e.preventDefault();
  var video = ui.dom.captureVideo;
  
  if( !video.duration ){
    return false;
  }
  
  //Log size of video
  var w = video.videoWidth;
  var h = video.videoHeight;
  ui.media.width = w;
  ui.media.height = h;
  
  //Render on canvas and get imagedata
  var cnv = ui.captureCanvasDom;
  var ctx = ui.captureCanvasContext;
  
  cnv.width = w;
  cnv.height = h;
  
  ctx.drawImage( video, 0, 0, w, h );
  
  var im = ctx.getImageData( 0, 0, w, h );
  tmpCapturePoints.push( im.data );
  
  //Refresh point list
  var li = document.createElement( "div" );
  li.className = "capture-point-marker";
  
  var t = video.currentTime;
  var d = video.duration;

  li.style.left = ( t / d ) * 100 + "%";
  
  ui.dom.capturePointList.appendChild( li );
  
}

//Clear all capture points
function clearCapturePoint( e ){
  e.preventDefault();
  
  tmpCapturePoints = [];
  ui.dom.capturePointList.innerHTML = "";
  
}

function fitAnalyzeResolution( e ){
  e.preventDefault();
  var video = ui.dom.captureVideo;
  
  if( !video.duration ){
    return false;
  }
  
  //Log size of video
  var w = video.videoWidth;
  var h = video.videoHeight;
  ui.media.width = w;
  ui.media.height = h;
  
  ui.dom.configBW.value = w;
  ui.dom.configBH.value = h;
  
}

function handleAnalyzerResult( data ){
  ui.dom.resultContainer.innerHTML = "";
  
  var img = document.createElement( "img" );
  img.className = "result-preview";
  img.src = data;
  
  ui.dom.resultContainer.appendChild( img );
  
  ui.dom.view.progress.style.display = "none";
  ui.dom.view.config.style.display = "block";
  ui.dom.view.result.style.display = "block";
}

ui.dom.fileSelector.addEventListener( "change", readFile );
ui.dom.useSample.addEventListener( "click", setSampleFile );
ui.dom.setCapturePoint.addEventListener( "click", setCapturePoint );
ui.dom.clearCapturePoint.addEventListener( "click", clearCapturePoint );
//ui.dom.fitToSource.addEventListener( "click", fitAnalyzeResolution );
ui.dom.startButton.addEventListener( "click", handleStartButton );

window.addEventListener( "DOMContentLoaded", function(){
  ui.dom.view.config.style.display = "block";
} );