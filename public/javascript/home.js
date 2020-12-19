console.log("hi");

var likebutton = document.querySelectorAll('.likebutton');
var like = document.querySelectorAll(".like");
var likecount= Number(like.textContent);





    likebutton.addEventListener("click",function(){
        console.log("post");
        likecount=likecount+1;
        like.textContent= likecount;
        likebutton.textContent="Liked";     
    }); 
    
