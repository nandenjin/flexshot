
var dom = {
  mediaContainer: elm( "media-container" ),
  mediaPlayer: {}
};

var media = {
  dom: {},
  duration: 0,
  
  width: 0,
  height: 0,
  
  splitLength: 50,
  splitPositions: [],
  
  blockLength: {
    width: 40,
    height: 40
  },
  
  sampleWaitTime: 1000,
  sampleShots: {},
  
  resultMap: []
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
  
  setProgress( 'Preparing...', 0 );
  
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
      analyzeSample( m, function(){
        setProgress( "Rendering result...", 0 );
        setTimeout(function(){
          renderResult( m );
        }, 10 );
      } );
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
  
  dom.currentTime = 0;
  dom.play();
  
  s.original = [];
  s.minify = [];
  
  (function(){
    var f = arguments.callee;
    dom.currentTime = p[i];
    dom.play();
    setTimeout( function(){
      dom.pause();
    }, w/2 );
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
    
    setProgress( 'Capturing frame shot...', i / l );
    
  })();
  
}

//Analyze
function analyzeSample( m, listener ){
  var worker = new Worker( "analyzer.js" );
  worker.addEventListener( "message", handleResult );
  
  worker.postMessage( m.sampleShots.minify );
  
  function handleResult( e ){
    if( e.data.status == 2 ){
      
      m.resultMap = e.data.result;
      listener();
      
    }else if( e.data.status == 1 ){
      
      setProgress( "Analyzing frames...", e.data.prog );
      
    }
  }
}

//Build and render result
function renderResult( m ){
  var map = m.resultMap;
  var s = m.sampleShots;
  
  var bw = m.width / m.blockLength.width;
  var bh = m.height / m.blockLength.height;
  
  var cnv = document.createElement( "canvas" );
  cnv.width = m.width;
  cnv.height = m.height;
  var ctx = cnv.getContext( "2d" );
  
  var resultDom = document.createElement( "img" );
  resultDom.style.width = "100%";
  document.body.appendChild( resultDom );

  //Clip temp canvas
  var tcnv = document.createElement( "canvas" );
  tcnv.width = m.width;
  tcnv.height = m.height;
  var tctx = tcnv.getContext( "2d" );
  
  var an = [];
  var rendered = 0;
  var frameLength = m.blockLength.width * m.blockLength.height;
  var i = 0;
  
  (function(){
    var f = arguments.callee;
    
    tctx.putImageData( s.original[i], 0, 0 );
    
    //Test code; list samples
    //listSample( tcnv );
    
    an.push(map[i].length);
    
    //for( var j = 0; j < map[i].length; j++ ){
    var j = 0;
    (function(){
      var x = map[i][j] % m.blockLength.width;
      var y = Math.floor( map[i][j] / m.blockLength.width );
      
      ctx.drawImage( tcnv, x*bw, y*bh, bw, bh, x*bw, y*bh, bw, bh );
    //}
      j++;
      rendered++;
      if( j < map[i].length ){
        setTimeout( arguments.callee, 10 );
        setProgress( "Rendering result...", rendered / frameLength );
        
      }else{
        i++;
        if( i < map.length ){
          setTimeout( f, 10 );
          
        }else{
          resultDom.src = cnv.toDataURL( "image/png" );
          alert(an);
        }
      }
    })();
  })(); 
}

function listSample( cnv ){
  var im = document.createElement( 'img' );
  im.src = cnv.toDataURL();
  im.width = 200;
  document.body.appendChild( im );
}

//Test code

function initTest(){
  loadMedia( "sample.webm" );
}

window.addEventListener( "load", initTest );
