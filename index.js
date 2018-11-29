/*  Trollbox Internet Chat
 *  Copyright (C) 2018 robbie0630
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

require('dotenv').config()

const PORT = process.env.PORT || 8081
const serv = require('http').createServer()
const io = require('socket.io')(serv)
const escape = require('escape-html')

const users = {}

io.on('connection', sock => {
  const onUserUpdate = (nick, color) => {
    const old = users[sock.id]
    users[sock.id] = { nick, color }
    if (old) {
      io.to('lobby').emit('user change nick', old, users[sock.id])
    } else {
      io.to('lobby').emit('user joined', users[sock.id])
    }
    io.to('lobby').emit('update users', users)
  }

  const onMessage = text => {
    io.to('lobby').emit('message', {
      date: Date.now(),
      nick: users[sock.id].nick,
      color: users[sock.id].color,
      msg: escape(text)
    })
  }

  const onJoin = (nick, color) => {
    sock.join('lobby', () => {
      sock.on('user joined', onUserUpdate)
      sock.on('message', onMessage)
      sock.on('disconnect', () => {
        io.to('lobby').emit('user left', users[sock.id])
        delete users[sock.id]
        io.to('lobby').emit('update users', users)
      })
      onUserUpdate(nick, color)
    })
  }

  sock.once('user joined', onJoin)
})

serv.listen(PORT, () => {
  console.log(`listening on *:${PORT}`)
})
