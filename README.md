# AbodeX - Frontend-Only Airbnb Clone

A modern, responsive, pixel-perfect frontend clone of Airbnb built with **React (Vite)**, **Tailwind CSS**, **React Router v7**, and **Lucide Icons**.

---

## 🚀 Features

- **Home Page**:
  - Top navigation with brand logo, interactive compact search pill, and host / user menu dropdown.
  - Horizontally scrollable category chips with smooth scrolling buttons and Lucide icons.
  - Interactive Filter Modal (price range with histogram representation, property types, bedroom counter, and amenities).
  - Responsive 1 to 4 column property cards grid.
  - "Display total price" switch including upfront fees.
  - Host inspiration callout banner.

- **Search Results Page**:
  - Sticky search summary & breadcrumbs.
  - Filter chips (Superhosts only, Free cancellation, etc.).
  - **70/30 Desktop Layout**: 70% property cards listing and 30% sticky interactive map placeholder.
  - **Mobile Map Toggle**: Floating pill button allowing users to seamlessly switch between List and Map views on mobile/tablet.
  - Hovering over listings highlights corresponding map price pins.

- **Property Details Page (`/rooms/:id`)**:
  - Airbnb-style **5-photo mosaic image gallery** with hover zoom and "Show all photos" full-screen lightbox modal with thumbnail strip and keyboard navigation.
  - Share (copies link to clipboard) & Save to Wishlist buttons.
  - Property specs, Host info, and verified Superhost badges.
  - Highlights (Superhost, Keyless entry, Unbeatable location, Free cancellation).
  - Expandable property description.
  - "Where you'll sleep" bedroom cards.
  - Amenities grid with modal showcasing all categorized amenities with matching icons.
  - **Sticky Booking Card**:
    - Interactive Check-in and Checkout date pickers.
    - Dynamic Guest selector popup (Adults, Children, Infants, Pets).
    - Real-time calculated price breakdown (Nights × Rate + Cleaning Fee + Service Fee = Total).
    - Reserve button triggering an instant booking confirmation modal and saving the trip to the user's profile.
  - Star rating breakdown score bars and Review Cards.
  - Location & Map preview.
  - Similar stays carousel/grid.

- **Wishlist Page (`/wishlists`)**:
  - Grid of saved favorite properties.
  - Direct heart button toggle to add/remove stays.
  - Empty state with "Start exploring" call-to-action.
  - Clear wishlist functionality.
  - Persisted across browser sessions using `localStorage`.

- **Profile Page (`/profile`)**:
  - User avatar, Superguest badge, verified identity markers, and travel statistics.
  - Tabs for **Trips & Bookings** (Upcoming & Past trips), **Wishlists**, and **Account Settings**.
  - Interactive Edit Profile form allowing live updates to name, email, phone, and about bio.

- **Login & Register Pages (`/login`, `/register`)**:
  - Centered Airbnb-inspired authentication cards with Google and Apple social sign-in buttons.
  - Email/Password form validation UI and password visibility toggle.

- **Toast Notification System**:
  - Instant non-intrusive notification popups for saving to wishlist, copying links, making reservations, and updating profile settings.

- **Mobile Bottom Navigation (`MobileNav`)**:
  - Fixed mobile bottom tab bar for Explore, Search, Wishlists (with live count badge), Trips, and Profile.

---

## 📁 Project Structure

```
AbodeX/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx          # Header with logo, dynamic search pill, user menu
│   │   │   ├── SearchBar.jsx       # Expandable Airbnb multi-segment search (Where, Dates, Guests)
│   │   │   ├── FilterBar.jsx       # Category chips with scroll buttons & Filter modal trigger
│   │   │   ├── FilterModal.jsx     # Price range, property type, bedrooms, amenities filters
│   │   │   ├── Footer.jsx          # Multi-column footer with language/currency badges
│   │   │   └── MobileNav.jsx       # Bottom navigation bar for mobile screens
│   │   ├── property/
│   │   │   ├── PropertyCard.jsx    # Image carousel with dots, heart toggle, rating, price
│   │   │   ├── ImageGallery.jsx    # 5-image collage grid + full lightbox modal
│   │   │   ├── BookingCard.jsx     # Sticky booking widget with dynamic price calculations
│   │   │   ├── ReviewCard.jsx      # Reviewer avatar, star rating, date, comments
│   │   │   ├── AmenitiesModal.jsx  # Full modal showcasing all categorized amenities
│   │   │   └── HostBadge.jsx       # Superhost verification badge & host info
│   │   ├── search/
│   │   │   └── MapPlaceholder.jsx  # Interactive map view with price pins & preview overlay
│   │   └── profile/
│   │       └── TripCard.jsx        # Past & upcoming trips card with property details
│   ├── context/
│   │   ├── WishlistContext.jsx     # Wishlist state with localStorage persistence
│   │   ├── SearchContext.jsx       # Global search destination, dates, guests, filters
│   │   ├── AuthContext.jsx         # User profile and booking state management
│   │   └── ToastContext.jsx        # Notification toast provider
│   ├── data/
│   │   ├── categories.js           # 14 Airbnb categories with Lucide icons & descriptions
│   │   ├── properties.js           # 12 sample listings with HD photos & rich details
│   │   └── mockUser.js             # User profile, trips history, and reservations
│   ├── pages/
│   │   ├── HomePage.jsx            # Hero search, categories, property grid, bottom banner
│   │   ├── SearchResultsPage.jsx   # Sticky header, filter chips, 70/30 split list & map
│   │   ├── PropertyDetailsPage.jsx # Full property details, gallery, sticky booking card, reviews
│   │   ├── WishlistPage.jsx        # Saved properties grid + empty state
│   │   ├── ProfilePage.jsx         # User card, tabs (Trips, Wishlist, Settings)
│   │   ├── LoginPage.jsx           # Clean centered login form
│   │   ├── RegisterPage.jsx        # Centered register form
│   │   └── NotFoundPage.jsx        # 404 page with return to home
│   ├── App.jsx                     # Route definitions & layout wrapper
│   ├── main.jsx                    # Root rendering with Providers
│   └── index.css                   # Tailwind directives and custom scrollbars
├── index.html                      # Google Fonts Inter & Airbnb branding
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🎨 Design System

- **Typography**: Inter via Google Fonts (`300`, `400`, `500`, `600`, `700`, `800`)
- **Primary Brand Color**: `#FF385C` (Airbnb Coral / Rose)
- **Neutral Dark**: `#222222`
- **Muted Gray**: `#717171`
- **Borders**: `#DDDDDD` / `#EBEBEB`
- **Card Styling**: `rounded-2xl` / `rounded-3xl` with soft shadows (`shadow-sm`, `shadow-modal`)
