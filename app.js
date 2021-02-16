//require env variable
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const { authenticateUser } = require('./auth_config/auth');
const logger = require('./logger');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require('./socketUser');
// create own app
const app = express();
const server = require('http').createServer(app);
//set up socket.io
const socketio = require('socket.io');
const io = socketio(server);

io.on('connection', socket=>{
    
    //user connect
    socket.on('joinRoom', ({username, room})=>{
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        // simple emit a message(emit to single user who is connecting)
        // socket.emit('message', 'Welcome to Survey Buddy');  

        //new user is connected (emit to all users except to connected user)
        // socket.broadcast
        // .to(user.room)
        // .emit('message', `New ${username} is connected`);
    
        // Send users and room info (all user)
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    })
    

    //user disconnected
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);
        if (user) {

            //(all user) but here loginUser did exit
            // io.to(user.room).emit(
            //   'message', `${user.username} has left the chat`);
      
            // Send users and room info (all user) but here loginUser did exit
            io.to(user.room).emit('roomUsers', {
              room: user.room,
              users: getRoomUsers(user.room)
            });
        }
    })

    // Listen for operation
    socket.on('makeOperation', operation => {
        const user = getCurrentUser(socket.id);
        //here also make change to db*******************
        //triger operation to connect all users to this room
        io.to(user.room).emit('operation', operation);
    });
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