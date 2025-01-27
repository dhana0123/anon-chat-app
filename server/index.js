require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require('cors');
const { Server } = require('socket.io');
const io = new Server(server, {
	cors: { origin: '*' },
	reconnectionAttempts: 5,
});
const HTTP_PORT = process.env.PORT || 4000;

// Mongodb
const mongoose = require('mongoose');
mongoose.connect(process.env.MongoDB_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// Schemas
const User = require('./models/UserSchema');

// Modules
const userModule = require('./users');

app.use(express.json());
app.use(cors());

// Routes
app.post('/user/add', (req, res) => {
	User.create(
		{
			email: req.body.email,
		},
		(err, data) => {
			if (err) {
				console.log(err);
			} else {
				res.status(202).json(data);
			}
		},
	);
});

app.get('/user/find', (req, res) => {
	User.find(req.query, (err, data) => {
		if (err) {
			console.log(err);
		} else {
			if (data.length === 0) {
				res.sendStatus(202);
			} else {
				const user = {};

				user['id'] = data[0]._id.toString();
				res.status(200).send(JSON.stringify(user));
			}
		}
	});
});

// Sockets
io.on('connection', (socket) => {
	socket.on('adding', (data) => {
		if (data.userID.ID === '') return;
		userModule.allUsers(data.userID.ID);
	});

	socket.on('createRoom', () => {
		userModule.matchUsers(socket);
	});

	socket.on('send_message', ({ senderId, message, time }) => {
		socket.broadcast.emit('receive_message', { senderId, message, time });
	});
});

app.use(cors());

server.listen(HTTP_PORT, () => {
	console.log(`on port ${HTTP_PORT}`);
});
