
var ui = {};

ui.dom = {
  progBox: elm( "progress-box" ),
  progMsg: elm( "progress-msg" ),
  progColor: elm( "progress-color" ),
};

function handleStart(){
  start( media );
}

function setProgress( msg, perc ){
  ui.dom.progMsg.innerHTML = msg;
  ui.dom.progColor.style.width = perc * 100 + "%";
}
