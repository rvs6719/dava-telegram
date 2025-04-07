import express from 'express';
const app = express()
const port = 80
const root = {root: "pages"}
import cookieParser from 'cookie-parser'
import jwt from "jsonwebtoken"
import {createHmac, createHash} from 'node:crypto'

app.use(express.static('public'));
app.use(cookieParser());

const SECRET = "davqwe123"
const botToken = "7634413006:AAFCmgHZfQqRhnHZsd2EzrboXb1lncZNM7Y";


let users = [
    {
      id: '1',
      login: 'admin',
      password: 'admin',
      role: 'admin'
    },
    {
      id: '2',
      login: 'user',
      password: 'user',
      role: 'user'
    },
    {
      id: '3',
      login: 'staff',
      password: 'staff',
      role: 'staff'
    }
]

const session = [];

function validateUserData(data) {
  const keys = Object.keys(data).sort();
  let str = '';
  for (const key in keys) {
      if (keys[key] !== 'hash') {
          str += keys[key] + '=' + data[keys[key]];
          if (+key !== keys.length - 1) str += '\n';
      }
  }

  const hashSecret = createHash('sha256').update(botToken).digest();
  const hash = createHmac('sha256', hashSecret).update(str).digest('hex');
  const compare = hash === data.hash;

  const authDate = new Date(+data.auth_date * 1000);

  if (!compare || ((+new Date() - +authDate) / 1000 > 60)) {
      return false;
  }
  return true;

}

app.get('/telegram', (req, res) => {
  const userData = req.query;
  if(validateUserData(userData)){
    //res.send("Login sucessfull");
    res.sendFile('telegram.html',  root)
  }else{
    res.send("Data incorrect!");
  }
})

app.get('/', (req, res) => {
  //res.sendFile('auth.html',  {root: "pages"});
  res.sendFile('auth.html',  root);
})

app.get('/auth', (req, res) => {
    const errors = {};
    const data = req.query;
    if(!data.login ||!data.login?.length === 0){
      errors["login"] = "Вы не указали логин.";
    }
    if(!data.password ||!data.password?.length === 0){
      errors["password"] = "Вы не указали пароль.";
    }
    if(Object.keys(errors).length > 0){
      res.statusCode = 400;
      res.send(errors);
    }
    const findedUser = users.find(
      (i) => i.login === data.login && i.password === data.password,
    );
    if(findedUser === undefined){
      res.statusCode = 401;
      res.send("Неправильный логин или пароль");
    }
    //const sessionKey = randomUUID();
    const token = jwt.sign(findedUser, SECRET);
    //console.log(token);
    session.push(token);
    res.cookie("session", token, { path: "/", httpOnly: true });
    res.statusCode = 301;
    if(findedUser.role === "admin" || findedUser.role === "staff"){
      res.redirect("/staff");
    } else {
      res.redirect("/all");
    }


})


  app.get('/all', (req, res) => {
    const token = req.cookies.session;
    try {
      jwt.verify(token, SECRET);
      res.sendFile("all.html", {root: "pages"})
      return
    } catch (e) {
      console.log(e);
      res.statusCode = 301;
      res.redirect("/");
      return;
    }

})

app.get('/staff', (req, res) => {
    const token = req.cookies.session;
    try {
      jwt.verify(token, SECRET);
      res.sendFile("staff.html", {root: "pages"})
      return
    } catch (e) {
      console.log(e);
      res.statusCode = 301;
      res.redirect("/");
      return;
    }
})

app.get('/logout', (req, res) => {
    const sessionKey = req.cookies.session;
    if(sessionKey === undefined){
      res.redirect("/");
      return;
    }
    const idx = session.findIndex((i) => i === sessionKey);
    if(idx < 0){
      res.redirect("/");
      return;
    }
    session.splice(idx, 1);
    res.clearCookie("session");
    res.redirect("/");
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})