import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { getAllBookings, createBooking, cancelBooking } from './db.js';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] },
});

// REST API
app.get('/api/bookings', (req, res) => {
  const bookings = getAllBookings();
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const booking = req.body;
  createBooking(booking);
  const bookings = getAllBookings();
  io.emit('bookings', bookings);
  res.json({ ok: true });
});

app.patch('/api/bookings/:id/cancel', (req, res) => {
  cancelBooking(req.params.id);
  const bookings = getAllBookings();
  io.emit('bookings', bookings);
  res.json({ ok: true });
});

// Socket.io real-time
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('bookings', getAllBookings());

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
