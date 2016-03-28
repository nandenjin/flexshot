
function analyze( e ){
  var samples = e.data;
  var flags = [];
  var refer = [];
  var result = [];
  
  var range = 1;
  
  for( var i = 0; i < samples.length; i++ ){
    flags[i] = [];
    refer[i] = [];
    result[i] = [];
    for( var j = 0; j < samples[0].data.length / 4; j++ ){
      flags[i][j] = 0;
      refer[i][j] = -1;
    }
  }
  
  var hitCount = 0;
  for( var k = 0; k < samples[0].data.length / 4; k++ ){
    for( var l = 0; l < samples.length; l++ ){
      for( var m = l + 1; m < samples.length; m++ ){
        var s0 = [
          samples[l].data[k*4],
          samples[l].data[k*4+1],
          samples[l].data[k*4+2],
          samples[l].data[k*4+3]
        ];
        var s1 = [
          samples[m].data[k*4],
          samples[m].data[k*4+1],
          samples[m].data[k*4+2],
          samples[m].data[k*4+3]
        ];
        if(
          Math.abs( s0[0] - s1[0] ) <= range
          && Math.abs( s0[1] - s1[1] ) <= range
          && Math.abs( s0[2] - s1[2] ) <= range
          && Math.abs( s0[3] - s1[3] ) <= range
        ){
          hitCount++;
          var r = l;
          while( refer[r][k] != -1 ){
            r = refer[r][k];
          }
          
          refer[l][k] = r;
          flags[r][k]++;
          
          break;
        }
      }
      
      self.postMessage({
        status: 1,
        prog: ( k * samples.length + l )/( samples[0].data.length / 4 * samples.length )
      });
      
    }
    
    var a = 0;
    for( var n = 0; n < samples.length; n++ ){
      if( flags[a][k] < flags[n][k] ){
        a = n;
      }
    }
    result[a].push( k );
    
  }
  
  self.postMessage( {
    status: 2,
    result: result
  } );
}

self.addEventListener( 'message', analyze );
