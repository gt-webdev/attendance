(function(){
  var i,
      newdiv,
      regfield,
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
      createForm = function(user, cb){
        var form, hidden, method ,csrf ,submit;
        form = document.createElement("form");
        form.setAttribute('method', 'post');
        form.setAttribute('action', '/admin/users');
        method = document.createElement('input');
        method.setAttribute('type', 'hidden');
        method.setAttribute('name', '_method');
        method.setAttribute('value', 'delete');
        csrf = document.createElement('input');
        csrf.setAttribute('type', 'hidden');
        csrf.setAttribute('name', '_csrf');
        csrf.setAttribute('value', ccorg_csrf );
        hidden = document.createElement('input');
        hidden.setAttribute('type', 'hidden');
        hidden.setAttribute('name', 'user_id');
        hidden.setAttribute('value', user._id);
        submit = document.createElement('input');
        submit.setAttribute('type', 'submit');
        submit.setAttribute('value', 'delete users');
        submit.setAttribute('class', 'btn');
        submit.style.setProperty('margin-bottom','-14px');
        submit.style.setProperty('height','30px');
        form.appendChild(method);
        form.appendChild(csrf);
        form.appendChild(hidden);
        form.appendChild(submit);
        if (cb){
          return cb(form);
        }
        return form;
      },
      createTr = function(user, cb){
        var newtr = document.createElement("tr"),
            emailtd, nametd, gtidtd, optd, form, hidden, submit;
        emailtd = document.createElement("td");
        nametd = document.createElement("td");
        gtidtd = document.createElement("td");
        optd = document.createElement("td");
        emailtd.innerHTML = user.email;
        nametd.innerHTML = user.name.first + ' ' + user.name.last;
        gtidtd.innerHTML = user.gt_id;
        optd.appendChild(createForm(user));
        newtr.appendChild(emailtd);
        newtr.appendChild(nametd);
        newtr.appendChild(gtidtd);
        newtr.appendChild(optd);
        emailtd.style.setProperty('padding-right','5px');
        nametd.style.setProperty('padding-right','5px');
        gtidtd.style.setProperty('padding-right','5px');
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
  regfield = document.getElementById('regfield');
  regfield.oninput= function(e){
    var re = new RegExp(regfield.value, 'i'), i, tr, row_width = 4;
    for (i = row_width; i < table.children.length; i += 1){
      tr = table.children[i];
      if (re.test(tr.children[0].innerHTML) || re.test(tr.children[1].innerHTML) || 
          re.test(tr.children[2].innerHTML)){
        tr.style.setProperty('display','table-row');
      } else {
        tr.style.setProperty('display','none');
      }
    }
  };
}());
