//require env variable
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const Question = require('./models/question.model');
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
const client = require('./config/redis.config');
const { cacheTimeFullProject} = require('./constant');

// create own app
const app = express();


//middle ware
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname + "/public"));

//body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//set up socket.io
const socketio = require('socket.io');
const server = require('http').createServer(app);
const io = socketio(server);


//socket code
io.on('connection', socket => {

    console.log("user connected");
    //user connect
    socket.on('joinRoom', async ({ username, room, projectId }) => {
        const user = await userJoin(socket.id, username, room, projectId);

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
    socket.on('disconnect', async () => {
        const user = await userLeave(socket.id);
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
    //for multiple selected responses  operation = { codewordId, responses:[arrayOfResNum]}
    socket.on('multiple-response-operation', async operation => {
        const user = await getCurrentUser(socket.id);
        //update status of cache update
        client.setex(`${user.projectId}=>status`, cacheTimeFullProject,'true');
        //triger operation to connect all users to this room
        io.to(user.room).emit('multiple-operation', operation);
        //here also make change to db
        let count = 0;
        let len = 0;
        new Promise(resolve => {
            operation.responses.map(ele => {
                len++;
                console.log(ele);
                Response.findOne({ resNum: ele, questionId: user.room })
                    .exec((err, response) => {
                        if (err) {
                            socket.emit('message', `Someting went wrong during assigned keyword to Response ${ele}`);
                        } else {
                            if (response.codewords.length === 0) count++;

                            Response.findByIdAndUpdate(response._id, { $addToSet: { codewords: operation.codewordId } },(err, res) => {
                                if (err) { console.log(err); }
                            });
                        }
                        if (len === operation.responses.length) {
                            resolve();
                        }
                    })
            })
        }).then(() => {

            Question.findByIdAndUpdate(user.room, { $inc: { resOfCoded: count } }, { new: true })
                .exec((err, question) => {
                    if (err) { console.log(err); }
                    else {
                        //triger Response of Question coded to connect all users to this room
                        io.to(user.room).emit('question-response-coded', { resOfCoded: question.resOfCoded });
                    }
                });
            Codeword.findByIdAndUpdate(operation.codewordId, { $addToSet: { resToAssigned: operation.responses } }, { new: true })
                .exec((err, result) => {
                    if (err) { console.log(err); }
                    else {
                        //triger Response of Question coded to connect all users to this room
                        io.to(user.room)
                            .emit('codeword-assigned-to-response',
                                { codewordId: result._id, resToAssigned: result.resToAssigned.length });
                    }
                })
        })
    });

    //for single selected response operation = { resNum, codewordIds:[arrayOfcodewordId]}
    socket.on('single-response-operation', async operation => {
        console.log(operation)
        const user = await getCurrentUser(socket.id);
         //update status of cache update
         client.setex(`${user.projectId}=>status`, cacheTimeFullProject,'true');
        //triger operation to connect all users to this room
        io.to(user.room).emit('single-operation', operation);
        //here also make change to db
        let idArray = [];
        new Promise(resolve => {
            Response.findOne({ resNum: operation.resNum, questionId: user.room }).exec((err, response) => {
                if (err) { console.log(err); }
                else{
                    idArray = response.codewords;
                    Response.findByIdAndUpdate(response._id, { $addToSet: { codewords: operation.codewordIds} }, (err, res) => {
                        if (err) { console.log(err); }
                        else {
                            // console.log("response:", res);
                            resolve();
                        }
                    });
                }
            })
                

        }).then(async() => {

            if(idArray.length === 0){
                Question.findByIdAndUpdate(user.room, { $inc: { resOfCoded: 1 } }, { new: true })
                .exec((err, question) => {
                    if (err) { console.log(err); }
                    else {
                        //triger Response of Question coded to connect all users to this room
                        io.to(user.room).emit('question-response-coded', { resOfCoded: question.resOfCoded });
                    }
                });
            }
            //add new codeword
            const assigned = await operation.codewordIds.filter(id=>{
                if(idArray.find(ele=> ele === id)===undefined){
                    return true;
                }else{
                    return false;
                }
            })
            // console.log({assined,idArray,operation:operation.codewordIds});
            assigned.map(assignedId=>{
                Codeword.findByIdAndUpdate(assignedId, { $addToSet: { resToAssigned: operation.resNum } }, { new: true })
                .exec((err, result) => {
                    if (err) { console.log(err); }
                    else {
                        //triger Response of Question coded to connect all users to this room
                        io.to(user.room)
                            .emit('codeword-assigned-to-response',
                                { codewordId: result._id, resToAssigned: result.resToAssigned.length });
                    }
                })
            });
            //remove old codeword
            const deassigned = await idArray.filter(id=>{
                if(operation.codewordIds.find(ele=> ele === id)===undefined){
                    return true;
                }
                else{
                    return false;
                }
            });
            // console.log({deassined,idArray,operation:operation.codewordIds});
            deassigned.map(deassignedId=>{
                Codeword.findByIdAndUpdate(deassignedId, { $pull: { resToAssigned: operation.resNum } }, { new: true })
                .exec((err, result) => {
                    if (err) { console.log(err); }
                    else {
                        //triger Response of Question coded to connect all users to this room
                        io.to(user.room)
                            .emit('codeword-assigned-to-response',
                                { codewordId: result._id, resToAssigned: result.resToAssigned.length });
                    }
                })
            });
 
        })
    });

    //Listen for Add new (codeword=>{projectCodebookId, questionCodebookId, codeword})
    socket.on('addCodeword', async newCodeword => {
        const user = await getCurrentUser(socket.id);
        //update status of cache update
        client.setex(`${user.projectId}=>status`, cacheTimeFullProject,'true');
        //here also make change to db
        const { projectCodebookId, questionCodebookId, codeword } = newCodeword;
        const newcodeword = new Codeword({
            _id: new mongoose.Types.ObjectId(),
            tag: codeword
        }).save((err, result) => {
            if (!err) {
                Codebook.findByIdAndUpdate(questionCodebookId, { $addToSet: { codewords: result._id } }, (err, res) => {
                    if (err) { console.log(err); }
                });
                Codebook.findByIdAndUpdate(projectCodebookId, { $addToSet: { codewords: result._id } },  (err, res) => {
                    if (err) { console.log(err); }
                });
                //triger add new codeword to connect all users to this room
                io.to(user.room).emit('add-new-codeword-to-list', { codewordId: result._id, codeword: newCodeword.codeword, codekey: newCodeword.codekey });
            } else {
                socket.emit('message', 'Someting went wrong during add new codeword');
            }
        });
    });

    //Listen for delete (codeword=>{codewordId})
    socket.on('deleteCodeword', async (deleteCodeword) => {
        const user = await getCurrentUser(socket.id);
        let responses;
        //update status of cache update
        client.setex(`${user.projectId}=>status`, cacheTimeFullProject,'true');
        //here also make change to db
        const codewordId = deleteCodeword.codewordId;
        Codeword.findById(codewordId,(err, codeword) => {
            if(err) console.log(err);
            else {
                let count = 0;
                responses = codeword.resToAssigned;
                new Promise(resolve =>{
                    codeword.resToAssigned.map(resId=>{
                        console.log("resNum:",resId);
                        Response.updateOne({resNum:resId,questionId:user.room}, {$pull:{codewords:codewordId}},(err, res)=>{
                            if(err) console.log(err);
                            count++;
                            if(count === codeword.resToAssigned.length){
                                resolve();
                            }
                        })
                    })
                }).then(()=>{
                    Codeword.findByIdAndRemove(codewordId, (err, res) => {
                        if (err) { console.log(err); }
                        else{
                            //triger delete codeword to connect all users to this room
                            io.to(user.room).emit('delete-codeword-to-list', {codewordId, responses});
                        }
                    });
                    
                }).catch(err=>{
                    console.log({err});
                    socket.emit('message', 'Someting went wrong during delete codeword');
                })
                
            }
        })
        
    });

    //Listen for edit (codeword=>{codeword, codewordId})
    socket.on('editCodeword', async (editCodeword) => {
        const user = await getCurrentUser(socket.id);
        //update status of cache update
        client.setex(`${user.projectId}=>status`, cacheTimeFullProject,'true');
        //here also make change to db
        const { codeword, codewordId } = editCodeword;
        Codeword.findByIdAndUpdate(codewordId, { $set: { tag: codeword } }, (err, res) => {
            if (err) { console.log(err); }
        });
        //triger edit codeword to connect all users to this room
        io.to(user.room).emit('edit-codeword-to-list', editCodeword);
    });

    //Listen for toggle (codeword=>{codewordId})
    socket.on('toggleCodeword', async (toggleCodeword) => {
        const user = await getCurrentUser(socket.id);
        //update status of cache update
        client.setex(`${user.projectId}=>status`, cacheTimeFullProject,'true');
        //here also make change to db
        const codewordId = toggleCodeword.codewordId;
        Codeword.findByIdAndUpdate(codewordId, {$set: {active:toggleCodeword.status} },{ new: true}, (err, res) => {
            if (err) { console.log(err); }
            else{
                //triger edit codeword to connect all users to this room
                const response =res.resToAssigned;
                io.to(user.room).emit('toggle-codeword-to-list', {codewordId, response});
            }
        });
    });
})


//mongoose connect and set plugins
mongoose.connect('mongodb://localhost:27017/SurveyBuddy'||process.env.DB_URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => console.log('Connected to Mongo Database successfully'))
    .catch(err => console.log(err));

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//routes
app.use('/', require('./routes/project'));
app.use('/', require('./routes/users'));
app.get('/', authenticateUser, (req, res) => {
    res.status(200).send({ message: "Welcome at Survey Buddy", user: req.user });
});

// define port for app
const port = process.env.PORT || 5000;

//config listen
server.listen(port, () => console.log(`server is running at port: ${port}`));
