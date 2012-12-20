/*global define chrome ui console*/
/*jshint asi:true, laxcomma:true, browser:true, es5:true,nonstandard:true*/
window.App = {}

define('app/helpers', function(){
  
  function decorate(o, ks, deep){
    Object.keys(ks).forEach(function(i){
      o[i] = ks[i]
    })
    if (ks.__proto__ && deep) decorate(o, ks.__proto__)
  }
  // this is silly, return a new object with the key and value provided
  function newo (k,v) { var o = {}; o[k] = v; return o}
  
  var cstorage = chrome.storage.sync
  cstorage.MAX_WRITE_OPERATIONS_PER_HOUR = Infinity
  
  function Storage(type){
    if (!(this instanceof Storage)) return new Storage(type)
    var store = {}, that = this, set = new Set()

    cstorage.get(type, function(st){
      if (!st[type]) return that.set(type, '')
      Object.keys(st[type]).forEach(function(val){
        that.set(val, st[type][val])
      })
    })

    this.on('change', function (ev){
      switch (ev.action){
        case 'delete':
          cstorage.set(newo(type, this.store))
          set.delete(ev.item)
          break
        case 'new':
        case 'modify':
          set.add(ev.item.name)
          window.saved = newo(type, this.store)
          cstorage.set(window.saved)
          break
        case 'clear':
          cstorage.clear()
          set = new Set()
          break
        default:
          break
      }
    })
    this.store = store // create a local Reference
    this.rset = set
  }

  Storage.prototype = {
    get keys(){
      return Object.keys(this.store)
    },
    get length(){
      return this.keys.length
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
  }

  decorate(Storage.prototype, new ui.Emitter(), true)

   /* eof Storage */
  if (window.isNode) {
    Storage = window.Store
  }

  var utils = Object.create({
    Storage: Storage,
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
          return utils.defineProperty(el, k, keys[k])
        })
      }
      try {
        Object.defineProperty(el, property, {
          get: val,
          set: set || function (){},
          enumerable: true
        })
      } catch(ex) {
        console.log('[ERROR]', ex.stack)
      }
    },

  })/* eof utils */

  return utils
})
