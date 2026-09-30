import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readDB, writeDB } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// 1. MENU ENDPOINTS (CRUD & Live Stock)
// ==========================================

// Get all menu items
app.get('/api/menu', (req, res) => {
  const db = readDB();
  const { category, inStockOnly } = req.query;
  let items = db.menu;

  if (category && category !== 'all') {
    items = items.filter(item => item.category === category);
  }
  if (inStockOnly === 'true') {
    items = items.filter(item => item.inStock);
  }

  res.json({ success: true, count: items.length, data: items });
});

// Add new menu item (Admin)
app.post('/api/menu', (req, res) => {
  const { name, description, price, category, tag, image, calories, spiceOptions, availableAddons } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
  }

  const db = readDB();
  const newItem = {
    id: `dish-${Date.now()}`,
    name,
    description: description || '',
    price: parseFloat(price),
    category,
    tag: tag || 'New',
    image: image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    inStock: true,
    calories: parseInt(calories) || 450,
    rating: 5.0,
    reviewCount: 0,
    spiceOptions: spiceOptions || ['Mild', 'Medium', 'Spicy'],
    availableAddons: availableAddons || []
  };

  db.menu.unshift(newItem);
  writeDB(db);
  res.status(201).json({ success: true, message: 'Item created successfully', data: newItem });
});

// Update menu item or toggle stock (Admin)
app.put('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.menu.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  db.menu[index] = { ...db.menu[index], ...req.body };
  writeDB(db);
  res.json({ success: true, message: 'Item updated successfully', data: db.menu[index] });
});

// Delete menu item (Admin)
app.delete('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.menu.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  const deleted = db.menu.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Item removed successfully', data: deleted[0] });
});

// ==========================================
// 2. ONLINE ORDERS & CART ENDPOINTS
// ==========================================

// Get all orders (Admin or by user email)
app.get('/api/orders', (req, res) => {
  const { userEmail } = req.query;
  const db = readDB();
  let orders = db.orders;

  if (userEmail) {
    orders = orders.filter(o => o.customer?.email?.toLowerCase() === userEmail.toLowerCase());
  }

  res.json({ success: true, count: orders.length, data: orders });
});

// Validate discount promo coupon
app.post('/api/orders/validate-coupon', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

  const db = readDB();
  const coupon = db.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
  }

  if (subtotal < coupon.minOrder) {
    return res.status(400).json({
      success: false,
      message: `Coupon requires minimum order of $${coupon.minOrder.toFixed(2)}`
    });
  }

  const discountAmount = Math.min((subtotal * coupon.discountPercent) / 100, coupon.maxDiscount);
  res.json({
    success: true,
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    discountAmount: parseFloat(discountAmount.toFixed(2))
  });
});

// Place new Order
app.post('/api/orders', (req, res) => {
  const {
    orderType,
    customer,
    items,
    couponCode,
    paymentMethod,
    notes
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
  }

  if (!customer || !customer.name || !customer.phone) {
    return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
  }

  const db = readDB();
  
  // Calculate pricing
  let subtotal = 0;
  items.forEach(item => {
    let itemBasePrice = parseFloat(item.price);
    let addonsTotal = (item.addons || []).reduce((acc, curr) => acc + parseFloat(curr.price || 0), 0);
    subtotal += (itemBasePrice + addonsTotal) * (item.quantity || 1);
  });

  // Calculate discount if coupon applied
  let discount = 0;
  if (couponCode) {
    const coupon = db.coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (coupon && subtotal >= coupon.minOrder) {
      discount = Math.min((subtotal * coupon.discountPercent) / 100, coupon.maxDiscount);
    }
  }

  const tax = parseFloat(((subtotal - discount) * 0.0825).toFixed(2));
  const deliveryFee = orderType === 'delivery' ? 4.99 : 0;
  const total = parseFloat((subtotal - discount + tax + deliveryFee).toFixed(2));

  const newOrder = {
    id: `PF-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    orderType: orderType || 'takeaway',
    customer,
    items,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    tax,
    deliveryFee,
    total,
    couponUsed: couponCode || null,
    paymentMethod: paymentMethod || 'Online Card Payment',
    paymentStatus: 'Paid',
    orderStatus: 'Received',
    notes: notes || '',
    estimatedMinutes: orderType === 'delivery' ? 45 : 25,
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);

  // Award loyalty points to user if matching email
  const user = db.users.find(u => u.email.toLowerCase() === customer.email?.toLowerCase());
  if (user) {
    const earnedPoints = Math.floor(total * 10);
    user.loyaltyPoints = (user.loyaltyPoints || 0) + earnedPoints;
    if (user.loyaltyPoints > 500) user.tier = 'Platinum VIP';
    else if (user.loyaltyPoints > 200) user.tier = 'Gold VIP';
    else user.tier = 'Silver Member';
  }

  writeDB(db);
  res.status(201).json({ success: true, message: 'Order placed successfully!', data: newOrder });
});

// Update order status (Admin)
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = readDB();
  const order = db.orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.orderStatus = status;
  writeDB(db);
  res.json({ success: true, message: `Order status changed to ${status}`, data: order });
});

// ==========================================
// 3. TABLE RESERVATIONS & AVAILABILITY
// ==========================================

// Check time-slot availability for a date
app.get('/api/reservations/availability', (req, res) => {
  const { date } = req.query;
  const queryDate = date || new Date().toISOString().split('T')[0];
  const db = readDB();

  const slots = [
    "12:00", "12:30", "13:00", "13:30", "14:00",
    "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
  ];

  const maxSeatsPerSlot = db.slotsCapacity?.maxSeatsPerSlot || 40;
  const dateReservations = db.reservations.filter(r => r.date === queryDate && r.status !== 'Cancelled');

  const availability = slots.map(slot => {
    const slotBookings = dateReservations.filter(r => r.time === slot);
    const bookedGuests = slotBookings.reduce((sum, r) => sum + parseInt(r.guests || 2), 0);
    const seatsRemaining = Math.max(0, maxSeatsPerSlot - bookedGuests);
    
    let status = 'Available';
    if (seatsRemaining === 0) status = 'Full';
    else if (seatsRemaining <= 10) status = 'Filling Fast';

    return {
      time: slot,
      bookedGuests,
      seatsRemaining,
      status
    };
  });

  res.json({ success: true, date: queryDate, availability });
});

// Create new Reservation
app.post('/api/reservations', (req, res) => {
  const { firstName, lastName, email, phone, date, time, guests, occasion, requests } = req.body;

  if (!firstName || !lastName || !email || !phone || !date || !time || !guests) {
    return res.status(400).json({ success: false, message: 'All required reservation fields must be filled' });
  }

  const db = readDB();
  const refCode = `PF-RES-${Math.floor(1000 + Math.random() * 9000)}`;

  const newReservation = {
    id: `res-${Date.now()}`,
    refCode,
    firstName,
    lastName,
    email,
    phone,
    date,
    time,
    guests: guests.toString(),
    occasion: occasion || 'Standard Dining',
    requests: requests || '',
    status: 'Confirmed',
    tableNumber: `T-0${Math.floor(1 + Math.random() * 15)}`,
    createdAt: new Date().toISOString()
  };

  db.reservations.unshift(newReservation);
  writeDB(db);

  res.status(201).json({
    success: true,
    message: 'Table reserved successfully! Your booking is confirmed.',
    data: newReservation
  });
});

// Search reservation by ref code or email
app.get('/api/reservations/:refOrEmail', (req, res) => {
  const { refOrEmail } = req.params;
  const db = readDB();

  const found = db.reservations.filter(
    r => r.refCode?.toLowerCase() === refOrEmail.toLowerCase() ||
         r.email?.toLowerCase() === refOrEmail.toLowerCase()
  );

  if (!found.length) {
    return res.status(404).json({ success: false, message: 'No reservation found matching this reference code or email' });
  }

  res.json({ success: true, count: found.length, data: found });
});

// Reschedule or Cancel reservation
app.patch('/api/reservations/:refCode', (req, res) => {
  const { refCode } = req.params;
  const { date, time, guests, status, requests } = req.body;
  const db = readDB();

  const reservation = db.reservations.find(r => r.refCode?.toUpperCase() === refCode.toUpperCase());
  if (!reservation) {
    return res.status(404).json({ success: false, message: 'Reservation not found' });
  }

  if (date) reservation.date = date;
  if (time) reservation.time = time;
  if (guests) reservation.guests = guests.toString();
  if (status) reservation.status = status;
  if (requests !== undefined) reservation.requests = requests;

  writeDB(db);
  res.json({ success: true, message: 'Reservation updated successfully', data: reservation });
});

// ==========================================
// 4. REVIEWS & RATINGS ENDPOINTS
// ==========================================

// Get all reviews with summary statistics
app.get('/api/reviews', (req, res) => {
  const db = readDB();
  const reviews = db.reviews;
  
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (parseFloat(r.rating) || 5), 0) / totalReviews).toFixed(1)
    : "5.0";

  res.json({
    success: true,
    averageRating: parseFloat(avgRating),
    totalReviews,
    data: reviews
  });
});

// Submit new review
app.post('/api/reviews', (req, res) => {
  const { name, rating, comment, dishName } = req.body;

  if (!name || !rating || !comment) {
    return res.status(400).json({ success: false, message: 'Name, rating, and feedback comment are required' });
  }

  const db = readDB();
  const newReview = {
    id: `rev-${Date.now()}`,
    name,
    rating: parseInt(rating),
    comment,
    dishName: dishName || 'Overall Dining Experience',
    date: 'Just now',
    verified: true
  };

  db.reviews.unshift(newReview);
  writeDB(db);

  res.status(201).json({ success: true, message: 'Thank you for your review!', data: newReview });
});

// ==========================================
// 5. USER ACCOUNTS & AUTH ENDPOINTS
// ==========================================

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password required' });
  }

  const db = readDB();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    password,
    phone: phone || '',
    loyaltyPoints: 100, // Welcome bonus!
    tier: 'Silver Member',
    savedAddress: address || '',
    savedFavorites: []
  };

  db.users.push(newUser);
  writeDB(db);

  const { password: _, ...userSafe } = newUser;
  res.status(201).json({ success: true, message: 'Welcome to Purna Fork VIP!', user: userSafe });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email?.toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const { password: _, ...userSafe } = user;
  res.json({ success: true, message: 'Logged in successfully', user: userSafe });
});

// ==========================================
// 6. ADMIN DASHBOARD & ANALYTICS
// ==========================================

app.get('/api/admin/analytics', (req, res) => {
  const db = readDB();
  
  const totalRevenue = db.orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = db.orders.length;
  const totalReservations = db.reservations.length;
  const activeReservations = db.reservations.filter(r => r.status === 'Confirmed').length;
  
  // Calculate popular items
  const itemCounts = {};
  db.orders.forEach(order => {
    (order.items || []).forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
    });
  });

  const topDishes = Object.entries(itemCounts)
    .map(([name, count]) => ({ name, ordersCount: count }))
    .sort((a, b) => b.ordersCount - a.ordersCount)
    .slice(0, 5);

  res.json({
    success: true,
    stats: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      totalReservations,
      activeReservations,
      totalMenuItems: db.menu.length,
      outOfStockCount: db.menu.filter(m => !m.inStock).length,
      topDishes
    }
  });
});

app.listen(PORT, () => {
  console.log(`🍽️ The Purna Fork Server & Database active at http://localhost:${PORT}`);
});
