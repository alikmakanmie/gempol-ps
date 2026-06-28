import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  where,
} from 'firebase/firestore';

const BOOKINGS_COL = 'bookings';

export function subscribeBookings(callback) {
  const q = query(collection(db, BOOKINGS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((d) => {
      const data = d.data();
      return { ...data, id: data.bookingId || d.id };
    });
    callback(bookings);
  }, (err) => {
    console.error('Firestore error:', err);
  });
}

export async function createBooking(booking) {
  const docRef = await addDoc(collection(db, BOOKINGS_COL), {
    ...booking,
    bookingId: booking.id,
  });
  return docRef.id;
}

export async function cancelBooking(bookingId) {
  const q = query(collection(db, BOOKINGS_COL), where('bookingId', '==', bookingId));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    await updateDoc(doc(db, BOOKINGS_COL, snapshot.docs[0].id), { status: 'cancelled' });
  }
}
