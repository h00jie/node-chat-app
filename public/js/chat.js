var socket = io()

const $chatForm = document.querySelector('#message-form')
const $chatFormInput = $chatForm.querySelector('#message')
const $chatFormButton = $chatForm.querySelector('button')
const $sendLocatioButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle( $newMessage )
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have i scrolled
    const scrollOffset =  $messages.scrollTop + visibleHeight
    
    if ( containerHeight - newMessageHeight <= scrollOffset ) {
        $messages.scrollTop = $messages.scrollHeight

    }


}

socket.on('message', ( message ) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment( message.createdAt ).format('H:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', ( message ) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        locationUrl: message.url,
        createdAt: moment( message.createdAt ).format('H:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users}) => {
    const html =  Mustache.render( sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$chatForm.addEventListener('submit', (e) => {
    e.preventDefault()
    let chatInputValue = $chatFormInput.value
    
    $chatFormButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', chatInputValue, (error) => {

        $chatFormButton.removeAttribute('disabled')
        $chatFormInput.value = ''
        $chatFormInput.focus()

        if ( error ) {
            return console.log( error )
        }

        console.log('Message delivered!')
    } )
})

$sendLocatioButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    $sendLocatioButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition( function ( position ) {
        let location = {
            "latitude" : position.coords.latitude,
            "longitude" : position.coords.longitude 
        }
        socket.emit('sendLocation', location, () => {
            console.log( 'Location shared!' )
            $sendLocatioButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, ( error ) => {
    if ( error ) {
        alert( error )
        location.href = '/'

    }
})