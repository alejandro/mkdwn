/*global Rainbow, ace, $, document, localStorage, window, marked, ui*/
/* jshint browser:true*/ 'use strict';
var App =  {}
$(document).ready(function (){
  var _ = App.utils = App.u =  {
    id: function id(l) { // Author @rem, from jsbin
      var vowels = 'aeiouAEIOU',
        consonants = 'bcdfghjklmnpqrstvwxyBCDFzLMNSXPRTW',
        word = '', length = l || 6, index = 0, set

      for (; index < length; index += 1) {
        set = (index % 2 === 0) ? vowels : consonants
        word += set[Math.floor(Math.random() * set.length)];
      }

      return word
    },

    nextTick: function (fn){ // this is silly
      return setTimeout(fn, 0)
    },

    defineProperty: function (el, property, val, set){
      if (typeof(property) === 'object') {
        var keys = Object.keys(property)
        return keys.forEach(function (k){
          console.log(k, property[k])
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
  /**
   * Initialize
   * -----------
   */
  App.initialize = function (){
    marked.setOptions({
        gfm      : true,
        sanitize : true
    })
    App.editor = App.e = new App.Editor()
    App.reader = App.r = new App.Reader()
    App.UI.menu
      .add('New &lt;alt+n&gt;', App.e.newCanvas)
      .add('List', App.UI.showAll)
      .add('Load &lt;alt+o&gt;', App.e.loadCanvas)
      .add('Set Name', App.e.setName)
      .add('Rename', App.UI.rename)
      .add('Clean all', App.e.cleanCanvas)
    
    
    window.oncontextmenu = function(e){
      e.preventDefault()
      console.log(e.pageX, e.pageY)
      App.UI.menu.moveTo(e.pageX, e.pageY).show()
    }
  }
  /**
   * Markdown Editor powered with Ace
   * --------------------------------
  */
  App.Editor = function (){
    var editor = ace.edit("editor");
    ui.Emitter.call(this)
    ace.config.set("workerPath", "components/ace/build/src")
    editor.getSession().setMode("ace/mode/markdown")
    editor.renderer.setShowGutter(false)
    editor.setKeyboardHandler(require('ace/keyboard/vim').handler)
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
      this.id = (window.location.hash || _.id()).replace('#','')
      this.el = editor;
      
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
      _.nextTick(function(){ 
        localStorage.setItem(this.id, JSON.stringify({
          id: this.id,
          textContent: this.textContent,
          mtime: +new Date()
        }))
      }.bind(this))
    },

    get: function (){
      return localStorage.getItem(this.id)
    },

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
      }.bind(this))
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
    }
  }) /* eof Editor */

  /**
   * Reader (preview) Panel
   */
  App.Reader = function Reader(name) {
    App.e.on('change', this.parse.bind(this))
    this.el = $('[name="' + (name || 'output') + '"]')
    this.active = true
  }

  App.Reader.prototype.parse = function() {
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
              .replace(doubleQuote, '\"');

          $el.html(html);

          var classes = el.className.split(/\s+/);
          classes.forEach(function(klass){
            if (klass.indexOf('lang-') !== -1) {
                  var language = klass.substring('lang-'.length);
                  $el.attr('data-language', language);
            }
          })
          try { Rainbow.color() }catch(ex){}
      })
      
    }.bind(this))
  } /* eof Reader */
  
  /**
   * UI Elements
   */
  App.UI = {
    menu: ui.menu(),
    createDialog: function (title, body){
      return ui.dialog(title, body)
               .closable()
               .overlay()
               .show()
    },
    rename: function (){
      var html = $('<input name="name" type="text" />' +
                '<button data-name="ok"> Ok </button>')
      var el = App.UI.createDialog('New Name:', html)

      el.on('close', function (){
        App.e.rename(html.val())
      })
    },
    render: function (tmpl, vars){
      return tmpl.replace(/<%=([\s\S]+?)%>/g, function(st, match){
        match = match.trim()
        if (vars[match]) return vars[match]
        else return void 0
      })
    },
    load: function (name){
      return $('[name="tmpl-' + name +'"]').text()
    },
    showAll: function (){
      var html = App.UI.load('list')
      var loop = localStorage.length, i = 0
      var output = []

      for (; i <= loop; ++i) output.push(App.UI.render(html, {
        id: localStorage.key(i)
      }))
      App.UI.createDialog('Files:', $('<ul>' + output.join('') +'</ul>'))
    },

    btns: function (btns){
      btns.forEach(function (it){
        $('#' + it).on('click', function (e){
          var el = $(e.target), action = (el.data().binding || '')
          App.UI.actions[action].apply(this, arguments)
        })
      })
    },
    actions: {
      'new': function (ev){
        console.log(ev.target)
      }
    }
  } /* eof UI Elements*/

  /**
   * Setup
   */
   App.UI.btns(['wbtns','rbtns'])
   App.initialize()
})
