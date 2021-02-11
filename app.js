//require env variable
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const { authenticateUser } = require('./auth_config/auth');
const logger = require('./logger');

// create own app
const app = express();
const server = require('http').createServer(app);
//set up socket.io
const socketio = require('socket.io');
const io = socketio(server);

io.on('connection', socket=>{
    
    socket.join('join', ({username, room})=>{
         socket.join(room);
         // simple emit a message
         socket.emit('message', 'Welcome to Survey Buddy'); // emit to single user who is connecting

        //new user is connected
         socket.broadcast.to(room).emit('message', `New ${username} is connected`);// emit to all users except to connected user
    })
    

    //user disconnected
    socket.on('disconnect', ()=>{
        io.emit('message', 'User is disconnected');           // emit to all users
    })

    //do some opretion
    socket.on('opretion', opretion=>{
        io.emit('message', opretion)
    })
})

//middle ware
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname+"/public"));
//body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//mongoose connect and set plugins
mongoose.connect(process.env.DB_URL,
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
     })
    .then(() => logger.info('Connected to Mongo Database successfully'))
    .catch(err => logger.error(err));

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
server.listen(port, () => logger.info(`server is running at port: ${port}`));