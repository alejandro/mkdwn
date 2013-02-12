var app = require('appjs')

app.serveFilesFrom(__dirname + '/../app');

var window = app.createWindow({});

window.on('create', function (){
  console.log("Window Created");
  window.frame.show();
  window.frame.center();
});

window.on('ready', function (){
  // window.process = process
  // window.module = module
  window.isNode = true
  window.Store = require('./localStorage')
  function F12(e){ return e.keyIdentifier === 'F12' }
  function Command_Option_J(e){ return e.keyCode === 74 && e.metaKey && e.altKey }

  window.addEventListener('keydown', function(e){
    if (F12(e) || Command_Option_J(e)) {
      window.frame.openDevTools()
    }
  })
  window.emit('loaded')
})
