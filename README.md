# 🚀 BikeHub - Professional Bike Marketplace

BikeHub is a full-stack web application that allows users to buy and sell used bikes online. It provides a secure platform where users can register, log in, post bike listings with images, manage their own listings, and search for bikes based on different filters.

---

## 📌 Features

### 👤 User Management
- User Registration
- Secure Login with Password Encryption (bcrypt)
- User Logout
- Session-based Authentication
- User Profile
- Edit Profile

### 🏍 Bike Listings
- Sell a Bike
- Upload Multiple Bike Images
- View All Bikes
- View Bike Details
- Edit Bike Details
- Delete Bike Listings
- My Listings Page

### 🔍 Search & Filter
- Search by Bike Name
- Filter by Brand
- Filter by City
- Filter by Price Range

### 📱 Responsive Design
- Modern UI
- Responsive Layout
- Clean Navigation
- User-Friendly Interface

---

# 🛠 Technologies Used

## Frontend
- HTML5
- CSS3
- JavaScript
- EJS (Embedded JavaScript Templates)

## Backend
- Node.js
- Express.js

## Database
- MySQL

## Authentication
- Express Session
- bcrypt

## File Upload
- Multer

## Environment Variables
- dotenv

---

# 📂 Project Structure

```
BikeHub/
│
├── controllers/
│   ├── authController.js
│   ├── bikeController.js
│
├── database/
│   └── db.js
│
├── middleware/
│
├── public/
│   ├── css/
│   ├── images/
│   ├── js/
│
├── routes/
│   ├── auth.js
│   ├── bikes.js
│   ├── home.js
│   ├── profile.js
│
├── uploads/
│   └── bikes/
│
├── views/
│
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

---

# 💻 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/srinivasrathna244/BikeHub.git
```

---

## 2. Open Project

```bash
cd BikeHub
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Create .env File

Create a file named **.env**

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bikehub

SESSION_SECRET=your_secret_key

PORT=3000
```

---

## 5. Start the Server

Development Mode

```bash
npm run dev
```

Production Mode

```bash
npm start
```

---

# 📊 Database

The project uses **MySQL**.

Main Tables:

- users
- bikes
- bike_images

---

# 🔐 Security Features

- Password Hashing using bcrypt
- Session Authentication
- Protected Routes
- User Authorization
- Secure Login

---

# 📷 Screenshots

## Home Page

(Add Screenshot Here)

---

## Login Page

(Add Screenshot Here)

---

## Dashboard

(Add Screenshot Here)

---

## Bike Listings

(Add Screenshot Here)

---

## Bike Details

(Add Screenshot Here)

---

## Profile Page

(Add Screenshot Here)

---

# 🚀 Future Enhancements

- Wishlist
- Online Bike Booking
- Chat Between Buyer and Seller
- Email Verification
- Password Reset
- Google Login
- Razorpay Payment Gateway
- Admin Dashboard
- Bike Reviews & Ratings
- Bike Comparison
- AI-Based Bike Recommendation
- Location-Based Search
- Favorite Bikes
- Notification System

---

# 👨‍💻 Author

**Rathna Srinivas**

B.Tech Student

---

# 📜 License

This project is developed for educational and learning purposes.

---

## ⭐ If you like this project, don't forget to star the repository!