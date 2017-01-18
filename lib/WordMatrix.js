function WordMatrix(input, matrix){
  var matrix = matrix?matrix:{};
  WordMatrix.give(matrix, input);
  return matrix;
}

WordMatrix.isEmpty = function(matrix){
  return Object.keys(WordMatrix(matrix)).length == 0;
};

WordMatrix.isStranded = function(matrix){
  if(WordMatrix.isEmpty(matrix)) return true;
  if(Object.keys(matrix).length == 1){
    for(var step in matrix){
      return WordMatrix.isStranded(matrix[step]);
    }
  }else{
    return false;
  }
};

WordMatrix.toSentences = function(matrix){
  matrix = WordMatrix(matrix);
  var keys = Object.keys(matrix);
  var sentences = [];
  for(var i=0; i<keys.length; i++){
    var list = WordMatrix.toSentences(matrix[keys[i]]);
    if(list.length == 0){
      sentences.push(keys[i]);
    }
    for(var l=0; l<list.length; l++){
      sentences.push(keys[i]+list[l]);
    }
  }
  return sentences;
}

WordMatrix.give = function(matrix, input){
  if(Array.isArray(input)){
    for(var i=0; i< input.length; i++){
      WordMatrix.give(matrix, input[i]);
    }
  }else if(typeof input == "string"){
    var steps = [];
    var build = "";
    for(var i=0; i<input.length; i++){
      var char = input[i];
      if(char == " "){
        steps.push(build);
        build = input[i-1]=='"'?'" ':" ";
        build += input[i+1]=='"'?'"':"";
        steps.push(build);
        build = "";
      }else if(char == "'" || char == "!" || char == "?"){
        steps.push(build);
        build = char;
      }else if(char == '"'){
        continue;
      }else if(char == '*'){
        steps.push(build);
        steps.push(char);
        build = "";
      }else{
        build+=char;
      }
    }
    if(build) steps.push(build);
    var cursor = matrix;
    for(var i=0; i< steps.length; i++){
      var step = steps[i];
      if(typeof cursor[step] == "undefined") cursor[step] = {};
      cursor = cursor[step];
    }
  }else if(typeof input == "object"){
    for(var word in input){
      if(typeof matrix[word] == "undefined") matrix[word] = {};
      WordMatrix.give(matrix[word], input[word]);
    }
  }
  return matrix;
};

WordMatrix.take = function(matrix, input){
  if(Array.isArray(input)){
    for(var i=0; i< input.length; i++){
      WordMatrix.take(matrix, input[i]);
    }
  }else if(typeof input == "string"){
    WordMatrix.take(matrix, WordMatrix(input));
  }else if(typeof input == "object"){
    for(var word in input){
      if(WordMatrix.isStranded(matrix[word])) delete matrix[word];
      else{
        WordMatrix.take(matrix[word], input[word]);
      }
    }
  }
  return matrix;
};

WordMatrix.search = function(matrix, input, isStrict, depth){
  var temp, results, output = WordMatrix();
  depth = depth?depth:0;
  if(depth && typeof depth != "number") depth = Infinity;

  if(typeof matrix != "object" || Array.isArray(matrix)) matrix = WordMatrix(matrix);
  if(typeof input != "object" || Array.isArray(input)) input = WordMatrix(input);

  for(var i in matrix){
    if(input[i]){
      if(WordMatrix.isEmpty(input[i])){
        //console.log(i);
        temp = {};
        temp[i] = matrix[i];
        WordMatrix.give(output, temp);
      }else{
        //console.log(i, "search")
        results = WordMatrix.search(matrix[i], input[i], isStrict, 0);
        if(!WordMatrix.isEmpty(results)){
          temp = {};
          temp[i] = results;
          WordMatrix.give(output, temp);
        }

        results = WordMatrix.search(matrix[i], input, isStrict, depth?depth-1:0);
        if(!WordMatrix.isEmpty(results)){
          temp = {};
          temp[i] = results;
          WordMatrix.give(output, temp);
        }
      }
    }else{
      if(isStrict && !depth) continue;
      results = WordMatrix.search(matrix[i], input, isStrict, depth?depth-1:depth);
      if(!WordMatrix.isEmpty(results)){
        temp = {};
        temp[i] = results;
        WordMatrix.give(output, temp);
      }
    }
  }

  return output;
}

var module;
if(module){
  module.exports = WordMatrix;
}
