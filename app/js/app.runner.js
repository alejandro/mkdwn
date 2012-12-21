/*global $, document, window, marked, App, require*/
/* jshint browser:true */

var oldRequire = require


setTimeout(function (/* node app want this*/){ "use strict";

var Editor = require('app/editor')
  , Reader = require('app/reader')

require('app/ui')

if (window.isNode) { //appjs override the require from ace
  window.require = oldRequire
}

$(document).ready(function (){


    var title = $('#title')
    
  // Helpers

  
  /** Initialize **/
  App.initialize = function (){
    marked.setOptions({
      gfm      : true,
      sanitize : true
    })
    
    ;['showAll', 'rename'].forEach(function (it){
      App.UI[it] = App.UI[it].bind(App.UI) // that's why you shouldn't use new
    })

    App.editor = App.e = new Editor()
    App.reader = App.r = new Reader()
    App.UI.menu
      .add('New &lt;alt+n&gt;', App.e.newCanvas)
      .add('Load &lt;alt+o&gt;', App.UI.showAll)
      .add('Set Name', App.UI.rename)
      .add('Rename', App.UI.rename)
      .add('Clean all', App.e.cleanCanvas)
    
    App.UI.btns(['wbtns','rbtns'])
    App.UI.actions.wfsc()

    window.oncontextmenu = function (e){
      // e.preventDefault()      
      // App.UI.menu.moveTo(e.pageX, e.pageY).show()
    }
    window.onhashchange = function (){
      var newn = window.location.hash.replace('#','')
      App.e.changeTo(newn)
    }
  } /* eof App.initialize */

  /* Setup */
  App.initialize()

  setTimeout(function (){ title.slideToggle()}, 5000)

  var last = +new Date()

  $('#wrapper').hover(function (e){
    if (e.pageY < 5) {
      if ((+new Date() - last) > 2000) {
        App.UI.toggleTitle(), last = +new Date()
      }
    }
  })
}) /* eof document.ready */

}, 200) /* eof timeoout */
