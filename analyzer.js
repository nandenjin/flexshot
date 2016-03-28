
function analyze( e ){
  var samples = e.data;
  var flags = [];
  var refer = [];
  var result = [];
  
  for( var i = 0; i < samples.length; i++ ){
    flags[i] = [];
    refer[i] = [];
    for( var j = 0; j < samples[0].data.length / 4; j++ ){
      flags[i][j] = 0;
      refer[i][j] = -1;
    }
  }
  
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
          Math.abs( s0[0] - s1[0] ) < 5
          && Math.abs( s0[1] - s1[1] ) < 5
          && Math.abs( s0[2] - s1[2] ) < 5
          && Math.abs( s0[3] - s1[3] ) < 5
        ){
          var r = l;
          while( refer[r][k] != -1 ){
            r = refer[r][k];
          }
          
          refer[l][k] = r;
          flags[r][k]++;
          
          break;
        }
      }
    }
    
    for( var n = 0; n < samples[0].data.length / 4; n++ ){
      var a = 0;
      for( var o = 0; o < samples.length; o++ ){
        if( flags[a][n] < flags[o][n] ){
          a = o;
        }
      }
      result[n] = a;
    }
    
  }
  
  self.postMessage( JSON.stringify(result) );
}

self.addEventListener( 'message', analyze );
