const socket = io()

const msgFormElement = document.querySelector('#msgform')
const msgTextElement = msgFormElement.querySelector('#txtchatmsg')
const msgButtonElement = msgFormElement.querySelector('#btnchatmsg')
const geolocationElement = document.querySelector('#geolocation')
const messagesDisplayElement = document.querySelector('#messagesDisplay')
const roomusersDisplayElement = document.querySelector('#roomusersDisplay')

const messageTemplate = document.querySelector('#messageTemplate').innerHTML
const locationTemplate = document.querySelector('#locationTemplate').innerHTML
const roomusersTemplate = document.querySelector('#roomusersTemplate').innerHTML

const {username,room } = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll = () => {
    const newmsgElement = messagesDisplayElement.lastElementChild
    const newmsgStyles = getComputedStyle(newmsgElement)
    const newmsgMargin = parseInt(newmsgStyles.marginBottom)
    const newmsgHeight = newmsgElement.offsetHeight + newmsgMargin
    console.log(newmsgHeight)
    const visibleHeight =   messagesDisplayElement.offsetHeight

    const containerHeight = messagesDisplayElement.scrollHeight

    const scrollOffset = messagesDisplayElement.scrollTop + visibleHeight

    if (containerHeight - newmsgHeight <= scrollOffset) {
        messagesDisplayElement.scrollTop = messagesDisplayElement.scrollHeight
    }
 
}

socket.on('displayMessage',(messageObj)=>{
    
    const html = Mustache.render(messageTemplate,{
        username: messageObj.username,
        message : messageObj.text ,
        time : moment(messageObj.createdAt).format('h:mm:ss a')
    })
    messagesDisplayElement.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('displayLocation',(locationUrlObj)=>{
  
    const html = Mustache.render(locationTemplate,{
        username: locationUrlObj.username,
        locationUrl : locationUrlObj.locationUrl,
        time : moment(locationUrlObj.createdAt).format('h:mm:ss a')
        })
    messagesDisplayElement.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData',({room,users})=>{
   const html = Mustache.render(roomusersTemplate,{
        room,
        users
    })
    roomusersDisplayElement.innerHTML = html
})


msgFormElement.addEventListener('submit',(e)=>{
    e.preventDefault()
    msgTextElement.setAttribute('disabled','disabled')

    const msg = e.target.elements.chatmsg.value
    socket.emit('sendMessage',msg, (msgSuccess) => {
        msgTextElement.removeAttribute('disabled')
        msgTextElement.value = ''
        msgTextElement.focus()
        if (!msgSuccess)
        {
            return console.log('Misuse of words')
        }
        console.log(' Message Delivered.')
    })
})

geolocationElement.addEventListener('click',()=>{
    
    if (!navigator.geolocation){
        return alert('Geoloaction cannot be obtained by your browser')
    }
    geolocationElement.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitiude: position.coords.latitude,
            longtitude: position.coords.longitude
        },() => {
            console.log('Location shared')
            geolocationElement.removeAttribute('disabled')
        })
        geolocationElement.removeAttribute('disabled')
    })
})

socket.emit('join', {username,room},(error)=>{
    if (error)
    {
        alert(error)
        location.href = '/'
    }
})