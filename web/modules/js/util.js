var ObjToArr = function(obj){
  var arr = [];
  for(var i in obj){
    arr.push(obj[i]);
  }
  return arr;
}
/*
Object.prototype.toArray = function()
{
  var arr = [];
  for(var i in this){
    arr.push(this[i]);
  }
  return arr;
}
*/
String.prototype.toTitleCase = function ()
{
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
