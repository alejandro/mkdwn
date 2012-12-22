/*global App, ace, define, require, ui, $*/
define('app/editor', function(){'use strict';
  /**
   * Markdown Editor powered with Ace
   * --------------------------------
  */
  var _ = require('app/helpers')
    , decorate = _.decorate
    , Storage  = _.Storage
    , items    = new Storage('items')
    , cfg      = new Storage('cfg')

  function noop(){}

  App.Editor = function Editor() {
    if (!(this instanceof App.Editor)) return new App.Editor()
    var editor = ace.edit("editor")
    
    ui.Emitter.call(this)
    ace.config.set('workerPath', 'components/ace/build/src')
    editor.getSession().setMode('ace/mode/markdown')
    editor.renderer.setShowGutter(false)
    editor.setKeyboardHandler(this.get('cfg:keyboard'))
    this.initialize(editor)
  }
  
  App.Editor.prototype = new ui.Emitter()
    

  decorate(App.Editor.prototype, {
    initialize: function (editor){
      var emitChange = this.emit.bind(this, 'change')

      _.store.get('last', function (all){
        var last = all.last
        if (!last) last = (window.location.hash || _.id())
        this.id = last.replace('#','')
          _.store.set({'last': this.id})
          window.location.hash = this.id

        this.el = editor
        this.title = $('[data-id="name"]').text(this.id)

        this.setupStorage()
        this.el.on('keypress', emitChange)
        this.el.on('change', emitChange)
        this.on('change', this.save.bind(this))
        _.defineProperty(this, 'textContent', function (){
          return this.el.getValue()
        }, function (t){
          return this.el.getSession().setValue(t)
        })
        this.emit('ready')

      }.bind(this))
    },

    cleanCanvas: function (){
      this.textContent = ''
    },

    save: function (){
      // let the event happen then fire this
      _.nextTick(function (){
        items.set(this.id,{
          id: this.id,
          textContent: this.textContent,
          mtime: +new Date()
        })
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
      return items.get(this.id)
    },

    cfg: (function (){
      if (!cfg) return {}
      var keyboard = {
        vim: require('ace/keyboard/vim').handler,
        emacs: require('ace/keyboard/emacs').handler,
        'default': require('ace/keyboard/vim').handler
      }
      if (!cfg.get('keyboard')) cfg.set('keyboard', 'default')

      cfg.set('keyboard', keyboard[cfg.get('keyboard') || 'default'])
      return cfg.items
    })(),

    setupStorage: function (){
      var cval = this.get()
      
      if (!cval) {
        window.location.hash = this.id
        this.save(noop)
      } else {
        this.merge(cval)
      }
      _.nextTick(this.emit.bind(this, 'change'))
      
    },

    merge: function (o){
      decorate(this, o)
    },

    rename: function (name){
      // var oid = this.id, co = this.get()
      var item = items.get(name)
      if (!item){
        this.remove()
        this.id = name
        this.save()
      } else { // TODO! Fix me

      }
      window.location.hash = this.id
    },

    remove: function (){
      items.remove(this.id)
      this.initialize(this.el)
    },

    set: function (key, val, local) {
      if (local) {
        this[key] = val
      }  else {
        items.set(key, val)
        this.emit('item:saved')
      }
    },

    changeTo: function (name) {
      if (items.has(name)) {
        this.save()
        var raw = items.get(name)
        if (raw) {
          this.id = name
          this.mtime = raw.mtime
          this.textContent = raw.textContent || ''
          $('[data-id="name"]').text(this.id)
          _.store.set({last: this.id})

          this.emit('change')
        }
      }
    },
    items: items
  })/* eof Editor */
  return App.Editor
})
