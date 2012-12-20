/*
 * define
 * ------
 * Small one-purpose definition of "define" spec, this is the no brainer 
 * version of it, and it should be only used if you are really crazy.
*/
!function (exp){
  var definitions = {}
  exp.define = function define(name, definition) {
    if (typeof(definition) !== 'function') definition = function (){ return definition}
    definitions[name] = definition
  }

  exp.require = function require(name) {
    if (!definitions[name]) throw new Error(name + ' is not defined')
    return definitions[name]()
  }
}(window)