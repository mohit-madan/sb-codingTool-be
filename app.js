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


io.on('connection', socket => {
    socket.on('input-box', ({num,value}) => {
        console.log( {num,value})
      io.emit('input-box', {num,value})
    })
    socket.on('keywords', ({num,value}) => {
        console.log( {num,value})
      io.emit('keywords', {num,value})
    })
})
  
http.listen(4000, function() {
  console.log('http :== listening on port 4000')
})

//mongoose connect and set plugins
mongoose.connect(process.env.DB_URL,
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
     })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//routes
app.use('/', require('./routes/project'));
app.use('/', require('./routes/users'));
app.get('/', authenticateUser, (req, res) =>{
    res.status(200).send({ message:"Welcome at Survey Buddy",user:req.user});
});

// define port for app
const port = process.env.PORT || 5000;

//config listen
// app.listen(port, () => console.log(`server is running at port: ${port}`));