# 🚗 VehicleHub - Multi-Vehicle Marketplace Platform

**VehicleHub** is a production-style, multi-vehicle online marketplace built with **Node.js, Express, MySQL, and EJS**. Similar in concept to platforms like OLX or Quikr, VehicleHub is focused exclusively on vehicles of all types across India — including Bikes, Scooters, Cars, Auto Rickshaws, Trucks, Lorries, JCB / Construction Equipment, Tractors, Buses, Vans, Electric Vehicles, and other Commercial Vehicles.

---

## 🌟 Key Features

### 🚘 Multi-Vehicle Architecture (12 Core Categories)
- **Two-Wheelers**: Bikes, Scooters
- **Passenger Vehicles**: Cars, Vans, Buses
- **Commercial & Freight**: Auto Rickshaws, Light & Medium Trucks, Heavy Freight Lorries
- **Specialized & Agricultural**: Tractors, JCB / Heavy Construction Machinery
- **Green Mobility**: Electric Vehicles (EVs)
- **Utility & Commercial**: Specialized Utility Vehicles, Tankers & Trailers

### 🔍 Advanced Search, Filtering & Discovery
- **Parameterized Keyword Search**: Match by Title, Brand, Model, Variant, Registration Number, and City
- **Sidebar Filter System**: Filter by Category, Brand, City, District, State, Price Range, Kilometers Driven, Fuel Type (Petrol, Diesel, EV, CNG, Hybrid), Transmission (Manual, Automatic), Ownership (1st, 2nd, 3rd, 4th+), Overall Condition, and Minimum Year
- **Multi-Parameter Sorting**: Newest, Oldest, Price (Low to High), Price (High to Low), Kilometers (Low to High), Kilometers (High to Low), and Model Year
- **Responsive Pagination**: Clean, page-by-page browsing with result counts

### 📸 Dynamic Listing Creation & Damage Disclosure
- **Dynamic Category Fields**: Form dynamically adapts fields based on vehicle category (e.g., seating capacity for cars/buses, payload and tyre counts for trucks, horsepower and operating hours for tractors/JCB)
- **Transparent Condition & Damage Disclosure**: Dedicated disclosure sections for Scratches, Dents, Accident History, Major Repairs, and Mechanical Issues
- **Multi-Photo Uploads**: Upload up to 10 photos per vehicle with client-side drag-and-drop preview, file size/mime-type validation, and automatic primary image designation
- **Direct Indian Rupee Formatting**: Automatic formatting with Indian numbering system (`₹ 15,50,000`)

### 💬 Buyer-Seller Interaction & Instant WhatsApp Connect
- **Instant WhatsApp Click-to-Chat**: Normalized Indian mobile numbers (`+91`) with pre-filled vehicle inquiry text
- **Direct Phone Calling**: One-click tel links
- **Built-in Real-Time Messaging**: Interactive chat thread between buyers and sellers with vehicle preview headers, unread message badges, and notifications
- **Seller Ratings & Reviews**: 1 to 5 star rating system with buyer reviews
- **Wishlist & Favorites**: Save vehicles to personal favorites for quick review

### 🛡️ Trust, Safety & Fraud Prevention
- **Listing Reporting**: Users can report suspicious, fraudulent, or mispriced listings directly to moderators
- **Official Challan & Verification Abstraction**: Legal and ethical abstraction layer ready for authorized RTO/Challan APIs. Gracefully falls back to *"Official challan verification is currently unavailable"* when credentials are not configured — **never inventing fake data**
- **Prominent Transparency Disclaimers**: Disclaims that seller-provided information is subject to independent verification

### 👑 Comprehensive Admin Control Center
- **Admin Dashboard Metrics**: Real-time counts of users, active listings, sold listings, pending listings, fraud reports, and messages
- **Vehicle Moderation Queue**: Approve, reject with specific reason, or permanently delete listings
- **User Management**: Search, filter, suspend, or reinstate user accounts
- **Fraud Investigation**: Review filed reports, update status (Pending, Under Review, Resolved, Dismissed), and attach admin resolution notes
- **Category Manager**: Enable/disable categories, update display order, and configure icons
- **Immutable Audit Logging**: Every critical administrative and moderation action writes to an immutable `audit_logs` table with admin ID, action type, entity, and timestamp

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js (v5)
- **Database**: MySQL (`mysql2` with high-performance connection pool & promises)
- **Frontend / Templating**: EJS (Embedded JavaScript), CSS3 with CSS Variables & Flexbox/Grid, Vanilla JavaScript
- **Security & Middleware**:
  - `bcrypt`: Password encryption (10 salt rounds)
  - `helmet`: Secure HTTP headers
  - `express-session`: Secure, cookie-based session management (`httpOnly`, `sameSite: lax`)
  - `express-validator`: Input validation & sanitization
  - `connect-flash`: User-friendly notification banners
  - `multer`: Secure multi-image uploads with file-type checking
  - `method-override`: RESTful HTTP method handling

---

## 📂 Project Structure

```
BIKEHUB (VEHICLEHUB)/
├── config/
│   └── constants.js             # Platform constants, fuel types, categories, statuses
├── controllers/
│   ├── adminController.js       # Admin dashboard, user moderation, report review
│   ├── authController.js        # Register, login, session persistence, logout
│   ├── favoriteController.js    # Wishlist & favorite toggle
│   ├── homeController.js        # Public landing page & authenticated dashboard
│   ├── messageController.js     # Conversations, chat threads, messaging
│   ├── notificationController.js# User notifications
│   ├── profileController.js     # User profile, avatar upload, password change
│   ├── reportController.js      # Vehicle fraud reports
│   ├── reviewController.js      # Seller reviews & ratings
│   └── vehicleController.js     # Browse, sell, details, edit, delete, my-listings
├── database/
│   ├── db.js                    # MySQL2 pool configuration & connection manager
│   ├── migrate.js               # Automated schema & data migration script
│   └── schema.sql               # Complete SQL schema with foreign keys & indexes
├── middleware/
│   ├── authMiddleware.js        # requireLogin, redirectIfAuthenticated, requireAdmin
│   ├── globalLocals.js          # Injects user, flash, categories, and unread counts
│   ├── uploadMiddleware.js      # Multer file upload handler
│   └── validationMiddleware.js  # express-validator rules
├── public/
│   ├── css/
│   │   └── main.css             # Unified responsive stylesheet
│   └── js/
│       ├── main.js              # Mobile navigation, password toggles, auto-dismiss alerts
│       ├── register.js          # Client-side registration validation
│       ├── sell.js              # Image preview & drag-and-drop
│       └── vehicles.js          # Browse sidebar filter drawer
├── routes/
│   ├── admin.js                 # /admin/*
│   ├── auth.js                  # /login, /register, /logout
│   ├── favorites.js             # /favorites/*
│   ├── home.js                  # /, /dashboard
│   ├── messages.js              # /messages/*
│   ├── misc.js                  # /reviews, /reports, /notifications
│   ├── profile.js               # /profile/*
│   └── vehicles.js              # /vehicles/*, /my-listings
├── services/
│   ├── challanService.js        # Traffic challan abstraction layer with legal fallback
│   ├── recommendationService.js # Vehicle recommendation engine
│   └── vehicleVerificationService.js # RC verification service abstraction
├── uploads/
│   ├── avatars/                 # User profile photos
│   └── vehicles/                # Uploaded vehicle photos
├── views/
│   ├── admin/                   # Dashboard, users, vehicles, reports, categories, audit logs
│   ├── auth/                    # Login, register
│   ├── errors/                  # 404, 500
│   ├── favorites/               # Wishlist view
│   ├── home/                    # Landing page, dashboard
│   ├── messages/                # Inbox, interactive chat
│   ├── notifications/           # User notifications
│   ├── partials/                # Header, navbar, footer
│   ├── profile/                 # Profile, edit, change password
│   └── vehicles/                # Browse, details, sell, edit, my-listings
├── .env.example
├── package.json
└── server.js                    # Express application entry point
```

---

## 💻 Installation & Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **MySQL Server**: v8.0+

### 2. Clone the Repository
```bash
git clone https://github.com/srinivasrathna244/VEHICLEHUB.git
cd VEHICLEHUB
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bikehub

SESSION_SECRET=your_super_secret_session_key_here
```

### 5. Run Database Migration
Execute the automated migration script to create all required tables, seed the 12 vehicle categories, and seamlessly upgrade existing users/listings:
```bash
npm run migrate
```

### 6. Start the Server
```bash
# Production mode
npm start

# Development mode with auto-reload
npm run dev
```

Visit the application at: **`http://localhost:3000`**

---

## 🧪 Testing & Verification

VehicleHub includes automated test suites covering public endpoints, authenticated workflows, and administrator actions.

Run tests:
```bash
# Test public & API endpoints
node scratch/test-suite.js

# Test full user lifecycle (Register -> Dashboard -> Sell -> View -> Mark Sold -> Logout)
node scratch/test-full-user-lifecycle.js

# Test admin control panel & role authorization guards
node scratch/test-admin-lifecycle.js
```

---

## 🔒 Security Best Practices Implemented

- **Password Hashing**: `bcrypt` with salt rounds = 10.
- **Session Protection**: `httpOnly` cookies, `sameSite: lax`, 7-day expiration.
- **SQL Injection Prevention**: 100% parameterized queries using MySQL2 connection pooling.
- **Cross-Site Scripting (XSS)**: Escaped EJS interpolations and strict `helmet` HTTP headers.
- **Access Control**: Role-based middleware guarding all `/admin/*` and user-specific resources.
- **Input Sanitization**: `express-validator` verifying Indian phone numbers, emails, and numeric bounds.
- **Responsible Verification**: Clear legal disclaimers, no unauthorized web scraping or CAPTCHA bypasses.

---

## 📜 License
This project is open-source under the [ISC License](LICENSE).