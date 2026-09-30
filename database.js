// Persistent Data Store for The Purna Fork
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default database state
const defaultState = {
  menu: [
    {
      id: "dish-1",
      name: "Grilled Garlic Butter Shrimp",
      description: "Jumbo wild-caught gulf shrimp sauteed in garlic white-wine butter with fresh herbs and toasted baguette.",
      price: 18.50,
      category: "non-vegetarian",
      tag: "Chef Special",
      image: "https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=800",
      inStock: true,
      calories: 420,
      rating: 4.9,
      reviewCount: 38,
      spiceOptions: ["Mild", "Medium", "Spicy", "Extra Hot"],
      availableAddons: [
        { name: "Extra Garlic Baguette", price: 3.00 },
        { name: "Truffle Butter Dip", price: 4.50 },
        { name: "Avocado Slices", price: 2.50 }
      ]
    },
    {
      id: "dish-2",
      name: "Truffle Wild Mushroom Risotto",
      description: "Creamy Carnaroli arborio rice with porcini mushrooms, 24-month aged Parmigiano-Reggiano, and black truffle drizzle.",
      price: 22.00,
      category: "vegetarian",
      tag: "Best Seller",
      image: "https://images.pexels.com/photos/5638527/pexels-photo-5638527.jpeg?auto=compress&cs=tinysrgb&w=800",
      inStock: true,
      calories: 560,
      rating: 4.8,
      reviewCount: 52,
      spiceOptions: ["Mild", "Medium"],
      availableAddons: [
        { name: "Shaved Fresh Truffle", price: 8.00 },
        { name: "Extra Aged Parmesan", price: 3.00 }
      ]
    },
    {
      id: "dish-3",
      name: "Prime Wagyu Ribeye Steak",
      description: "10oz A5 Wagyu ribeye grilled over oak charcoal, served with roasted bone marrow butter and asparagus.",
      price: 48.00,
      category: "non-vegetarian",
      tag: "Signature",
      image: "https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=800",
      inStock: true,
      calories: 780,
      rating: 5.0,
      reviewCount: 64,
      spiceOptions: ["Black Pepper Crusted", "Classic Rosemary Garlic"],
      availableAddons: [
        { name: "Grilled Lobster Tail", price: 18.00 },
        { name: "Red Wine Demi-Glace", price: 3.50 },
        { name: "Truffle Fries", price: 6.00 }
      ]
    },
    {
      id: "dish-4",
      name: "Mediterranean Burrata Bowl",
      description: "Handcrafted Italian burrata on heirloom tomatoes, roasted pine nuts, pesto genovese, and balsamic glaze.",
      price: 16.00,
      category: "vegetarian",
      tag: "Popular",
      image: "https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=800",
      inStock: true,
      calories: 380,
      rating: 4.7,
      reviewCount: 29,
      spiceOptions: ["Mild"],
      availableAddons: [
        { name: "Prosciutto di Parma", price: 5.00 },
        { name: "Gluten-free Crackers", price: 2.00 }
      ]
    },
    {
      id: "dish-5",
      name: "Pan-Seared Chilean Sea Bass",
      description: "Crispy skin sea bass resting on saffron pea pureé, micro-herbs, and lemon caper emulsion.",
      price: 36.00,
      category: "non-vegetarian",
      tag: "Chef Special",
      image: "https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=800",
      inStock: true,
      calories: 490,
      rating: 4.9,
      reviewCount: 41,
      spiceOptions: ["Mild", "Lemon Pepper"],
      availableAddons: [
        { name: "Jumbo Scallops (2pcs)", price: 12.00 },
        { name: "Herb Roasted Potatoes", price: 4.50 }
      ]
    },
    {
      id: "dish-6",
      name: "Artisan Wood-Fired Margherita",
      description: "San Marzano tomato base, Fior di Latte mozzarella, fresh sweet basil, and extra virgin olive oil.",
      price: 17.50,
      category: "vegetarian",
      tag: "Classic",
      image: "https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=800",
      inStock: true,
      calories: 620,
      rating: 4.8,
      reviewCount: 75,
      spiceOptions: ["Mild", "Chili Flakes"],
      availableAddons: [
        { name: "Extra Fresh Mozzarella", price: 3.50 },
        { name: "Spicy Calabrian Salami", price: 4.00 },
        { name: "Hot Honey Drizzle", price: 2.00 }
      ]
    },
    {
      id: "dish-7",
      name: "Valrhona Molten Lava Cake",
      description: "Warm 70% dark chocolate cake with a molten center, Madagascar vanilla bean gelato, and berry coulis.",
      price: 13.00,
      category: "vegetarian",
      tag: "Dessert",
      image: "https://images.pexels.com/photos/132694/pexels-photo-132694.jpeg?auto=compress&cs=tinysrgb&w=800",
      inStock: true,
      calories: 510,
      rating: 4.9,
      reviewCount: 88,
      spiceOptions: ["Standard"],
      availableAddons: [
        { name: "Extra Gelato Scoop", price: 3.50 },
        { name: "Espresso Shot", price: 3.00 }
      ]
    },
    {
      id: "dish-8",
      name: "Smoked Rosemary Old Fashioned",
      description: "Small-batch bourbon, aromatic bitters, demerara syrup, smoked with organic rosemary sprigs.",
      price: 15.00,
      category: "special",
      tag: "Beverage",
      image: "https://images.pexels.com/photos/2795026/pexels-photo-2795026.jpeg?auto=compress&cs=tinysrgb&w=800",
      inStock: true,
      calories: 190,
      rating: 4.9,
      reviewCount: 31,
      spiceOptions: ["Signature"],
      availableAddons: [
        { name: "Craft Large Clear Ice Cube", price: 1.00 }
      ]
    }
  ],
  orders: [
    {
      id: "PF-ORD-101",
      orderType: "delivery",
      customer: {
        name: "Sophia Martinez",
        email: "sophia.m@example.com",
        phone: "+1 (555) 234-5678",
        address: "742 Evergreen Terrace, Apt 4B, Food City"
      },
      items: [
        { id: "dish-3", name: "Prime Wagyu Ribeye Steak", price: 48.00, quantity: 1, spice: "Black Pepper Crusted", addons: [{ name: "Truffle Fries", price: 6.00 }] },
        { id: "dish-7", name: "Valrhona Molten Lava Cake", price: 13.00, quantity: 1, spice: "Standard", addons: [] }
      ],
      subtotal: 67.00,
      discount: 6.70,
      tax: 5.43,
      deliveryFee: 4.99,
      total: 70.72,
      couponUsed: "WELCOME10",
      paymentMethod: "Credit Card (Stripe)",
      paymentStatus: "Paid",
      orderStatus: "Preparing",
      notes: "Please leave at front door, ring doorbell.",
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      id: "PF-ORD-102",
      orderType: "dine-in",
      customer: {
        name: "David Chen",
        email: "david.c@example.com",
        phone: "+1 (555) 876-5432",
        tableNumber: "Table 12"
      },
      items: [
        { id: "dish-1", name: "Grilled Garlic Butter Shrimp", price: 18.50, quantity: 2, spice: "Medium", addons: [{ name: "Extra Garlic Baguette", price: 3.00 }] },
        { id: "dish-8", name: "Smoked Rosemary Old Fashioned", price: 15.00, quantity: 2, spice: "Signature", addons: [] }
      ],
      subtotal: 70.00,
      discount: 0,
      tax: 6.30,
      deliveryFee: 0,
      total: 76.30,
      couponUsed: null,
      paymentMethod: "Apple Pay",
      paymentStatus: "Paid",
      orderStatus: "In Kitchen",
      notes: "Celebration anniversary drinks.",
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    }
  ],
  reservations: [
    {
      id: "res-1",
      refCode: "PF-RES-8821",
      firstName: "Alexander",
      lastName: "Wright",
      email: "alex.wright@example.com",
      phone: "+1 (555) 349-1029",
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: "19:30",
      guests: "4",
      occasion: "Anniversary",
      requests: "Quiet corner booth with view if available please.",
      status: "Confirmed",
      tableNumber: "T-04 (VIP Booth)",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "res-2",
      refCode: "PF-RES-4912",
      firstName: "Elena",
      lastName: "Rostova",
      email: "elena.r@example.com",
      phone: "+1 (555) 902-3341",
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      time: "20:00",
      guests: "2",
      occasion: "Romantic Date",
      requests: "Window seat preferred.",
      status: "Confirmed",
      tableNumber: "T-09",
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ],
  reviews: [
    {
      id: "rev-1",
      name: "Marcus Aurelius",
      rating: 5,
      comment: "The Prime Wagyu was an absolute revelation. Perfectly seared with melt-in-your-mouth tenderness. Outstanding service and ambience!",
      dishName: "Prime Wagyu Ribeye Steak",
      date: "Yesterday",
      verified: true
    },
    {
      id: "rev-2",
      name: "Claire Dupont",
      rating: 5,
      comment: "The mushroom risotto took me straight back to northern Italy. The truffle aroma fills the room the moment it arrives.",
      dishName: "Truffle Wild Mushroom Risotto",
      date: "3 days ago",
      verified: true
    },
    {
      id: "rev-3",
      name: "Liam O'Connor",
      rating: 5,
      comment: "Best dining experience in the city! The booking process was super smooth and our table was ready with a personalized anniversary card.",
      dishName: "The Purna Fork Experience",
      date: "1 week ago",
      verified: true
    }
  ],
  users: [
    {
      id: "usr-1",
      name: "Randhir Kumar",
      email: "user@purnafork.com",
      password: "password123",
      phone: "+1 (555) 123-4567",
      loyaltyPoints: 340,
      tier: "Gold VIP",
      savedAddress: "123 Gourmet Ave, Suite 400",
      savedFavorites: ["dish-1", "dish-3", "dish-7"]
    }
  ],
  coupons: [
    { code: "FORK10", discountPercent: 10, minOrder: 30, maxDiscount: 20 },
    { code: "WELCOME20", discountPercent: 20, minOrder: 50, maxDiscount: 30 },
    { code: "VIPGIFT", discountPercent: 15, minOrder: 25, maxDiscount: 25 }
  ],
  slotsCapacity: {
    maxSeatsPerSlot: 40
  }
};

// Helper to read DB
export function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDB(defaultState);
      return defaultState;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return defaultState;
  }
}

// Helper to write DB
export function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// Initialize on first load
readDB();
