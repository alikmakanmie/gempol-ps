import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '..', 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    bookingId TEXT UNIQUE,
    customerName TEXT,
    phone TEXT,
    roomId TEXT,
    roomName TEXT,
    roomCategory TEXT,
    roomIcon TEXT,
    date TEXT,
    timeSlots TEXT,
    duration INTEGER,
    totalPrice INTEGER,
    status TEXT DEFAULT 'pending',
    createdAt TEXT
  )
`);

function parseBooking(row) {
  if (!row) return null;
  return {
    ...row,
    timeSlots: JSON.parse(row.timeSlots || '[]'),
  };
}

export function getAllBookings() {
  const rows = db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all();
  return rows.map(parseBooking);
}

export function createBooking(booking) {
  const stmt = db.prepare(`
    INSERT INTO bookings (id, bookingId, customerName, phone, roomId, roomName, roomCategory, roomIcon, date, timeSlots, duration, totalPrice, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    booking.id || null,
    booking.bookingId || booking.id,
    booking.customerName,
    booking.phone,
    booking.roomId,
    booking.roomName,
    booking.roomCategory,
    booking.roomIcon,
    booking.date,
    JSON.stringify(booking.timeSlots),
    booking.duration,
    booking.totalPrice,
    booking.status || 'confirmed',
    booking.createdAt || new Date().toISOString()
  );
}

export function cancelBooking(bookingId) {
  const stmt = db.prepare('UPDATE bookings SET status = ? WHERE bookingId = ?');
  stmt.run('cancelled', bookingId);
}
