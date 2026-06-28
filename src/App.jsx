import { useState, useEffect } from 'react';
import { subscribeBookings, createBooking, cancelBooking as cancelBookingDb } from './db';
import './App.css';

const MY_QRIS_IMAGE_URL = "/my-qris.jpeg";

// ========== STATIC DATA (ROOMS & TYPES) ==========
const ROOMS = [
  { id: 'vvip-1', name: 'ROOM 1', category: 'VVIP', pricePerHour: 25000, icon: '👑', description: 'Ruangan VVIP Privat dengan PS5 Pro + Layar QLED 4K 65"', available: true },
  { id: 'vvip-2', name: 'ROOM 2', category: 'VVIP', pricePerHour: 25000, icon: '👑', description: 'Ruangan VVIP Privat dengan PS5 Pro + Layar QLED 4K 65"', available: true },
  { id: 'vip-1', name: 'ROOM 1', category: 'VIP', pricePerHour: 20000, icon: '🕹️', description: 'Ruangan VIP Semi-Privat dengan PS5 Slim + Monitor Gaming 120Hz', available: true },
  { id: 'vip-2', name: 'ROOM 2', category: 'VIP', pricePerHour: 20000, icon: '🕹️', description: 'Ruangan VIP Semi-Privat dengan PS5 Slim + Monitor Gaming 120Hz', available: true },
  { id: 'vip-3', name: 'ROOM 3', category: 'VIP', pricePerHour: 20000, icon: '🕹️', description: 'Ruangan VIP Semi-Privat dengan PS5 Slim + Monitor Gaming 120Hz', available: true },
  { id: 'vip-4', name: 'ROOM 4', category: 'VIP', pricePerHour: 20000, icon: '🕹️', description: 'Ruangan VIP Semi-Privat dengan PS5 Slim + Monitor Gaming 120Hz', available: true },
  { id: 'reguler-1', name: 'ROOM 1', category: 'REGULER', pricePerHour: 15000, icon: '🎮', description: 'Area Reguler Open-Space dengan PS4 Pro + TV LED 43"', available: true },
  { id: 'reguler-2', name: 'ROOM 2', category: 'REGULER', pricePerHour: 15000, icon: '🎮', description: 'Area Reguler Open-Space dengan PS4 Pro + TV LED 43"', available: true },
];

const TIME_SLOTS = [
  "09.00 - 10.00",
  "10.00 - 11.00",
  "11.00 - 12.00",
  "12.00 - 13.00",
  "13.00 - 14.00",
  "14.00 - 15.00",
  "15.00 - 16.00",
  "16.00 - 17.00",
  "17.00 - 18.00",
  "18.00 - 19.00",
  "19.00 - 20.00",
  "20.00 - 21.00",
  "21.00 - 22.00",
  "22.00 - 23.00",
  "23.00 - 00.00",
  "00.00 - 01.00",
  "01.00 - 02.00"
];

// ========== DATE HELPER ==========
const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export default function App() {
  // ========== STATES ==========
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [pendingBooking, setPendingBooking] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  
  const [date, setDate] = useState(getTodayStr());
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Admin
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [adminAuthed, setAdminAuthed] = useState(false);

  // UI States
  const [toasts, setToasts] = useState([]);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('hero');
  const [particles, setParticles] = useState([]);

  // ========== FIRESTORE REAL-TIME SYNC ==========
  useEffect(() => {
    const unsub = subscribeBookings((data) => {
      setBookings(data);
    });
    return () => unsub();
  }, []);

  // ========== QRIS COUNTDOWN TIMER ==========
  useEffect(() => {
    if (!pendingBooking) return;

    if (timeLeft <= 0) {
      addToast('Waktu pembayaran QRIS habis. Booking dibatalkan.', 'error');
      setPendingBooking(null);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingBooking, timeLeft]);

  // ========== GENERATE PARTICLES ==========
  useEffect(() => {
    const particleList = [];
    const colors = ['var(--cyan)', 'var(--purple)', 'var(--pink)'];
    for (let i = 0; i < 30; i++) {
      const size = Math.random() * 4 + 1;
      particleList.push({
        id: i,
        size,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 10,
      });
    }
    setParticles(particleList);
  }, []);

  // ========== NAVBAR SCROLL & ACTIVE LINK ==========
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 50);

      const sections = ['hero', 'consoles', 'booking', 'my-bookings'];
      const scrollY = window.scrollY + 120;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveNav(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ========== INTERSECTION OBSERVER FOR REVEALS ==========
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [bookings]);

  // ========== HELPER UTILS ==========
  const formatCurrency = (amount) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
  };

  const getMaxDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const formatDate = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', options);
  };

  // ========== FIND BOOKING FOR SPECIFIC CELL ==========
  const getBookingForCell = (roomId, timeSlot) => {
    return bookings.find(b =>
      b.roomId === roomId &&
      b.date === date &&
      b.timeSlots.includes(timeSlot) &&
      b.status !== 'cancelled'
    );
  };

  // ========== TOAST SYSTEM ==========
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3000);
  };

  // ========== CELL CLICK HANDLER ==========
  const handleCellClick = (room, timeSlot, booking) => {
    if (booking) return; // Slot already booked

    // Check if slot time is in the past for today
    const now = new Date();
    const selectedDate = new Date(date + 'T00:00:00');
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    // Parse time range start e.g. "09.00" -> 9
    const startHourStr = timeSlot.split(' - ')[0];
    const startHour = parseInt(startHourStr.split('.')[0]);
    if (isToday && startHour <= now.getHours()) {
      addToast('Waktu ini sudah terlewat', 'error');
      return;
    }

    // Reset slot selection if switching to a different room
    if (selectedRoom?.id !== room.id) {
      setSelectedRoom(room);
      setSelectedSlots([timeSlot]);
      addToast(`Memilih ${room.category} - ${room.name}`, 'info');
      return;
    }

    // Add or remove slot for the same room
    let newSlots = [...selectedSlots];
    const idx = newSlots.indexOf(timeSlot);

    if (idx > -1) {
      newSlots.splice(idx, 1);
    } else {
      newSlots.push(timeSlot);
      // Sort slots by index in TIME_SLOTS to keep chronological order
      newSlots.sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));
    }

    // Verify consecutive selection
    if (newSlots.length > 1) {
      const indices = newSlots.map(s => TIME_SLOTS.indexOf(s));
      const isConsecutive = indices.every((val, i) => i === 0 || val === indices[i - 1] + 1);
      if (!isConsecutive) {
        newSlots = [timeSlot];
        addToast('Pilih slot jam yang berurutan', 'info');
      }
    }

    setSelectedSlots(newSlots);
  };

  // ========== BOOKING SUBMISSION ==========
  const handleSubmitBooking = (e) => {
    e.preventDefault();
    setNameError('');
    setPhoneError('');

    if (!selectedRoom) {
      addToast('Klik slot "Available" di tabel jadwal terlebih dahulu!', 'error');
      return;
    }
    if (selectedSlots.length === 0) {
      addToast('Pilih minimal 1 slot jam!', 'error');
      return;
    }

    let hasError = false;
    if (!customerName.trim() || customerName.trim().length < 3) {
      setNameError('Nama minimal 3 karakter');
      hasError = true;
    }
    if (!customerPhone.trim() || !/^[0-9]{10,13}$/.test(customerPhone.trim())) {
      setPhoneError('Nomor HP harus 10-13 digit');
      hasError = true;
    }

    if (hasError) return;

    // Check double-booking conflicts just in case
    for (const slot of selectedSlots) {
      if (getBookingForCell(selectedRoom.id, slot)) {
        addToast('Beberapa slot yang Anda pilih sudah terisi!', 'error');
        return;
      }
    }

    setIsLoading(true);

    setTimeout(() => {
      const duration = selectedSlots.length;
      const total = duration * selectedRoom.pricePerHour;
      const bookingId = 'BK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

      const newBooking = {
        id: bookingId,
        customerName: customerName.trim().toUpperCase(),
        phone: customerPhone.trim(),
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        roomCategory: selectedRoom.category,
        roomIcon: selectedRoom.icon,
        date,
        timeSlots: [...selectedSlots],
        duration,
        totalPrice: total,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      setPendingBooking(newBooking);
      setTimeLeft(300); // 5 minutes timer
      addToast('QRIS Code berhasil dibuat', 'success');
      setIsLoading(false);
    }, 1000);
  };

  const handleConfirmPayment = async () => {
    if (!pendingBooking) return;

    const confirmedBooking = {
      ...pendingBooking,
      status: 'confirmed'
    };

    await createBooking(confirmedBooking);
    setPendingBooking(null);
    addToast('Pembayaran QRIS Sukses! Booking dikonfirmasi.', 'success');

    // Reset Form and Selection
    setCustomerName('');
    setCustomerPhone('');
    setSelectedSlots([]);
    setSelectedRoom(null);
  };

  const handleCancelPayment = () => {
    setPendingBooking(null);
    addToast('Pemesanan dibatalkan.', 'info');
  };

  const handleCancelBooking = async (id) => {
    if (!confirm('Yakin ingin membatalkan booking ini?')) return;
    await cancelBookingDb(id);
    addToast('Booking telah dibatalkan', 'info');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPass === 'admin123') {
      setAdminAuthed(true);
      setAdminPass('');
    } else {
      addToast('Password admin salah!', 'error');
    }
  };

  const handleAdminLogout = () => {
    setAdminAuthed(false);
    setShowAdmin(false);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const activeBookingsCount = bookings.filter(b => b.status === 'confirmed').length;

  // ========== ADMIN DASHBOARD ==========
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const revenueByCategory = {};
  confirmedBookings.forEach(b => {
    revenueByCategory[b.roomCategory] = (revenueByCategory[b.roomCategory] || 0) + b.totalPrice;
  });

  const formatDateShort = (str) => {
    const d = new Date(str);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const dailyRevenue = {};
  [...bookings].reverse().forEach(b => {
    if (!dailyRevenue[b.date]) {
      dailyRevenue[b.date] = { date: b.date, confirmed: 0, cancelled: 0, revenue: 0, vvip: 0, vip: 0, reguler: 0 };
    }
    if (b.status === 'confirmed') {
      dailyRevenue[b.date].confirmed += 1;
      dailyRevenue[b.date].revenue += b.totalPrice;
      if (b.roomCategory === 'VVIP') dailyRevenue[b.date].vvip += b.totalPrice;
      else if (b.roomCategory === 'VIP') dailyRevenue[b.date].vip += b.totalPrice;
      else if (b.roomCategory === 'REGULER') dailyRevenue[b.date].reguler += b.totalPrice;
    } else if (b.status === 'cancelled') {
      dailyRevenue[b.date].cancelled += 1;
    }
  });
  const dailyRevenueList = Object.values(dailyRevenue).sort((a, b) => a.date.localeCompare(b.date));

  const handleExportExcel = () => {
    const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

    const totalRev = dailyRevenueList.reduce((s, d) => s + d.revenue, 0);
    const totalConfirmed = dailyRevenueList.reduce((s, d) => s + d.confirmed, 0);
    const totalCancelled = dailyRevenueList.reduce((s, d) => s + d.cancelled, 0);
    const totalVvip = dailyRevenueList.reduce((s, d) => s + d.vvip, 0);
    const totalVip = dailyRevenueList.reduce((s, d) => s + d.vip, 0);
    const totalReguler = dailyRevenueList.reduce((s, d) => s + d.reguler, 0);
    const maxDailyRev = Math.max(...dailyRevenueList.map(d => d.revenue), 1);

    const pct = (n) => totalRev ? ((n / totalRev) * 100).toFixed(1) : '0.0';
    const barWidth = (n) => totalRev ? Math.max((n / totalRev) * 100, 1) : 1;

    const escHtml = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

    const dailyRows = dailyRevenueList.map(d => {
      const barPct = maxDailyRev ? (d.revenue / maxDailyRev) * 100 : 0;
      return `
      <tr>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px">${escHtml(formatDateShort(d.date))}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:right;font-weight:700;color:#006100">${formatRp(d.revenue)}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:right">${pct(d.revenue)}%</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:center">${d.confirmed}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:right;color:#006100">${d.vvip ? formatRp(d.vvip) : '-'}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:right;color:#006100">${d.vip ? formatRp(d.vip) : '-'}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:right;color:#006100">${d.reguler ? formatRp(d.reguler) : '-'}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:center">${d.cancelled || '-'}</td>
        <td style="padding:0;border:1px solid #ccc;width:140px"><div style="height:18px;width:${barPct}%;background:linear-gradient(90deg,#00b863,#00d4ff);border-radius:0 3px 3px 0;min-width:4px"></div></td>
      </tr>
    `}).join('');

    const detailRows = [...bookings].reverse().map(b => {
      const statusColor = b.status === 'confirmed' ? '#006100' : b.status === 'cancelled' ? '#9c0006' : '#666';
      const statusBg = b.status === 'confirmed' ? '#c6efce' : b.status === 'cancelled' ? '#ffc7ce' : '#f2f2f2';
      return `
      <tr>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:10px;font-family:monospace;color:#666">${escHtml(b.id)}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px">${escHtml(b.customerName)}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px">${escHtml(b.phone)}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px">[${escHtml(b.roomCategory)}] ${escHtml(b.roomName)}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px">${formatDateShort(b.date)}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:center">${b.timeSlots[0].split(' - ')[0]}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:center">${b.duration} jam</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:right;font-weight:700;color:#006100">${formatRp(b.totalPrice)}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:11px;text-align:center;font-weight:700;color:${statusColor};background:${statusBg}">${b.status === 'confirmed' ? 'Dikonfirmasi' : b.status === 'cancelled' ? 'Dibatalkan' : 'Pending'}</td>
        <td style="padding:6px 10px;border:1px solid #ccc;font-size:10px;color:#666">${new Date(b.createdAt).toLocaleString('id-ID')}</td>
      </tr>
    `}).join('');

    const periodText = dailyRevenueList.length > 0
      ? `${formatDateShort(dailyRevenueList[0].date)} — ${formatDateShort(dailyRevenueList[dailyRevenueList.length - 1].date)}`
      : '-';

    const now = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const catColors = { VVIP: '#e8b840', VIP: '#00d4ff', REGULER: '#b840e8' };
    const catList = ['VVIP', 'VIP', 'REGULER'];
    const catData = catList.map(c => ({
      name: c,
      rev: c === 'VVIP' ? totalVvip : c === 'VIP' ? totalVip : totalReguler,
      color: catColors[c],
      pct: pct(c === 'VVIP' ? totalVvip : c === 'VIP' ? totalVip : totalReguler),
    }));

    // Build pie conic-gradient
    let angle = 0;
    const pieStops = catData.filter(c => c.rev > 0).map(c => {
      const deg = (c.rev / totalRev) * 360;
      const start = angle;
      angle += deg;
      return `${c.color} ${start}deg ${angle}deg`;
    });
    const pieGradient = pieStops.length ? `conic-gradient(${pieStops.join(', ')})` : '#ddd';

    // Legend & percentage bars
    const catLegend = catData.map(c => `
      <tr>
        <td style="padding:4px 8px;font-size:11px"><span style="display:inline-block;width:12px;height:12px;background:${c.color};border-radius:3px;vertical-align:middle;margin-right:6px"></span>${c.name}</td>
        <td style="padding:4px 8px;font-size:11px;text-align:right;font-weight:700;color:#006100">${formatRp(c.rev)}</td>
        <td style="padding:4px 8px;font-size:11px;text-align:center;font-weight:700">${c.pct}%</td>
        <td style="padding:2px 8px;width:180px"><div style="height:14px;width:${barWidth(c.rev)}%;background:${c.color};border-radius:3px;min-width:4px"></div></td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Laporan Keuangan Gempol PS</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 20px; color: #1a1a2e; }
  table { width: 100%; max-width: 960px; margin: 0 auto; border-collapse: collapse; }
  td { vertical-align: middle; }
</style>
</head>
<body>
  <table>

    <!-- TITLE -->
    <tr><td colspan="9" style="padding:16px 12px;background:#1a1a2e;color:#fff;font-size:18px;font-weight:700;text-align:center;border:1px solid #1a1a2e">
      LAPORAN KEUANGAN GEMPOL PLAYSTATION
    </td></tr>
    <tr><td colspan="9" style="padding:6px 12px;background:#1a1a2e;color:#aaa;font-size:10px;text-align:center;border:1px solid #1a1a2e">
      Periode: ${escHtml(periodText)} &nbsp;|&nbsp; Dicetak: ${escHtml(now)}
    </td></tr>

    <!-- KEY METRICS -->
    <tr><td colspan="9" style="padding:10px 0 0"></td></tr>
    <tr>
      <td colspan="3" style="padding:8px 12px;background:#0f3460;color:#fff;font-size:10px;font-weight:700;text-align:center;border:1px solid #0f3460">Total Pendapatan</td>
      <td colspan="2" style="padding:8px 12px;background:#0f3460;color:#fff;font-size:10px;font-weight:700;text-align:center;border:1px solid #0f3460">Booking Dikonfirmasi</td>
      <td style="padding:8px 12px;background:#0f3460;color:#fff;font-size:10px;font-weight:700;text-align:center;border:1px solid #0f3460">Dibatalkan</td>
      <td colspan="3" style="padding:8px 12px;background:#0f3460;color:#fff;font-size:10px;font-weight:700;text-align:center;border:1px solid #0f3460">Rata-rata per Hari</td>
    </tr>
    <tr>
      <td colspan="3" style="padding:10px 12px;font-size:14px;font-weight:700;text-align:center;border:1px solid #ccc;background:#eef5ff">${formatRp(totalRev)}</td>
      <td colspan="2" style="padding:10px 12px;font-size:14px;font-weight:700;text-align:center;border:1px solid #ccc;background:#eef5ff">${totalConfirmed}</td>
      <td style="padding:10px 12px;font-size:14px;font-weight:700;text-align:center;border:1px solid #ccc;background:#eef5ff">${totalCancelled}</td>
      <td colspan="3" style="padding:10px 12px;font-size:14px;font-weight:700;text-align:center;border:1px solid #ccc;background:#eef5ff">${formatRp(dailyRevenueList.length ? Math.round(totalRev / dailyRevenueList.length) : 0)}</td>
    </tr>

    <!-- PIE CHART + CATEGORY BREAKDOWN -->
    <tr><td colspan="9" style="padding:20px 0 6px;font-size:14px;font-weight:700;color:#1a1a2e">DISTRIBUSI PENDAPATAN PER KATEGORI</td></tr>
    <tr>
      <td colspan="3" style="padding:12px;text-align:center;border:1px solid #ccc;background:#fafafa">
        <div style="width:130px;height:130px;border-radius:50%;background:${pieGradient};margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.15)"></div>
        <div style="margin-top:6px;font-size:10px;color:#666">Total: ${formatRp(totalRev)}</div>
      </td>
      <td colspan="6" style="padding:12px;border:1px solid #ccc;background:#fafafa">
        <table style="width:100%">
          <tr>
            <td style="padding:4px 8px;font-size:10px;color:#666;font-weight:700">Kategori</td>
            <td style="padding:4px 8px;font-size:10px;color:#666;font-weight:700;text-align:right">Revenue</td>
            <td style="padding:4px 8px;font-size:10px;color:#666;font-weight:700;text-align:center">%</td>
            <td style="padding:4px 8px;font-size:10px;color:#666;font-weight:700;text-align:center">Visual</td>
          </tr>
          ${catLegend}
        </table>
      </td>
    </tr>

    <!-- DAILY REVENUE TABLE -->
    <tr><td colspan="9" style="padding:20px 0 6px;font-size:14px;font-weight:700;color:#1a1a2e">REKAP PENDAPATAN HARIAN</td></tr>
    <tr>
      ${['Tanggal', 'Revenue', '% Total', 'Confirmed', 'VVIP', 'VIP', 'REGULER', 'Dibatalkan', 'Tren'].map(h =>
        `<td style="padding:8px 10px;background:#16213e;color:#fff;font-size:11px;font-weight:700;text-align:center;border:1px solid #16213e">${h}</td>`
      ).join('')}
    </tr>
    ${dailyRows}
    <tr>
      <td style="padding:8px 10px;border:1px solid #0f3460;background:#0f3460;color:#fff;font-size:11px;font-weight:700">TOTAL</td>
      <td style="padding:8px 10px;border:1px solid #0f3460;background:#0f3460;color:#fff;font-size:12px;font-weight:700;text-align:right">${formatRp(totalRev)}</td>
      <td style="padding:8px 10px;border:1px solid #0f3460;background:#0f3460;color:#fff;font-size:11px;font-weight:700;text-align:center">100%</td>
      <td style="padding:8px 10px;border:1px solid #0f3460;background:#0f3460;color:#fff;font-size:11px;font-weight:700;text-align:center">${totalConfirmed}</td>
      <td style="padding:8px 10px;border:1px solid #0f3460;background:#0f3460;color:#fff;font-size:12px;font-weight:700;text-align:right">${formatRp(totalVvip)}</td>
      <td style="padding:8px 10px;border:1px solid #0f3460;background:#0f3460;color:#fff;font-size:12px;font-weight:700;text-align:right">${formatRp(totalVip)}</td>
      <td style="padding:8px 10px;border:1px solid #0f3460;background:#0f3460;color:#fff;font-size:12px;font-weight:700;text-align:right">${formatRp(totalReguler)}</td>
      <td style="padding:8px 10px;border:1px solid #0f3460;background:#0f3460;color:#fff;font-size:11px;font-weight:700;text-align:center">${totalCancelled}</td>
      <td style="padding:8px 10px;border:1px solid #0f3460;background:#0f3460;color:#fff;font-size:11px;font-weight:700;text-align:center">-</td>
    </tr>

    <!-- DETAIL BOOKING -->
    <tr><td colspan="10" style="padding:20px 0 6px;font-size:14px;font-weight:700;color:#1a1a2e">DETAIL SELURUH BOOKING</td></tr>
    <tr>
      ${['ID Booking', 'Nama Pemesan', 'WhatsApp', 'Room', 'Tanggal Main', 'Jam Mulai', 'Durasi', 'Total Bayar', 'Status', 'Dibuat Pada'].map(h =>
        `<td style="padding:8px 10px;background:#16213e;color:#fff;font-size:11px;font-weight:700;text-align:center;border:1px solid #16213e">${h}</td>`
      ).join('')}
    </tr>
    ${detailRows}
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-keuangan-gempolps-${getTodayStr()}.xls`;
    a.click();
    URL.revokeObjectURL(url);

    addToast('File Excel berhasil di-download!', 'success');
  };

  if (showAdmin) {
    return (
      <>
        {!adminAuthed ? (
          <div className="admin-login-wrapper">
            <div className="admin-login-card">
              <div className="admin-login-icon">🔐</div>
              <h2>Admin Panel</h2>
              <p>Masukkan password untuk melanjutkan</p>
              <form onSubmit={handleAdminLogin}>
                <input
                  type="password"
                  className="admin-login-input"
                  placeholder="Password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="admin-login-btn">Masuk</button>
              </form>
              <button className="admin-back-btn" onClick={() => setShowAdmin(false)}>Kembali ke Website</button>
            </div>
          </div>
        ) : (
          <div className="admin-dashboard">
            <div className="admin-header">
              <h1>📊 Admin Dashboard</h1>
              <button className="admin-logout-btn" onClick={handleAdminLogout}>Keluar</button>
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card revenue">
                <div className="admin-stat-label">Total Pendapatan</div>
                <div className="admin-stat-value">{formatCurrency(totalRevenue)}</div>
              </div>
              <div className="admin-stat-card confirmed">
                <div className="admin-stat-label">Booking Dikonfirmasi</div>
                <div className="admin-stat-value">{confirmedBookings.length}</div>
              </div>
              <div className="admin-stat-card cancelled">
                <div className="admin-stat-label">Booking Dibatalkan</div>
                <div className="admin-stat-value">{cancelledBookings.length}</div>
              </div>
            </div>

            <div className="admin-section">
              <h3>Pendapatan per Kategori</h3>
              <div className="admin-category-grid">
                {['VVIP', 'VIP', 'REGULER'].map(cat => (
                  <div key={cat} className="admin-category-card" style={{
                    borderTop: `3px solid ${cat === 'VVIP' ? 'var(--vvip-color)' : cat === 'VIP' ? 'var(--cyan)' : 'var(--reguler-color)'}`
                  }}>
                    <div className="admin-cat-name">{cat}</div>
                    <div className="admin-cat-value">{formatCurrency(revenueByCategory[cat] || 0)}</div>
                    <div className="admin-cat-count">{confirmedBookings.filter(b => b.roomCategory === cat).length} booking</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-section">
              <div className="admin-section-header">
                <h3>Rekap Pendapatan Harian</h3>
                <button className="admin-export-btn" onClick={handleExportExcel}>
                  📥 Export Excel
                </button>
              </div>
              {dailyRevenueList.length === 0 ? (
                <p className="admin-empty">Belum ada data transaksi.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Revenue</th>
                        <th>Confirmed</th>
                        <th>VVIP</th>
                        <th>VIP</th>
                        <th>REGULER</th>
                        <th>Dibatalkan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRevenueList.map(d => (
                        <tr key={d.date}>
                          <td>{formatDateShort(d.date)}</td>
                          <td className="admin-cell-price">{formatCurrency(d.revenue)}</td>
                          <td>{d.confirmed}</td>
                          <td>{d.vvip > 0 ? formatCurrency(d.vvip) : '-'}</td>
                          <td>{d.vip > 0 ? formatCurrency(d.vip) : '-'}</td>
                          <td>{d.reguler > 0 ? formatCurrency(d.reguler) : '-'}</td>
                          <td>{d.cancelled || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td><strong>Total</strong></td>
                        <td className="admin-cell-price"><strong>{formatCurrency(dailyRevenueList.reduce((s, d) => s + d.revenue, 0))}</strong></td>
                        <td><strong>{dailyRevenueList.reduce((s, d) => s + d.confirmed, 0)}</strong></td>
                        <td><strong>{formatCurrency(dailyRevenueList.reduce((s, d) => s + d.vvip, 0))}</strong></td>
                        <td><strong>{formatCurrency(dailyRevenueList.reduce((s, d) => s + d.vip, 0))}</strong></td>
                        <td><strong>{formatCurrency(dailyRevenueList.reduce((s, d) => s + d.reguler, 0))}</strong></td>
                        <td><strong>{dailyRevenueList.reduce((s, d) => s + d.cancelled, 0)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-section">
              <h3>Riwayat Booking</h3>
              {bookings.length === 0 ? (
                <p className="admin-empty">Belum ada data booking.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Pemesan</th>
                        <th>Room</th>
                        <th>Tanggal</th>
                        <th>Jam</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...bookings].reverse().map(b => (
                        <tr key={b.id}>
                          <td className="admin-cell-id">{b.id}</td>
                          <td>{b.customerName}<br /><small>{b.phone}</small></td>
                          <td>[{b.roomCategory}] {b.roomName}</td>
                          <td>{formatDateShort(b.date)}</td>
                          <td>{b.timeSlots[0].split(' - ')[0]}</td>
                          <td className="admin-cell-price">{formatCurrency(b.totalPrice)}</td>
                          <td>
                            <span className={`status-badge ${b.status}`}>
                              {b.status === 'confirmed' ? 'Dikonfirmasi' : b.status === 'cancelled' ? 'Dibatalkan' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            {b.status === 'confirmed' && (
                              <button className="admin-btn-cancel" onClick={() => handleCancelBooking(b.id)}>
                                Batalkan
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <div id="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type} ${t.removing ? 'removing' : ''}`}>
              <span className="toast-icon">
                {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* ========== NAVBAR ========== */}
      <nav id="navbar" className={navScrolled ? 'scrolled' : ''}>
        <div className="nav-container">
          <a onClick={() => scrollToSection('hero')} className="nav-logo" style={{ cursor: 'pointer' }}>
            <span className="logo-icon">🎮</span>
            <span className="logo-text">GEMPOL PS</span>
          </a>

          <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <li><a onClick={() => scrollToSection('hero')} className={activeNav === 'hero' ? 'active' : ''} style={{ cursor: 'pointer' }}>Beranda</a></li>
            <li><a onClick={() => scrollToSection('consoles')} className={activeNav === 'consoles' ? 'active' : ''} style={{ cursor: 'pointer' }}>Fasilitas</a></li>
            <li><a onClick={() => scrollToSection('booking')} className={activeNav === 'booking' ? 'active' : ''} style={{ cursor: 'pointer' }}>Jadwal & Booking</a></li>
            <li><a onClick={() => scrollToSection('my-bookings')} className={activeNav === 'my-bookings' ? 'active' : ''} style={{ cursor: 'pointer' }}>Booking Saya</a></li>
          </ul>

          <button className="nav-booking" onClick={() => scrollToSection('booking')}>
            📅 Cek Jadwal
            {activeBookingsCount > 0 && <span id="booking-badge">{activeBookingsCount}</span>}
          </button>

          <button className={`nav-toggle ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section id="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid-overlay"></div>
        <div id="particles">
          {particles.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                left: `${p.left}%`,
                bottom: '-10px',
                background: p.color,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                boxShadow: `0 0 ${p.size * 2}px currentColor`,
              }}
            ></div>
          ))}
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Gempol Playstation Jogja — 09:00 s/d 02:00
          </div>

          <h1 className="hero-title">
            Portal Booking<br />
            <span className="highlight">PlayStation Jogja</span><br />
            Online & Real-time
          </h1>

          <p className="hero-description">
            Lihat ketersediaan room secara real-time, pilih jadwal bermain favoritmu, 
            dan amankan slot konsolmu secara langsung dari website ini. Anti antre!
          </p>

          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => scrollToSection('booking')}>
              🕒 Cek Jadwal & Booking
            </button>
            <button className="btn btn-secondary" onClick={() => scrollToSection('consoles')}>
              🕹️ Info Fasilitas Room
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">2 VVIP</div>
              <div className="stat-label">Room Private PS5 Pro</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">4 VIP</div>
              <div className="stat-label">Room Semi-Private PS5</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">2 REGULER</div>
              <div className="stat-label">Area Open-Space PS4 Pro</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">⭐ 4.9</div>
              <div className="stat-label">Google Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CONSOLES / FACILITIES SECTION ========== */}
      <section id="consoles" className="reveal">
        <div className="container">
          <h2 className="section-title">Pilihan Room Kami</h2>
          <p className="section-subtitle">Fasilitas gaming terbaik yang didesain khusus untuk kenyamanan Anda</p>
          <div id="console-grid">
            <div className="console-card vvip">
              <span className="card-status available">👑 Best Experience</span>
              <span className="card-icon">👑</span>
              <div className="card-type">VVIP CLASS (ROOM 1 & 2)</div>
              <h3 className="card-name">Room VVIP Private</h3>
              <p className="card-desc">Ruangan privat ber-AC dengan Sofa mewah, PS5 Pro terbaru, TV QLED 4K 65", serta audio bar imersif.</p>
              <div className="card-price">
                <span className="amount">Rp 25.000</span>
                <span className="period">/ jam</span>
              </div>
            </div>
            <div className="console-card vip">
              <span className="card-status available">🕹️ Most Popular</span>
              <span className="card-icon">🕹️</span>
              <div className="card-type">VIP CLASS (ROOM 1 - 4)</div>
              <h3 className="card-name">Room VIP Semi-Private</h3>
              <p className="card-desc">Partisi sekat antar room ber-AC, Sofa empuk, PS5 Slim, dan Monitor Gaming HDR 120Hz super responsif.</p>
              <div className="card-price">
                <span className="amount">Rp 20.000</span>
                <span className="period">/ jam</span>
              </div>
            </div>
            <div className="console-card reguler">
              <span className="card-status available">🎮 Budget Friendly</span>
              <span className="card-icon">🎮</span>
              <div className="card-type">REGULER CLASS (ROOM 1 & 2)</div>
              <h3 className="card-name">Reguler Area</h3>
              <p className="card-desc">Area open-space yang luas dengan bean bag, PS4 Pro, koleksi ratusan game, dan TV LED FHD 43".</p>
              <div className="card-price">
                <span className="amount">Rp 15.000</span>
                <span className="period">/ jam</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== BOOKING SECTION (WITH SCHEDULE MATRIX TABLE) ========== */}
      <section id="booking" className="reveal">
        <div className="container">
          <h2 className="section-title">Jadwal & Ketersediaan Room</h2>
          <p className="section-subtitle">Klik slot "Available" pada tabel untuk memilih jadwal & room yang ingin dibooking</p>

          <div className="booking-container">
            <div className="booking-card">
              
              {/* Date Selection */}
              <div className="date-picker-group">
                <label htmlFor="booking-date">📅 Tanggal Main:</label>
                <input
                  type="date"
                  id="booking-date"
                  className="date-picker-input"
                  min={getTodayStr()}
                  max={getMaxDateStr()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSelectedSlots([]);
                    setSelectedRoom(null);
                  }}
                />
              </div>

              {/* Schedule Grid Table */}
              <div className="booking-section-title">🗓️ Schedule Availability Matrix</div>
              
              <div className="schedule-grid-wrapper">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th rowSpan="2" className="th-jam">JAM</th>
                      <th colSpan="2" className="th-vvip-cat">2 VVIP</th>
                      <th colSpan="4" className="th-vip-cat">4 VIP</th>
                      <th colSpan="2" className="th-reguler-cat">2 REGULER</th>
                    </tr>
                    <tr>
                      <th className="th-room">ROOM 1</th>
                      <th className="th-room">ROOM 2</th>
                      <th className="th-room">ROOM 1</th>
                      <th className="th-room">ROOM 2</th>
                      <th className="th-room">ROOM 3</th>
                      <th className="th-room">ROOM 4</th>
                      <th className="th-room">ROOM 1</th>
                      <th className="th-room">ROOM 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((timeSlot) => (
                      <tr key={timeSlot}>
                        <td className="td-time">{timeSlot}</td>
                        {ROOMS.map((room) => {
                          const booking = getBookingForCell(room.id, timeSlot);
                          const isSelected = selectedRoom?.id === room.id && selectedSlots.includes(timeSlot);
                          
                          let badgeClass = 'slot-badge';
                          let label = 'Available';

                          if (booking) {
                            badgeClass += ' booked';
                            label = booking.customerName;
                          } else if (isSelected) {
                            badgeClass += ' selected';
                            label = 'Selected';
                          } else {
                            badgeClass += ' available';
                          }

                          return (
                            <td key={room.id} className="slot-cell">
                              <span
                                className={badgeClass}
                                onClick={() => handleCellClick(room, timeSlot, booking)}
                              >
                                {label}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Booking Summary */}
              {selectedRoom && selectedSlots.length > 0 && (
                <div className="booking-summary show">
                  <div className="summary-row">
                    <span className="label">Room Dipilih:</span>
                    <span className="value" style={{ color: selectedRoom.category === 'VVIP' ? 'var(--vvip-color)' : selectedRoom.category === 'VIP' ? 'var(--cyan)' : 'var(--reguler-color)' }}>
                      [{selectedRoom.category}] {selectedRoom.name}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Jam Main:</span>
                    <span className="value">
                      {selectedSlots[0].split(' - ')[0]} s/d {selectedSlots[selectedSlots.length - 1].split(' - ')[1]}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Durasi Main:</span>
                    <span className="value">{selectedSlots.length} jam</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Tarif Room:</span>
                    <span className="value">{formatCurrency(selectedRoom.pricePerHour)} / jam</span>
                  </div>
                  <div className="summary-row total">
                    <span className="label">Total Pembayaran:</span>
                    <span className="value">
                      {formatCurrency(selectedSlots.length * selectedRoom.pricePerHour)}
                    </span>
                  </div>
                </div>
              )}

              {/* Booking Data Form */}
              <form onSubmit={handleSubmitBooking}>
                <div className="booking-section-title">👤 Lengkapi Formulir Pemesanan</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="customer-name">Nama Pemesan</label>
                    <input
                      type="text"
                      id="customer-name"
                      className="form-input"
                      placeholder="Contoh: RIZA / VAN / BAGAS"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      autoComplete="name"
                    />
                    <div className={`form-error ${nameError ? 'show' : ''}`}>{nameError}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="customer-phone">Nomor Whatsapp</label>
                    <input
                      type="tel"
                      id="customer-phone"
                      className="form-input"
                      placeholder="08xxxxxxxxxx"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      autoComplete="tel"
                    />
                    <div className={`form-error ${phoneError ? 'show' : ''}`}>{phoneError}</div>
                  </div>
                </div>

                <button type="submit" className={`btn-submit ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                  <span className="btn-text">🎮 Konfirmasi Booking Jam Sekarang</span>
                  <div className="spinner"></div>
                </button>
              </form>

            </div>
          </div>
        </div>
      </section>

      {/* ========== MY BOOKINGS SECTION ========== */}
      <section id="my-bookings" className="reveal">
        <div className="container">
          <h2 className="section-title">Daftar Booking Saya</h2>
          <p className="section-subtitle">Kelola dan lihat rincian riwayat reservasi room PlayStation Anda</p>
          <div className="bookings-container">
            <div id="bookings-list">
              {bookings.length === 0 ? (
                <div className="empty-bookings">
                  <div className="empty-icon">📋</div>
                  <p>Belum ada riwayat booking Anda.</p>
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="booking-item">
                    <span className="item-icon">{b.roomCategory === 'VVIP' ? '👑' : b.roomCategory === 'VIP' ? '🕹️' : '🎮'}</span>
                    <div className="item-details">
                      <div className="item-name" style={{ color: b.roomCategory === 'VVIP' ? 'var(--vvip-color)' : b.roomCategory === 'VIP' ? 'var(--cyan)' : 'var(--reguler-color)' }}>
                        {b.roomCategory} Class — {b.roomName}
                      </div>
                      <div className="item-info">
                        <span>👤 {b.customerName}</span>
                        <span>📅 {formatDate(b.date)}</span>
                        <span>🕐 {b.timeSlots[0].split(' - ')[0]} s/d {b.timeSlots[b.timeSlots.length - 1].split(' - ')[1]}</span>
                        <span>⏱️ {b.duration} jam</span>
                      </div>
                    </div>
                    <div className="item-right">
                      <div className="item-price">{formatCurrency(b.totalPrice)}</div>
                      <span className={`status-badge ${b.status}`}>
                        {b.status === 'confirmed' ? 'Dikonfirmasi' : 'Dibatalkan'}
                      </span>
                      {b.status === 'confirmed' && !b.id.startsWith('SEED-') && (
                        <button className="btn-cancel" onClick={() => handleCancelBooking(b.id)}>
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer id="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">🎮 GEMPOL PLAYSTATION</div>
              <p>Tempat nongkrong dan rental PS ternyaman dengan pilihan room VVIP privat, VIP semi-privat, dan area reguler. Hubungi kami untuk info promo menarik.</p>
            </div>
            <div className="footer-col">
              <h4>Navigasi</h4>
              <ul>
                <li><a onClick={() => scrollToSection('hero')} style={{ cursor: 'pointer' }}>Beranda</a></li>
                <li><a onClick={() => scrollToSection('consoles')} style={{ cursor: 'pointer' }}>Fasilitas Room</a></li>
                <li><a onClick={() => scrollToSection('booking')} style={{ cursor: 'pointer' }}>Jadwal & Booking</a></li>
                <li><a onClick={() => scrollToSection('my-bookings')} style={{ cursor: 'pointer' }}>Booking Saya</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Jam Operasional</h4>
              <ul>
                <li>Setiap Hari: 09:00 - 02:00 WIB</li>
                <li>Weekend & Libur Nasional: Buka Lebih Awal</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Alamat Kontak</h4>
              <ul>
                <li>📍 Jl. Gempol Raya, Sleman, Yogyakarta</li>
                <li>📞 0812-3456-7890</li>
                <li>📧 info@gempolplaystation.id</li>
                <li>📸 @gempolplaystation.jogja</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; {new Date().getFullYear()} Gempol Playstation Jogja
            <span className="footer-admin-link" onClick={() => setShowAdmin(true)}>Admin</span>
          </div>
        </div>
      </footer>

      {/* ========== QRIS PAYMENT MODAL ========== */}
      <div id="booking-modal" className={pendingBooking ? 'show' : ''}>
        <div className="modal-overlay" onClick={handleCancelPayment}></div>
        {pendingBooking && (
          <div id="modal-content" className="qris-modal-content">
            <button className="modal-close" onClick={handleCancelPayment}>&times;</button>
            
            <div className="qris-barcode-box">
              <img 
                className="qris-barcode-img"
                src={MY_QRIS_IMAGE_URL}
                alt="QRIS"
              />
            </div>

            <div className="qris-info">
              <div className="qris-total">{formatCurrency(pendingBooking.totalPrice)}</div>
              <div className="qris-timer">
                ⏱️ {(() => {
                  const m = Math.floor(timeLeft / 60);
                  const s = timeLeft % 60;
                  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                })()}
              </div>
              <p className="qris-hint">Scan barcode untuk membayar via QRIS</p>
            </div>

            <div className="qris-actions">
              <button className="btn-qris-pay" onClick={handleConfirmPayment}>
                ✅ Konfirmasi Pembayaran
              </button>
              <button className="btn-qris-cancel" onClick={handleCancelPayment}>
                Batalkan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== TOAST NOTIFICATION CONTAINER ========== */}
      <div id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type} ${t.removing ? 'removing' : ''}`}>
            <span className="toast-icon">
              {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
