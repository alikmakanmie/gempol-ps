import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || '';

let socket;

function getSocket() {
  if (!socket) {
    socket = io(API || undefined, {
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function subscribeBookings(callback) {
  const s = getSocket();
  s.on('bookings', (data) => {
    callback(data);
  });
  return () => {
    s.off('bookings');
  };
}

export async function createBooking(booking) {
  const res = await fetch(`${API}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  return res.json();
}

export async function cancelBooking(bookingId) {
  const res = await fetch(`${API}/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
    method: 'PATCH',
  });
  return res.json();
}
