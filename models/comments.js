var mongoose= require('mongoose');




var commentSchema =new mongoose.Schema({
    text:String,
    author:String,
    authorid:String,
    createdOn:{type:Date, default:Date.now},
  });
  
  var Comment =mongoose.model("Comment",commentSchema);

  module.exports= mongoose.model("Comment",commentSchema);

