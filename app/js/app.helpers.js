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
