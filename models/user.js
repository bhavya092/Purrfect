var mongoose =require('mongoose');
var passportLocalMongoose=require('passport-local-mongoose');


var userSchema= new mongoose.Schema({
    username:String,
    password:String,
    email: { type: String, unique: true, required: true },
    contact: { type: String, unique: true, required: true },
    breed:String,
    image:String,
    petname:String,
    description:String,
    friends:[],
    friendsid:[],

});



userSchema.plugin(passportLocalMongoose);
module.exports= mongoose.model('User',userSchema);