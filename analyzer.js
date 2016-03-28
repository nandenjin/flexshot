
function analyze( e ){
  var data = JSON.parse( e.data );
  //data.sampleShots = data.sampleShots[0].length;
  
  self.postMessage( 'gt' );
}

self.addEventListener( 'message', analyze );
