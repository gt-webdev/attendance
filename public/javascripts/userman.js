(function(){
  var i,
      newdiv,
      ulistdiv = document.getElementById("userlist");
  for (i = 0; i < users.length; i += 1){
    newdiv = document.createElement("div");
    newdiv.innerHTML = JSON.stringify(users[i]);
    ulistdiv.appendChild(newdiv);
  }
}());
