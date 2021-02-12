//require env variable
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const { authenticateUser } = require('./auth_config/auth');

// create own app
const app = express();



//middle ware
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname+"/public"));
//body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const http = require('http').createServer(app)
const io = require('socket.io')(http,{
    cors: {
      origin: "http://localhost:3000",
      credentials: true
    }
  })

let lengthOfDoc=3000
let codesMapper={} //{ '0': [ '1', '' ], '1': [ '2', '4', '' ] }
let keywordsMapper={} 
let leftMenuCodesMapper={} //{ '1': 'a', '2': 'b' }  

const codes=({num,value})=>{
  codesMapper={...codesMapper,[num]:value?.split(';')}
  const filteredArray = Object.keys(leftMenuCodesMapper).filter(item => value?.split(';').includes(item));

  console.log("left codes",(Object.keys(leftMenuCodesMapper)))
  console.log("right codes",value?.split(';'))
  console.log("filtered Array",filteredArray)
  return
}
const keywords=({num,value})=>{
  keywordsMapper={...keywordsMapper,[num]:value}
  return
}
const leftmenuCodes=({i,value})=>{
  leftMenuCodesMapper={...leftMenuCodesMapper,[i]:value}
  console.log(leftMenuCodesMapper)
  return
}

io.on('connection', socket => {

    socket.on('input-box', ({num,value}) => {
      codes({num,value})
      io.emit('input-box', {num,value})
    })
    socket.on('keywords', ({num,value}) => {
      keywords({num,value})
      io.emit('keywords', {num,value})
    })




    socket.on('left-menu-codes', ({i,value}) => {
      console.log( socket.client.conn.server.clientsCount + " users connected" );
      leftmenuCodes({i,value})
      io.emit('left-menu-codes', {i,value})
    })
    socket.on('left-menu-state', (values) => {
      console.log( socket.client.conn.server.clientsCount + " users connected" );
      console.log((values))
      io.emit('left-menu-state', {values})
    })




    socket.on('left-menu-form-box', (values) => {
      console.log((values))
      io.emit('left-menu-form-box', {values})
    })
    socket.on('left-menu-add-code', (values) => {
      console.log((values))
      io.emit('left-menu-add-code', {values})
    })

    socket.on('left-menu-submit-edited-code', ({id, newName}) => {
      console.log(({id, newName}))
      io.emit('left-menu-submit-edited-code', {id, newName})
    })
    
    socket.on('left-menu-codes-object', (value) => {
      console.log(value)
      io.emit('left-menu-codes-object',value)
    })


    console.log(io.engine.clientsCount)

})


// 


















http.listen(4000, function() {
  console.log('http :== listening on port 4000')
})

// mongoose connect and set plugins


// mongoose.connect(process.env.DB_URL,
//     { 
//         useNewUrlParser: true, 
//         useUnifiedTopology: true,
//         useCreateIndex: true,
//         useFindAndModify: false
//      })
//     .then(() => console.log('MongoDB Connected'))
//     .catch(err => console.log(err));

// //Passport middleware
// app.use(passport.initialize());
// app.use(passport.session());

// //routes
// app.use('/', require('./routes/project'));
// app.use('/', require('./routes/users'));
// app.get('/', authenticateUser, (req, res) =>{
//     res.status(200).send({ message:"Welcome at Survey Buddy",user:req.user});
// });

// // define port for app
// const port = process.env.PORT || 5000;

// // config listen
// app.listen(port, () => console.log(`server is running at port: ${port}`));
