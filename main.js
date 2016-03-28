
var dom = {
  mediaContainer: elm( "media-container" ),
  mediaPlayer: {}
};

var media = {
  dom: {},
  duration: 0,
  
  width: 0,
  height: 0,
  
  splitLength: 5,
  splitPositions: [],
  
  blockLength: {
    width: 10,
    height: 5
  },
  
  sampleWaitTime: 100,
  sampleShots: {}
};

function loadMedia( src ){
  var mp = document.createElement( "video" );
  mp.src = src;
  mp.setAttribute( "preload", "auto" );
  mp.setAttribute( "controls", "controls" );
  dom.mediaContainer.appendChild( mp );
  
  dom.mediaPlayer = mp;
}

//Start process
function start( m ){
  var mp = dom.mediaPlayer;
  mp.volume = 0;
  mp.play();
  
  m.dom = mp;
  
  setTimeout( function(){
    m.duration = mp.duration;
    m.width = mp.videoWidth;
    m.height = mp.videoHeight;
    
    calcSplitPosition( m );
    takeSampleShot( m, function(){
      analyzeSample( m );
    } );
    
  }, 3000 );
  
}

//Calc split position from media config
function calcSplitPosition( m ){
  var l = m.splitLength;
  var p = m.splitPositions;
  var d = m.duration;
  
  for( var i = 0; i < l; i++ ){
    p.push( d / l * i );
  }
  
}

//Render frame and take sample shot
function takeSampleShot( m, listener ){
  var w = m.sampleWaitTime;
  var p = m.splitPositions;
  var s = m.sampleShots;
  var dom = m.dom;
  var l = m.splitLength;
  var b = m.blockLength;
  var i = 0;

  //Create canvas for take shot
  var cnv = document.createElement( "canvas" );
  cnv.width = m.width;
  cnv.height = m.height;
  var ctx = cnv.getContext( '2d' );
  
  dom.play();
  
  s.original = [];
  s.minify = [];
  
  (function(){
    var f = arguments.callee;
    dom.currentTime = p[i];
    setTimeout( function(){
      
      ctx.drawImage( dom, 0, 0, 1, 1 ); //to avoid issue( the first frame does not be captured )
      ctx.drawImage( dom, 0, 0, m.width, m.height );
      s.original.push( ctx.getImageData( 0, 0, m.width, m.height ) );
      
      ctx.drawImage( dom, 0, 0, m.width, m.height, 0, 0, b.width, b.height );
      s.minify.push( ctx.getImageData( 0, 0, b.width, b.height ) );
      
      //Capture check code
      //var im = document.createElement('img');im.src = cnv.toDataURL('image/jpg');document.body.appendChild(im);
      
      i++;
      
      if( i < l ){
        setTimeout( f, 10 );
      }else{
        dom.pause();
        listener( m );
      }
      
    }, w );
    
  })();
  
}

//Analyze
function analyzeSample( m ){try{
  var worker = new Worker( "analyzer.js" );
  worker.addEventListener( "message", handleResult );
  
  worker.postMessage( m.sampleShots.minify );
  
  function handleResult( e ){
    alert( e.data );
  }}catch(e){alert(e.message);}
}

//Test code

function initTest(){
  loadMedia( "sample.webm" );
}

window.addEventListener( "load", initTest );
