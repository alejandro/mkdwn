/*global Rainbow, ace, $, document, window, marked, ui, alert, App*/
/* jshint browser:true */ 'use strict';

var oldRequire = require

setTimeout(function (){ // node app requires this

var _ =  require('app/helpers')
var fs = require('app/fs')
require('app/editor')
require('app/reader')

if (window.isNode) {
  window.require = oldRequire
}
function noop(){}

$(document).ready(function (){
  var w = $('.write')
    , r = $('.read')
    , title = $('#title')
    , write = true, read = true, fsc = false
  // Helpers

  
  /** Initialize **/
  App.initialize = function (){
    marked.setOptions({
      gfm      : true,
      sanitize : true
    })
    
    ;['showAll', 'rename'].forEach(function(it){
      App.UI[it] = App.UI[it].bind(App.UI) // that's why you shouldn't use new
    })

    App.editor = App.e = new require('app/editor')
    console.log(App.editor)
    App.reader = App.r = new require('app/reader')
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
  }
  
  
  /**
   * UI Elements
   */
  App.UI = Object.create({
    menu: ui.menu(),

    createDialog: function (title, body){
      return ui.dialog(title, body).closable().overlay().show()
    },

    rename: function (){
      var html = $(this.load('rename'))
      var el = this.createDialog('New Name:', html)

      el.on('close', function (){
        App.e.rename(html.val())
      })
    },

    render: function (tmpl, vars){
      return tmpl.replace(/<%=([\s\S]+?)%>/g, function (st, match){
        match = match.trim()
        if (vars[match]) return vars[match]
        else return void 0
      })
    },

    load: function (name){
      return $('[name="tmpl-' + name +'"]').text()
    },

    showAll: function (){
      var html = this.load('list')
        , loop = App.e.items.length
        , output = [], dialog, i = 0

      for (; i <= loop; ++i) {
        var item = App.e.items.key(i) || ''
        if (!item) continue
        output.push(this.render(html, {
          id: item
        }))
      }
      html = $(
          '<ul>' + output.join('') + '</ul>' +
          '<button data-action="close" class="button">Cancel</button>'
        )
      dialog = this.createDialog('Files:', html)

      html.on('click', function (){
        dialog.hide()
      })
    },

    btns: function (btns){
      var $s = this
      btns.forEach(function (it){
        $('#' + it).on('click', function (e){
          var el = $(e.target), action = (el.data().binding || '')
          if ($s.actions[action])
            $s.actions[action].apply(this, arguments)
        })
      })
    },

    actions: {
      'new': function (){
        // TODO: IMPLEMENTE THIS
      },
      /* read fullscreen */
      rfsc: function (){
        w.toggle()
        if (write && !fsc) {
          r.removeClass('half').addClass('full')  
          fsc = true, write = false
        } else {
          r.removeClass('full').addClass('half')
          fsc = false, read = true, write = true
        }
        App.e.emit('change')
        
      },
      /* write fullscreen */
      wfsc: function (){
        r.toggle()
        if (read && !fsc) {
          w.removeClass('half').addClass('full')
          fsc = true, read = false
        } else {
          w.removeClass('full').addClass('half')
          fsc = false, read = true, write = true
        }
        App.e.emit('change')
      },
      /* menu item */
      menu: function (e){
        e.preventDefault()
        _.nextTick(function(){ // BUG
          App.UI.menu.moveTo(e.pageX, e.pageY).show()
        })
      },
      options: function (){
        chrome.app.window.create('app/options.html')
      },
      saveHTML: function (){
        return fs.save(App.reader.html())
      }
    },
    toggleTitle: function(){
      title.slideToggle()
      setTimeout(function(){
        title.slideToggle()
      }, 2000)
    },
    read: read,
    write: write
  }) /* eof UI Elements*/

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
