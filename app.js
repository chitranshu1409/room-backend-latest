const express = require('express');
const app = express();
const server =require('http').createServer(app);
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { Socket } = require('socket.io');
const uuid = require('uuid');
require('dotenv').config()
const { Stream } = require('stream');
const io =require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
const Users =require('./models/User');
app.use(cors())

const PORT = process.env.PORT || 4444
app.use(express.urlencoded({ extended: true }));

let userMap={}
let peers={}


io.on("connection", (socket) => {
    console.log("connection done");

    socket.on("joinRoom",async ({roomId, username ,socketId,peerId,email})=>{
        try{

            
            socket.join(roomId);
            userMap[socketId]={
                username,
                roomId,
                peerId,
                email
            }
            let clients=[];
         
            let sockets =await io.fetchSockets();
            sockets.forEach((e)=>{
                if(userMap[e.id]){
                    clients.push({id:e.id,name:userMap[e.id].username, room:userMap[e.id].roomId,peerId:userMap[e.id].peerId,email:userMap[e.id].email})
                }
                
            })
            
            io.to(roomId).emit("socketId",{socketId:socketId,userMap:userMap,peers:peers,peers:peers,clients:clients})

            socket.to(roomId).emit("peerId",{peerId:peerId});

            socket.broadcast.to(roomId).emit("user-joined",{username:username,socketId:socketId,otherUserPeerId:peerId,roomId:roomId,clients:clients,userMap:userMap})
            await Users.create({username:username,roomId:roomId,email:email});
            
        }
        catch(err){
            console.log(err)
        }
    });
    socket.on("screen-share",({isScreenShareActive,roomId})=>{
        socket.broadcast.to(roomId).emit("screen-share-accepting", {isScreenShareActive})
    })
    socket.on("newMessage", ({message,roomId,socketId,username})=>{
        
        
        io.to(roomId).emit("message",{message:message,username:username,socketId:socketId})

    })
    socket.on("video-off",({isVideoActive,roomId,firstTime})=>{
        socket.broadcast.to(roomId).emit("remote-video-off",{isRemoteVideoActive:isVideoActive,firstTime})
    })

    socket.on("toggle-mic",({isMicActive,roomId})=>{
        socket.broadcast.to(roomId).emit("toggle-remote-mic",{isRemoteMicActive:isMicActive})
    })
    
    socket.on("disconnect",async ()=>{
        let sockets =await io.fetchSockets();
        let newUserMap = {};
        let clients = [];
        sockets.forEach((e)=>{
            if(userMap[e.id]){
                newUserMap[e.id]=userMap[e.id]
              
                
                clients.push({id:e.id,name:newUserMap[e.id].username, room :newUserMap[e.id].roomId})
                
            }
        })    
        userMap=newUserMap;    
        
        io.emit("usersupdated",{clients,userMap})
    })
});
server.listen(PORT, () => {
    console.log(`http://localhost:` + PORT);
});


// mongoose.connect(`mongodb+srv://chitranshuarya:${process.env.PASSWORD}@cluster0.puhxlxl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).then(()=>{
    
//     console.log('connected');
// }).catch((err)=>{
//     console.log(err);
// });
