//require env variable
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const Codebook = require('./models/codebook.model');
const Codeword = require('./models/codeword.model');
const Response = require('./models/response.model');
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


//middle ware
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname+"/public"));

//body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//set up socket.io
const socketio = require('socket.io');
const server = require('http').createServer(app);
const io = socketio(server);


//socket code
io.on('connection', socket=>{
    
    console.log("user connected");
    //user connect
    socket.on('joinRoom',async ({username, room})=>{
        const user = await userJoin(socket.id, username, room);

        socket.join(user.room);
        // simple emit a message(emit to single user who is connecting)
        // socket.emit('message', 'Welcome to Survey Buddy');  

        //new user is connected (emit to all users except to connected user)
        socket.broadcast
        .to(user.room)
        .emit('message', `New ${username} is connected`);
    
        // Send users and room info (all user)
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    })
    

    //user disconnected
    socket.on('disconnect',async ()=>{
        const user =await userLeave(socket.id);
        if (user) {
            //(all user) but here loginUser did exit
            io.to(user.room).emit(
              'message', `${user.username} has disconnected`);
      
            // Send users and room info (all user) but here loginUser did exit
            io.to(user.room).emit('roomUsers', {
              room: user.room,
              users: getRoomUsers(user.room)
            });
        }
    })

    // Listen for operation
    // operation = [{responseNum,questionId codewordIds:[codewordId]}]
    socket.on('makeOperation',async operation => {
        const user =await getCurrentUser(socket.id);
        //here also make change to db
        const m = new Map();
        let count;
        await operation.map(ele=>{
            Response.findOne({resNum:ele.responseNum, questionId: user.room})
            .exec((err, response)=>{
                if(err) {
                   socket.emit('message', `Someting went wrong during assigned keyword to Response ${ele.responseNum}`); 
                }else{
                    if(response.codewords.length === 0) count++;
                    
                    Response.findByIdAndUpdate(response._id,  { $push: { codewords: {$each: ele.codewordIds} } }, { upsert: true}, (err, res)=>{
                        if(err) {console.log(err);}
                    });
                    ele.codewordIds.map(item=>{
                       if(m.has(item.codewordId)){
                           m.set(item.codewordId,m.get(item.codewordId)+1);
                       }else{
                           m.set(item.codewordId,1);
                       }
                    });
                }
            })
        }).then(()=>{
            Question.findByIdAndUpdate(user.room, { $inc: {resOfCoded: count}},{new: true})
            .exec((err, question)=>{
                if(err) {console.log(err);}
                else{
                    //triger Response of Question coded to connect all users to this room
                    io.to(user.room).emit('question-response-coded', {resOfCoded:question.resOfCoded}); 
                }
            });
            m.forEach((key, value)=>{
                Codeword.findByIdAndUpdate(key, { $inc: {resToAssigned: value}},{new: true})
                .exec((err,result)=>{
                    if(err) {console.log(err);}
                    else{
                       //triger Response of Question coded to connect all users to this room
                       io.to(user.room)
                       .emit('codeword-assigned-to-response', 
                       {codewordId:result._id, resToAssigned: result.resToAssigned}); 
                    }
                }) 
            })
        }).catch(err=>console.log(err));
        //triger operation to connect all users to this room
        io.to(user.room).emit('operation', operation);
    });

    //Listen for Add new (codeword=>{projectCodebookId, questionCodebookId, codeword})
    socket.on('addCodeword',async newCodeword => {
        const user =await getCurrentUser(socket.id);
        //here also make change to db
        const {projectCodebookId, questionCodebookId, codeword} = newCodeword;
        const newcodeword = new Codeword({
            _id: new mongoose.Types.ObjectId(),
            tag: codeword
        }).save((err, result)=>{
            if(!err){
                Codebook.findByIdAndUpdate(questionCodebookId, { $push: { codebooks: result._id } }, { upsert: true}, (err, res)=>{
                    if(err) {console.log(err);}
                 });
                Codebook.findByIdAndUpdate(projectCodebookId, { $push: { codebooks: result._id } }, { upsert: true }, (err, res)=>{
                    if(err) {console.log(err);}
                 });
                //triger add new codeword to connect all users to this room
                io.to(user.room).emit('add-new-codeword-to-list', {codewordId:result._id, codeword:newCodeword.codeword, codekey:newCodeword.codekey}); 
            }else{
                socket.emit('message', 'Someting went wrong during add new codeword'); 
            }
        }); 
    });

    //Listen for delete (codeword=>{codewordId})
    socket.on('deleteCodeword', async(deleteCodeword)=> {
        const user =await getCurrentUser(socket.id);
        //here also make change to db
        const codewordId = deleteCodeword.codewordId;
        Codeword.findByIdAndRemove(codewordId, (err, res)=>{
            if(err) {console.log(err);}
        });
        //triger delete codeword to connect all users to this room
        io.to(user.room).emit('delete-codeword-to-list', deleteCodeword); 
    });

    //Listen for edit (codeword=>{codeword, codewordId})
    socket.on('editCodeword', async(editCodeword)=> {
        const user =await getCurrentUser(socket.id);
        //here also make change to db
        const {codeword, codewordId} = editCodeword;
        Codeword.findByIdAndUpdate(codewordId, {$set: {tag: codeword}}, (err, res)=>{
            if(err) {console.log(err);}
        });
        //triger edit codeword to connect all users to this room
        io.to(user.room).emit('edit-codeword-to-list', editCodeword); 
    });
})


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
server.listen(port, () => console.log(`server is running at port: ${port}`));