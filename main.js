
var dom = {
  mediaContainer: elm( "media-container" ),
  mediaPlayer: {}
};

var media = {
  dom: {},
  duration: 0,
  
  width: 0,
  height: 0,
  
  splitLength: 10,
  splitPositions: [],
  
  blockLength: {
    width: 960,
    height: 540
  },
  
  sampleWaitTime: 1000,
  sampleShots: [],
  
  result: null
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
  
  //Wait for media loading
  setTimeout( function(){
    m.duration = mp.duration;
    m.width = mp.videoWidth;
    m.height = mp.videoHeight;
    
    calcSplitPosition( m );
    takeSampleShot( m, function(){
      analyzeSample( m, function(){
        renderResult( m );
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
  
  //Seek media to zero
  dom.currentTime = 0;
  
  (function(){
    var f = arguments.callee;
    dom.currentTime = p[i];
    dom.play();
    setTimeout( function(){
      //dom.pause();
    }, w/2 );
    setTimeout( function(){
      
      //to avoid issue( the first frame does not be captured ), render additional one frame
      ctx.drawImage( dom, 0, 0, 1, 1 );
      
      //Render frame on canvas and capture it
      ctx.drawImage( dom, 0, 0, m.width, m.height );
      s.push( ctx.getImageData( 0, 0, m.width, m.height ) );
      
      i++;
      
      //Repeat phase (use timer not to block browser content rendering)
      if( i < l ){
        setTimeout( f, 10 );
      
      //Move to netxt phase
      }else{
        dom.pause();
        listener( m );
      }
      
    }, w );
    
    //Show progress
    setProgress( 'Capturing frame shot...', i / l );
    
  })();
  
}

//Analyze
function analyzeSample( m, listener ){
  var s = m.sampleShots;
  var samples = [];
  
  //Craate sample data
  for( var i = 0; i < s.length; i++ ){
    samples.push( s[i].data );
  }
  
  //Create worker and send data
  var worker = new Worker( "analyzer.js" );
  worker.addEventListener( "message", handleResult );
  
  worker.postMessage({
    width: m.width,
    height: m.height,
    blockLength: m.blockLength,
    sample: samples
  });
  
  function handleResult( e ){
    //Get the result
    if( e.data.status == 2 ){
      m.result = e.data.result;

      listener();
    
    //Show progress
    }else if( e.data.status == 1 ){
      setProgress( e.data.msg, e.data.prog );
      
    }
  }
}

//Render result on browser
function renderResult( m ){
  var c = document.createElement( "canvas" );
  c.width = m.width;
  c.height = m.height;
  var x = c.getContext('2d');
  var i = x.createImageData(m.width,m.height);
  i.data.set(m.result);
  x.putImageData(i,0,0);
  var im = document.createElement('img');
  im.src = c.toDataURL();
  im.style.border="1px solid red";
  document.body.appendChild(im);
}


//Test code

function initTest(){
  loadMedia( "sample.webm" );
}

window.addEventListener( "load", initTest );