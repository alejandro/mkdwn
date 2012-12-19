/*
 * localStorage for Node
 * ----------------------
 * the localStorage API is implemented, with save to disk functionality
*//*jshint es5:true */ 'use strict';


var fs = require('fs')
  , flname = __dirname + '/store.json'
  , ref    = new Map()
  , rref   = new Map()
  , id     = 0, active = false, kue = [], ll

try {
  ll = JSON.parse(fs.readFileSync(flname, 'utf8'))
} catch(e){
  console.log(e.stack)
}

var Storage = Object.create({
  constructor: Storage,
  enumerable: false,
  configurable: false,

  get length(){
    return Object.keys(this).length
  },
  
  clear: function (){
    return Object.keys(this).forEach(function (i){
      delete Storage[i]
    })
  },
  
  getItem: function (key){
    return this[key] || null
  },
  setItem: function (key, val, st) {
    this[key] = val
    // TODO: Refactor this
    rref.set(id++, key)
    ref.set(key, id)

    if (!st) this.saveToDisk()
    return Storage
  },
  key: function (i) {
    return rref.get(i)
  },

  removeItem: function (key){
    delete this[key]
    rref.delete(ref.get(key))
    ref.delete(key)

    this.saveToDisk()
    return Storage
  },

  saveToDisk: function (){
    if (!active) { // with the editor, you can trigger this fn like a bazillion times in a sec
      active = true
      fs.writeFile(flname, JSON.stringify(Storage, null, 2), function (){
        active = false
      })
    } else if (!kue.length) {
      kue.push(1)
      setTimeout(this.saveToDisk, 300)
      kue = []
    }
  },

})

if (ll) {
  Object.keys(ll).forEach(function (k){
    Storage.setItem(k, ll[k], true)
  })
}

module.exports = Storage
