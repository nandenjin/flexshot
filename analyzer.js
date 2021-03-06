
function start( e ){
  var w = e.data.width;
  var h = e.data.height;
  var samples = e.data.sample;
  var bw = e.data.blockLength.width || 10;
  var bh = e.data.blockLength.height || 10;
  var striction = e.data.striction || 5;
  var rm = e.data.renderMode || 0;
  
  //Resize
  var resizedSamples = [];
  for( var i = 0; i < samples.length; i++ ){
    resizedSamples.push(
      resize( samples[i], w, h, bw, bh, function( pg ){
        sendProgress(
          "Compressing for analyzing...",
          (pg+i)/samples.length
        );
      } )
    );
  }
  
  //Analyze
  var analyzed = analyze( resizedSamples, striction );
  
  //Render
  var rendered = render({
    samples: samples,
    analyzerResult: analyzed.result,
    referMap: analyzed.referMap,
    renderMode: rm
  }, w, h, bw, bh );
  
  //Return result
  self.postMessage( {
    status: 2,
    result: rendered.result
  } );
  
}

function resize( s, w, h, bw, bh, onProgress ){
  onProgress = onProgress || function(){};
  if( bw < 1 || bh < 1 ){
    return [];
  }
  
  var result = new Uint8ClampedArray( bw * bh * 4 );
  for( var i = 0; i < bh; i++ ){
    var c0y = Math.floor( h/bh * i );
    var c1y = Math.floor( h/bh * (i+1) );
    
    for( var j = 0; j < bw; j++ ){
      var c0x = Math.floor( w/bw * j );
      var c1x = Math.floor( w/bw * (j+1) );
      
      var sum = [ 0, 0, 0, 0 ];
      var bl = 0;
      for( var k = c0y; k < c1y; k++ ){
        for( var l = c0x; l < c1x; l++ ){
          var index = ( k * w + l ) * 4;
          sum[0] += s[index+0];
          sum[1] += s[index+1];
          sum[2] += s[index+2];
          sum[3] += s[index+3];
          bl++;
          
        }
      }
      
      var bi = ( i * bw + j ) * 4;
      result[bi+0] = sum[0] / bl;
      result[bi+1] = sum[1] / bl;
      result[bi+2] = sum[2] / bl;
      result[bi+3] = sum[3] / bl;
      
    }
    
    onProgress( i/bh );
    
  }
  
  return result;
}

function analyze( s, striction ){
  var samples = s;
  var flags = [];
  var referTo = [];
  var result = [];
  
  var pixelLength = samples[0].length / 4;
  
  var range = striction;
  
  for( var i = 0; i < samples.length; i++ ){
    flags[i] = [];
    referTo[i] = [];
    for( var j = 0; j < pixelLength; j++ ){
      flags[i][j] = 0;
      referTo[i][j] = -1;
    }
  }
  var tc = [];
  for( var k = 0; k < pixelLength; k++ ){
    for( var l = 0; l < samples.length; l++ ){
      for( var m = l + 1; m < samples.length; m++ ){
        
        if( referTo[m][k] != -1 ){
          continue;
        }
        
        var s0 = [
          samples[l][k*4+0],
          samples[l][k*4+1],
          samples[l][k*4+2],
          samples[l][k*4+3]
        ];
        var s1 = [
          samples[m][k*4+0],
          samples[m][k*4+1],
          samples[m][k*4+2],
          samples[m][k*4+3]
        ];
        var w0 = [
          Math.round( s0[0] / range ),
          Math.round( s0[1] / range ),
          Math.round( s0[2] / range ),
          Math.round( s0[3] / range )
        ];
        var w1 = [
          Math.round( s1[0] / range ),
          Math.round( s1[1] / range ),
          Math.round( s1[2] / range ),
          Math.round( s1[3] / range )
        ];
        
        if(
          w0[0] == w1[0] && w0[1] == w1[1] && w0[2] == w1[2] && w0[3] == w1[3]
        ){
          var rf = l;
          if( referTo[l][k] != -1 ){
            rf = referTo[l][k];
          }
          referTo[m][k] = rf;
          flags[rf][k]++;
          
          break;
        }
      }
    }
    
    if( k % Math.round( pixelLength / 100 ) == 0 ){
      sendProgress( "Analyzing...", k / pixelLength );
    }
    
  }
  
  //Find the most refered frame per pixel
  for( var n = 0; n < flags[0].length; n++ ){
    var a = 0;
    for( var o = 0; o < flags.length; o++ ){
      if( flags[a][n] < flags[o][n] ){
        a = o;
      }
    }
    result[n] = a;
  }
  
  return {
    result: result,
    referMap: referTo
  };
}

function render( data, w, h, bw, bh ){
  var s = data.samples;
  var r = data.referMap;
  var a = data.analyzerResult;
  var rm = data.renderMode;
  
  var result = new Uint8ClampedArray( w * h * 4 );
  
  for( var i = 0; i < h; i++ ){
    var by = Math.floor( i / ( h / bh ) );
    
    for( var j = 0; j < w; j++ ){
      var bx = Math.floor( j / ( w / bw ) );
      var bi = by * bw + bx;
      var fi = a[bi];
      var index = ( i * w + j ) * 4;
      
      //RenderMode = default
      if( rm === 1 ){
        var blt = [ 0, 0, 0, 0 ];
        var blc = 0;
        
        for( var k = 0; k < r.length; k++ ){
          if( k == fi || r[k][bi] == fi ){
            blt[0] += s[k][index+0];
            blt[1] += s[k][index+1];
            blt[2] += s[k][index+2];
            blt[3] += s[k][index+3];
            blc++;
          }
        }
        
        result[index+0] = blt[0] / blc;
        result[index+1] = blt[1] / blc;
        result[index+2] = blt[2] / blc;
        result[index+3] = blt[3] / blc;
        
      //renderMode = blend
      }else{
        result[index+0] = s[fi][index+0];
        result[index+1] = s[fi][index+1];
        result[index+2] = s[fi][index+2];
        result[index+3] = s[fi][index+3];
        
      }
      
    }
    
    if( i % Math.round( h / 100 ) == 0 ){
      sendProgress( "Rendering...", i / h );
    }
    
  }
  
  return {
    result: result
  };
}

function sendProgress( m, p ){
  self.postMessage({
    status: 1,
    msg: m,
    prog: p
  });
}

self.addEventListener( 'message', start );