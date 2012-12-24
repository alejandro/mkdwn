/*! mkdwn - v2.0.0 - 2012-12-21
 * Copyright (c) 2012 Alejandro Morales; Licensed MIT
 */

/*global define chrome ui console*/
/*jshint proto:true*/
window.App = {}

define('app/helpers', function(){'use strict';
  
  var utils

  function decorate(o, ks, deep){
    Object.keys(ks).forEach(function(k) {
        Object.defineProperty(o, k, Object.getOwnPropertyDescriptor(ks, k))
    });
    if (ks.__proto__ && deep) decorate(o, ks.__proto__)
  }
  // this is silly, return a new object with the key and value provided
  function newo (k,v) { var o = {}; o[k] = v; return o}
  
  var cstorage = chrome.storage.sync

  function times(n) {
    var str = ''
    while (n--) str += String.fromCharCode(Math.floor(Math.random()*255))
    return str
  }

  function Storage(type){
    if (!(this instanceof Storage)) return new Storage(type)
    var store = {}, that = this, set = new Set()
    this.id = times(5)
    this.type = type
    cstorage.get(type, function(st){
      if (!st[type]) return that.set(type, '')
      Object.keys(st[type]).forEach(function(val){
        that.set(val, st[type][val])
      })
    })
    that.lastChange = +new Date()
    this.on('change', function (ev){
      that.lastChange = +new Date()
      switch (ev.action){
        case 'delete':
          set.delete(ev.item)
          break
        case 'new':
        case 'modify':
          set.add(ev.item.name)
          break
        case 'clear':
          cstorage.remove(type)
          set = new Set()
          break
        default:
          break
      }
    })

    utils.defineProperty(this, {
      'store': [function (){
        return store
      }, function (){// fix this
        return store
      }],
      'rset': [function (){
        return set
      }, function (){// fix this
        console.log('set', arguments)
      }]
    })

    window.onclose = function (){
      that.save()
    }
    this.schedule()
  }
  Storage.prototype =  new ui.Emitter()

  decorate(Storage.prototype, {
    get keys(){
      return Object.keys(this.store)
    },
    get length(){
      return this.keys.length
    },
    get items(){
      return this.store
    },
    save: function (){
      cstorage.remove(this.type)
      cstorage.set(newo(this.type, this.store))
    },
    schedule: function (){
      var t = this
      t.writeInterval = setInterval(function (){
        
        if (+new Date() - t.lastChange > 4000) return
        console.log('saving', t.type)
        t.save()
      }, 4000)
    },
    key: function (i){
      return this.keys[i]
    },
    set: function (k, i){
      var self = this
      if (typeof k === 'object'){
        return Object.keys(k).forEach(function(i){ self.set(i, k[i]) })
      }
      this.store[k] = i
      this.emit('change', {action:'new', item: {name: k, value: i}})
    },
    remove: function (k){
      delete this.store[k]
      this.emit('change', {action: 'delete', item: k})
    },
    get: function (t){
      return this.store[t]
    }, 
    clear: function (){
      this.emit('change', {action: 'clear'})
      return cstorage.clear()
    },
    has: function (k){
      return this.rset.has(k)
    },
    raw: cstorage,
  }) /* eof Storage */

  utils = {
    Storage: window.isNode ? window.Store : Storage,
    decorate: decorate, // dunno why i export this but it's useful
    store: cstorage,
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
          return utils.defineProperty(el, k, property[k][0], property[k][1])
        })
      }
      try {
        Object.defineProperty(el, property, {
          get: val,
          set: set || function (){},
          enumerable: false
        })
      } catch(ex) {
        console.log('[ERROR]', ex.stack)
      }
    },

  }/* eof utils */

  return utils
})

/*global define chrome console App*/
define('app/fs', function (){ 'use strict';
  function errorHandler(){
    console.error('[ERROR]', arguments)
  }
  function save(fileEntry, content) {
    if (!fileEntry) return console.log('[error] no fileEntry')
    fileEntry.createWriter(function (fileWriter){
      fileWriter.onwriteend = function (){
        fileWriter.onwriteend = null
        fileWriter.truncate(content.length)
      }
      fileWriter.onerror = function (e){
        console.log('Write failed: ' + e.toString())
      }
      var blob = new Blob([content], {'type': 'text/plain'})
      fileWriter.write(blob)
    }, errorHandler)
  }

  function saveFile(content, fileName) {
    window.webkitRequestFileSystem(1, 1024*1024, function (fs){
      fs.root.getFile(fileName, {create: true}, function (fileEntry){
        save(fileEntry, content)
      }, errorHandler)
    }, errorHandler)
  }

  function saveFileAs(content) {
    chrome.fileSystem.chooseEntry({'type': 'saveFile'}, function (fileEntry){
      save(fileEntry, content || App.e.textContent)
    })
  }

  return {
    save: saveFileAs,
    saveFile: saveFile
  }
})

/*global App, define, require, $, marked, Rainbow*/ /*jshint devel:true*/
define('app/reader', function(){'use strict';

  var _ = require('app/helpers')

  App.Reader = function Reader(name) {
    if (!(this instanceof App.Reader)) return new App.Reader(name)
    App.e.on('change', this.parse.bind(this))
    this.el = $('[name="' + (name || 'output') + '"]')
    this.active = true
  }
  App.Reader.prototype.html = function () {
    var md = App.editor.textContent
    try {
      md = marked(md)
    } catch(ex){
      console.log('[ERROR] EPARSINGER')
    }
    return md
  }
  App.Reader.prototype.parse = function (){
    if (!App.UI.read) return

    _.nextTick(function (){
      this.el.html(this.html())
      this.last = +new Date()
      this.el.find('code').each(function (i, el){
        var $el = $(el)
          , html = $el.html()
          , classes
      
        html = // cleanup html
          html
            .replace(/‘/g, '\'').replace(/’/g, '\'')
            .replace(/“/g, '\"').replace(/”/g, '\"')

        $el.html(html)

        classes = el.className.split(/\s+/)
        classes.forEach(function(klass){
          if (klass.indexOf('lang-') !== -1) {
                var language = klass.substring('lang-'.length)
                $el.attr('data-language', language)
          }
        })
        try { Rainbow.color() } catch(ex) {}
      })
      
    }, this)
  } /* eof Reader */
  return App.Reader
})


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

/*global App, ace, define, require, ui, $*/
define('app/editor', function(){
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
    ace.config.set("workerPath", "components/ace/build/src")
    editor.getSession().setMode("ace/mode/markdown")
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
      e.preventDefault()      
      App.UI.menu.moveTo(e.pageX, e.pageY).show()
    }
    window.onhashchange = function (){
      var newn = window.location.hash.replace('#','')
      App.e.changeTo(newn)
    }
  } /* eof App.initialize */
  
  App.initialize()

  setTimeout(function (){ title.slideToggle() }, 5000)

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
