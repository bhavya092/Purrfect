var mongoose= require('mongoose');




var postSchema =new mongoose.Schema({
    image:String,
    caption:String,
    createdOn:{type:Date, default:Date.now},
    likes:Number,
    authorid:String,
    petname:String,
    iconimage:String,
    comments:[],
    likedby:[],
  });
  
  var Post =mongoose.model("Post",postSchema);

  module.exports= mongoose.model("Post",postSchema);

