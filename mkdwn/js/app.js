var App =  {}
$(document).ready(function (){  
  App.utils = App.u =  {
    id : function id(l){
      var vowels = 'aeiouAEIOU',
        consonants = 'bcdfghjklmnpqrstvwxyBCDFzLMNSXPRTW',
        word = '', length = l || 6, index = 0, set;

      for (; index < length; index += 1) {
        set = (index % 2 === 0) ? vowels : consonants;
        word += set[Math.floor(Math.random() * set.length)]; 
      }

      return word;
    },
    nextTick: function (fn){
      setTimeout(fn, 0)
    },
    defineProperty: function (el, property, val, set){
      if (typeof(property) === 'object') {
        var keys = Object.keys(property)
        return keys.forEach(function (k){
          console.log(k, property[k])
          return defineProperty(el, k, keys[k])
        })
      }
      Object.defineProperty(el, property, {
        get: val,
        set: set || function (){},
        enumerable: true
      })
    }
  }
  

  App.initialize = function (){
    marked.setOptions({
        gfm      : true,
        sanitize : true
    });
  }
  /**
   * Markdown Editor
   * -----------------
  */
  App.Editor = function (){
    ui.Emitter.call(this)
    this.initialize()
  }
  
  App.Editor.prototype = App.Editor.fn = new ui.Emitter
  
  App.Editor.include = function (o){
    Object.keys(o).forEach(function (i){
      return App.Editor.prototype[i] = o[i]
    }.bind(this))
  }
  

  App.Editor.include({
    initialize: function (){
      var emitChange = this.emit.bind(this, 'change')
      this.id = (window.location.hash || App.utils.id()).replace('#','')
      this.el = $('[name="textarea"]');
      
      App.u.defineProperty(this, 'textContent', function (){
        return this.el.val()
      }, function (t){
        return this.el.val(t)
      })

      this.setupStorage();
      this.el.on('keypress', emitChange)
      this.el.on('change', emitChange)
      this.on('change', this.save.bind(this))
      this.emit('ready')
    },

    cleanCanvas : function (){
      this.textContent = ''
    },
    save: function (e){
      // let the event happen then fire this
      App.u.nextTick(function(){ 
        localStorage.setItem(this.id, JSON.stringify({
          id: this.id,
          textContent: this.textContent,
          mtime: +new Date
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
      App.u.nextTick(this.emit.bind(this,'change'))
    },

    merge: function (o){
      return Object.keys(o).forEach(function (i){
        return this[i] = o[i]
      }.bind(this))
    },
    rename: function (name){
      var oid = this.id, co = this.get()

      if (!localStorage.getItem(name)){
        this.id = name
        this.remove()
        this.save()
      } else {

      }
      window.location.hash = this.id
    }
  })

  /**
   * Reader (preview) Panel
   */
  App.Reader = function Reader() {
    App.e.on('change', this.parse.bind(this))
    this.el = $('[name="output"]')
    this.active = false
    this.kue = []
  }

  App.Reader.prototype.parse = function() {
    var md = App.editor.textContent
    this.kue.push(1)
    var leap = +new Date - this.last

      App.u.nextTick(function (){
        try { this.el.html(marked(md))} catch(ex){}
        this.last = +new Date
        this.el.find('code').each(function (i, el){
            var $el = $(el);

            // Convert any smart quotes into dumb quotes.
            var html = $el.html();
            var leftSingleQuote = /‘/g;
            var leftDoubleQuote = /“/g;
            var singleQuote     = /’/g;
            var doubleQuote     = /”/g;

            html = html
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
            try { Rainbow.color(); }catch(ex){}
        })
        
      }.bind(this))
  }
  
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
      var html = $('<input name="name" type="text" />')
      var el = App.UI.createDialog('New Name:', html)

      el.on('close', function (){
        App.e.rename(html.val())
      })
    }
  }

  /**
   * Setup
   */
  App.editor = App.e = new App.Editor
  App.reader = App.r = new App.Reader
  App.UI.menu
    .add('New &lt;alt+n&gt;', App.e.newCanvas)
    .add('Load &lt;alt+o&gt;', App.e.loadCanvas)
    .add('Set Name', App.e.setName)
    .add('Rename', App.UI.rename)
    .add('Clean all', App.e.cleanCanvas)
  
  window.oncontextmenu = function(e){
    e.preventDefault();
    App.UI.menu.moveTo(e.pageX, e.pageY).show();
  }
})
