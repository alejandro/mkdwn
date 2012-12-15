/*global Rainbow, ace, $, document, window, marked, ui, alert, App*/
/* jshint browser:true */ 'use strict';

var oldRequire = require

setTimeout(function (){
var localStorage = window.localStorage

if (!Object.create || !Function.bind) { // TODO. Refactor this :trollface
  var msg = 'Yo, your browser is too old for this!'
  alert(msg); throw new Error(msg)
}

if (window.isNode) {
  localStorage = window.Store
  window.require = oldRequire
}

window.App = {}

$(document).ready(function (){
  var w = $('.write')
    , r = $('.read')
    , title = $('#title')
    , write = true, read = true, fsc = false
  // Helpers
  var _ = App.utils = App.u =  {
    id: function id(l) { // Author @rem, from jsbin
      var vowels = 'aeiouAEIOU',
        consonants = 'bcdfghjklmnpqrstvwxyBCDFzLMNSXPRTW',
        word = '', length = l || 6, index = 0, set

      for (; index < length; index += 1) {
        set = (index % 2 === 0) ? vowels : consonants
        word += set[Math.floor(Math.random() * set.length)]
      }

      return word
    },

    nextTick: function (fn, ctx){ // this is silly
      if (ctx) fn = fn.bind(ctx)
      return setTimeout(fn, 0)
    },

    defineProperty: function (el, property, val, set){
      if (typeof(property) === 'object') {
        var keys = Object.keys(property)
        return keys.forEach(function (k){
          return _.defineProperty(el, k, keys[k])
        })
      }
      Object.defineProperty(el, property, {
        get: val,
        set: set || function (){},
        enumerable: true
      })
    }
  }/* eof utils */
  
  /** Initialize **/
  App.initialize = function (){
    marked.setOptions({
        gfm      : true,
        sanitize : true
    })
    
    ;['showAll', 'rename'].forEach(function(it){
      App.UI[it] = App.UI[it].bind(App.UI) // that's why you shouldn't use new
    })

    App.editor = App.e = new App.Editor()
    App.reader = App.r = new App.Reader()
    App.UI.menu
      .add('New &lt;alt+n&gt;', App.e.newCanvas)
      .add('Load &lt;alt+o&gt;', App.UI.showAll)
      .add('Set Name', App.UI.rename)
      .add('Rename', App.UI.rename)
      .add('Clean all', App.e.cleanCanvas)
    
    App.UI.btns(['wbtns','rbtns'])
    
    window.oncontextmenu = function (e){
      e.preventDefault()      
      App.UI.menu.moveTo(e.pageX, e.pageY).show()
    }
    window.onhashchange = function (){
      var newn = window.location.hash.replace('#','')
      App.e.changeTo(newn)
    }
  }
  /**
   * Markdown Editor powered with Ace
   * --------------------------------
  */
  App.Editor = function Editor() {
    var editor = ace.edit("editor")
    
    ui.Emitter.call(this)
    ace.config.set("workerPath", "components/ace/build/src")
    editor.getSession().setMode("ace/mode/markdown")
    editor.renderer.setShowGutter(false)
    editor.setKeyboardHandler(this.get('cfg:keyboard'))
    this.initialize(editor)
  }
  
  App.Editor.prototype = App.Editor.fn = new ui.Emitter()
  
  App.Editor.include = function (o){
    Object.keys(o).forEach(function (i){
      return App.Editor.prototype[i] = o[i]
    })
  }
  

  App.Editor.include({
    initialize: function (editor){
      var emitChange = this.emit.bind(this, 'change')
        , last = localStorage.getItem('mkdwn:last')

      if (!last) last = (window.location.hash || _.id())
      this.id = last.replace('#','')
        this.set('mkdwn:last', this.id)
        window.location.hash = this.id

      this.el = editor
      this.title = $('[data-id="name"]').text(this.id)
      
      _.defineProperty(this, 'textContent', function (){
        return this.el.getValue()
      }, function (t){
        return this.el.getSession().setValue(t)
      })

      this.setupStorage()
      this.el.on('keypress', emitChange)
      this.el.on('change', emitChange)
      this.on('change', this.save.bind(this))
      this.emit('ready')
    },

    cleanCanvas : function (){
      this.textContent = ''
    },

    save: function (){
      // let the event happen then fire this
      _.nextTick(function (){ 
        localStorage.setItem(this.id, JSON.stringify({
          id: this.id,
          textContent: this.textContent,
          mtime: +new Date()
        }))
      }, this)
    },

    get: function (e){
      if (e) {
        if (~e.indexOf(':')) {
          e = e.split(':')
          return this[e[0]][e[1]] || ''
        } else {
          return this[e]
        }
      }
      return localStorage.getItem(this.id)
    },

    cfg: (function (){
      var cfg = JSON.parse(localStorage.getItem('mkdwn:cfg'))
      if (!cfg) cfg = {}
      var keyboard = {
        vim: require('ace/keyboard/vim').handler,
        emacs: require('ace/keyboard/emacs').handler,
        'default': require('ace/keyboard/vim').handler
      }
      if (!cfg.keyboard) cfg.keyboard = 'default'
      localStorage.setItem('mkdwn:cfg', JSON.stringify(cfg)) // save in the last load

      cfg.keyboard = keyboard[cfg.keyboard || 'default']
      return cfg
    })(),

    setupStorage: function (){
      var cval = this.get()
      if (!cval) {
        window.location.hash = this.id
        this.save()
      } else {
        this.merge(JSON.parse(cval))
      }
      _.nextTick(this.emit.bind(this, 'change'))
    },

    merge: function (o){
      return Object.keys(o).forEach(function (i){
        return this[i] = o[i]
      }, this)
    },

    rename: function (name){
      // var oid = this.id, co = this.get()

      if (!localStorage.getItem(name)){
        this.remove()
        this.id = name
        this.save()
      } else {

      }
      window.location.hash = this.id
    },

    remove: function (){
      return localStorage.removeItem(this.id)
    },

    toString: function (){
      return console.log('Name: ' + this.id + '\nLast modified: ' + new Date(this.mtime))
    },

    set: function (key, val, local) {
      if (local) {
        this[key] = val
      }  else localStorage.setItem(key, val)
      this.emit('item:saved')
    },

    changeTo: function (name) {
      if (localStorage[name]) {
        this.save()
        var raw = JSON.parse(localStorage.getItem(name))
        this.id = name
        this.mtime = raw.mtime
        this.textContent = raw.textContent || ''
        this.set('mkdwn:last', this.id)
        this.emit('change')
      }
    }
  })/* eof Editor */

  /**
   * Reader (preview) Panel
   */
  App.Reader = function Reader(name) {
    App.e.on('change', this.parse.bind(this))
    this.el = $('[name="' + (name || 'output') + '"]')
    this.active = true
  }

  App.Reader.prototype.parse = function() {
    if (!read) return /* if the preview tab is not on don't do a thing */
    var md = App.editor.textContent

    _.nextTick(function (){
      try { this.el.html(marked(md))} catch(ex){}
      this.last = +new Date()
      this.el.find('code').each(function (i, el){
          var $el = $(el)
            , html = $el.html()
            , leftSingleQuote = /‘/g
            , leftDoubleQuote = /“/g
            , singleQuote     = /’/g
            , doubleQuote     = /”/g

          html =
            html
              .replace(leftSingleQuote, '\'')
              .replace(leftDoubleQuote, '\"')
              .replace(singleQuote, '\'')
              .replace(doubleQuote, '\"')

          $el.html(html)

          var classes = el.className.split(/\s+/)
          classes.forEach(function(klass){
            if (klass.indexOf('lang-') !== -1) {
                  var language = klass.substring('lang-'.length)
                  $el.attr('data-language', language)
            }
          })
          try { Rainbow.color() }catch(ex){}
      })
      
    }, this)
  } /* eof Reader */
  
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
        , loop = localStorage.length
        , output = [], dialog, i = 0

      for (; i <= loop; ++i) {
        var item = localStorage.key(i) || ''
        if (~item.indexOf('mkdwn:')) continue
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
          r.removeClass('column_6').addClass('column_12')  
          fsc = true, write = false
        } else {
          r.removeClass('column_12').addClass('column_6')
          fsc = false, read = true, write = true
        }
        App.e.emit('change')
        
      },
      /* write fullscreen */
      wfsc: function (){
        r.toggle()
        if (read && !fsc) {
          w.removeClass('column_6').addClass('column_12')
          fsc = true, read = false
        } else {
          w.removeClass('column_12').addClass('column_6')
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
      }
    },
    toggleTitle: function(){
      title.slideToggle()
      setTimeout(function(){
        title.slideToggle()
      }, 2000)
    }
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
