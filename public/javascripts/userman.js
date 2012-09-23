(function(){
  var i,
      newdiv,
      ulistdiv = document.getElementById("userlist"),
      table = document.createElement("table"),
      createTh = function(header, cb){
        var newth = document.createElement('th');
        newth.innerHTML = header;
        if (cb){
          cb(newth);
          return;
        }
        return newth;
      },
      createTr = function(user, cb){
        var newtr = document.createElement("tr"),
            emailtd, nametd, gtidtd, optd;
        emailtd = document.createElement("td");
        nametd = document.createElement("td");
        gtidtd = document.createElement("td");
        optd = document.createElement("td");
        emailtd.innerHTML = user.email;
        nametd.innerHTML = user.name.first + ' ' + user.name.last;
        gtidtd.innerHTML = user.gt_id;
        optd.innerHTML = "COMMANDS";
        newtr.appendChild(emailtd);
        newtr.appendChild(nametd);
        newtr.appendChild(gtidtd);
        newtr.appendChild(optd);
        if (cb){
          return cb(newtr, user);
        }
        return newtr;
      }, usertr;
  ["email", "name", "gtid", "operations"].forEach(function(header){
    var hth = createTh(header);
    table.appendChild(hth);
  });
  ulistdiv.appendChild(table);
  for (i = 0; i < users.length; i += 1){
    usertr = createTr(users[i]);
    table.appendChild(usertr);
  }
  document.getElementsByClassName("content")[0].appendChild(table);
}());
