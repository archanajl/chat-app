const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicPath = path.join(__dirname,'../public')

app.use(express.static(publicPath))



io.on('connection',(socket)=>{
    console.log('==================')
    console.log(' New client connected')

    socket.on('join',({username, room},callback)=>{
        
        const{error,user} = addUser({id: socket.id,username,room})

        if (error){
           return callback(error)
        }
        socket.join(user.room)

        socket.emit('displayMessage',generateMessage('Admin','Welcome All'))
        socket.broadcast.to(user.room).emit('displayMessage',generateMessage('Admin',user.username + ' has joined.'))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users:getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage',(chatmsg, callback)=>{

        const user = getUser(socket.id)
        if (!user)
            return callback()
        const filter = new Filter()
        if (filter.isProfane(chatmsg))
        {
            return callback(false)
        }
        const now = new Date()
        io.to(user.room).emit('displayMessage',generateMessage(user.username,chatmsg))
        callback(true)
    })

    socket.on('disconnect',() => {
        const user = removeUser(socket.id)
        
        io.to(user.room).emit('displayMessage',generateMessage('Admin', user.username + ' has left.'))
       
        io.to(user.room).emit('roomData',{
            room: user.room,
            users:getUsersInRoom(user.room)
        })
    
 })

    socket.on('sendLocation',(location,callback)=> {
        const user = getUser(socket.id)
        if (!user)
            return callback()
        const locationUrl = 'https://www.google.com/maps?q=' + location.latitiude + ',' + location.longtitude 
        io.to(user.room).emit('displayLocation',generateLocationMessage(user.username,locationUrl))
        callback()

    })

    

})

app.get('/',(req,res) => {
    res.send('index.html')
})

server.listen(port, () => {
    console.log("Server has started")
})