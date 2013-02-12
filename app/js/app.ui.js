/*global App, chrome, $, ui, define, require*/
define('app/ui', function (){ 'use strict';
 /**
   * UI Elements
   */

var _ = require('app/helpers')
  , fs = require('app/fs')
  , w = $('.write')
  , r = $('.read')
  , title = $('#title')
  , write = true, read = true, fsc = false

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

  return App.UI
})
