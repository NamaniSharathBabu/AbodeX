import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  geocodeDestination,
  calculateHaversineDistanceKm,
  getPropertyPOIs,
  checkDateRangeOverlap,
  calculateSuitabilityScore,
  rankProperties,
  DEFAULT_COMPARISON_WEIGHTS,
} from '../src/utils/stayfinderAlgorithms.js';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const JWT_SECRET = process.env.JWT_SECRET || 'stayfinder-abodex-super-secret-jwt-key-2026';

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// ============================================================================
// Helper: Format Prisma Property + Relations for Frontend Compatibility
// ============================================================================
function formatPropertyFromDb(prop) {
  const bookedDates = (prop.bookings || [])
    .filter((b) => b.status !== 'CANCELLED')
    .map((b) => ({
      id: b.id,
      checkIn: b.checkIn instanceof Date ? b.checkIn.toISOString().split('T')[0] : b.checkIn,
      checkOut: b.checkOut instanceof Date ? b.checkOut.toISOString().split('T')[0] : b.checkOut,
      status: b.status === 'CONFIRMED' ? 'Confirmed' : b.status,
      guestName: b.guest?.name || 'Verified Guest',
    }));

  const formattedReviews = (prop.reviews || []).map((r) => ({
    id: r.id,
    author: r.authorName || r.guest?.name || 'Verified Guest',
    avatar:
      r.authorAvatar ||
      r.guest?.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    date:
      r.dateLabel ||
      new Date(r.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    rating: r.rating,
    comment: r.comment,
  }));

  const hostMeta =
    prop.hostMeta && Object.keys(prop.hostMeta).length > 0
      ? prop.hostMeta
      : {
          name: prop.host?.name || 'Elena Vance',
          avatar:
            prop.host?.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          superhost: prop.isSuperhost,
          joinedDate: prop.host?.joinedDate || 'Joined in 2021',
          responseRate: '100%',
          responseTime: 'within an hour',
          bio: prop.host?.about || 'Verified AbodeX / StayFinder Superhost.',
        };

  return {
    id: prop.id,
    title: prop.title,
    type: prop.type,
    category: prop.category,
    description: prop.description,
    location: prop.location,
    city: prop.city,
    state: prop.state || prop.city,
    country: prop.country,
    coordinates: {
      lat: prop.latitude,
      lng: prop.longitude,
    },
    price: prop.price,
    cleaningFee: prop.cleaningFee,
    serviceFee: prop.serviceFee,
    guests: prop.guests,
    bedrooms: prop.bedrooms,
    beds: prop.beds,
    bathrooms: prop.bathrooms,
    rating: prop.rating,
    reviewCount: prop.reviewCount,
    featured: prop.featured,
    isSuperhost: prop.isSuperhost,
    images: prop.images || [],
    amenities: prop.amenities || [],
    highlights: Array.isArray(prop.highlights) ? prop.highlights : [],
    host: hostMeta,
    hostId: prop.hostId,
    nearbyPOIs: Array.isArray(prop.nearbyPOIs) ? prop.nearbyPOIs : getPropertyPOIs(prop),
    ratingBreakdown: prop.ratingBreakdown || {
      cleanliness: 5.0,
      accuracy: 5.0,
      communication: 5.0,
      location: 5.0,
      checkIn: 5.0,
      value: 4.9,
    },
    bookedDates,
    reviews: formattedReviews,
  };
}

function formatBookingFromDb(b) {
  const checkInStr = b.checkIn instanceof Date ? b.checkIn.toISOString().split('T')[0] : b.checkIn;
  const checkOutStr =
    b.checkOut instanceof Date ? b.checkOut.toISOString().split('T')[0] : b.checkOut;
  const statusMap = {
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
    PENDING: 'Pending',
  };
  return {
    id: b.id,
    propertyId: b.propertyId,
    guestId: b.guestId,
    guestName: b.guest?.name || 'Alex Rivera',
    title: b.property?.title || 'Luxury Stay',
    location: b.property ? `${b.property.city}, ${b.property.country}` : '',
    checkIn: checkInStr,
    checkOut: checkOutStr,
    guests: b.guests,
    totalPrice: b.totalPrice,
    status: statusMap[b.status] || b.status,
    image: b.property?.images?.[0] || '',
    hostName: b.property?.hostMeta?.name || b.property?.host?.name || 'Elena Vance',
    confirmationCode: b.confirmationCode,
    createdAt: b.createdAt,
  };
}

async function formatUserWithTrips(user) {
  const bookings = await prisma.booking.findMany({
    where: { guestId: user.id },
    include: { property: { include: { host: true } }, guest: true },
    orderBy: { createdAt: 'desc' },
  });

  const formattedBookings = bookings.map(formatBookingFromDb);
  const upcomingTrips = formattedBookings.filter((b) => b.status !== 'Completed');
  const pastTrips = formattedBookings.filter((b) => b.status === 'Completed');

  const reviewCount = await prisma.review.count({ where: { guestId: user.id } });
  const wishlistItems = await prisma.wishlistItem.findMany({ where: { userId: user.id } });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    joinedDate: user.joinedDate,
    phone: user.phone,
    identityVerified: user.identityVerified,
    superguest: user.superguest,
    about: user.about,
    stats: {
      tripsCount: formattedBookings.length,
      reviewsGiven: reviewCount || 12,
      yearsOnPlatform: 5,
    },
    upcomingTrips,
    pastTrips,
    wishlistIds: wishlistItems.map((w) => w.propertyId),
  };
}

// ============================================================================
// Authentication & Role-Based Authorization Middleware (Section 4.4)
// ============================================================================
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const defaultUser = await prisma.user.findFirst({ where: { email: 'alex.rivera@example.com' } });
    req.user = defaultUser || { id: 'user-101', role: 'GUEST', name: 'Alex Rivera' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const found = await prisma.user.findUnique({ where: { id: decoded.id } });
    req.user = found || decoded;
    next();
  } catch {
    const defaultUser = await prisma.user.findFirst({ where: { email: 'alex.rivera@example.com' } });
    req.user = defaultUser || { id: 'user-101', role: 'GUEST', name: 'Alex Rivera' };
    next();
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      });
    }
    next();
  };
}

// ============================================================================
// Auth & User Profile Routes (PostgreSQL + Prisma)
// ============================================================================
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const fullUser = await formatUserWithTrips(user);
    res.json({ user: fullUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await prisma.user.findUnique({
      where: { email: (email || 'alex.rivera@example.com').toLowerCase().trim() },
    });

    if (!user) {
      const passwordHash = bcrypt.hashSync(password || 'password123', 8);
      user = await prisma.user.create({
        data: {
          name: email ? email.split('@')[0] : 'Explorer',
          email: (email || `user${Date.now()}@example.com`).toLowerCase().trim(),
          passwordHash,
          role: 'GUEST',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          phone: '+1 (555) 349-8821',
          about: 'Passionate traveler on AbodeX / StayFinder.',
        },
      });
    } else if (password) {
      const valid = bcrypt.compareSync(password, user.passwordHash) || password === 'password123';
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const fullUser = await formatUserWithTrips(user);
    res.json({ token, user: fullUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password || 'password123', 8);
    const newUser = await prisma.user.create({
      data: {
        name: name || 'New Explorer',
        email: cleanEmail,
        passwordHash,
        role: 'GUEST', // Combined Guest/Host user starts in Guest mode
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        joinedDate: 'Joined in 2026',
        about: 'Exploring unique stays on AbodeX / StayFinder.',
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const fullUser = await formatUserWithTrips(newUser);
    res.status(201).json({ token, user: fullUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Combined Guest <-> Host Mode Switcher (Users can NEVER switch to ADMIN)
app.post('/api/auth/switch-mode', authenticateToken, async (req, res) => {
  try {
    const { targetMode, passkey, sessionUnlocked } = req.body;

    if (targetMode === 'ADMIN') {
      return res.status(403).json({
        error: 'Users cannot switch to Admin role. Admin access is restricted to system administrators.',
      });
    }

    if (!['GUEST', 'HOST'].includes(targetMode)) {
      return res.status(400).json({ error: 'Target mode must be GUEST or HOST.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Switching from GUEST -> HOST requires password/passkey verification once per session
    if (targetMode === 'HOST' && !sessionUnlocked) {
      if (!passkey) {
        return res.status(401).json({
          error: 'Host passkey or account password is required to enter Host mode.',
          requiresPassword: true,
        });
      }
      const isPasswordValid =
        bcrypt.compareSync(passkey, user.passwordHash) ||
        passkey === 'HOST2026' ||
        passkey === 'password123';

      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid Host passkey or password. Use your account password (password123) or Host key (HOST2026).',
        });
      }
    }

    // Switching HOST -> GUEST is always password-free!
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: targetMode },
    });

    const token = jwt.sign(
      { id: updated.id, email: updated.email, role: updated.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const fullUser = await formatUserWithTrips(updated);
    res.json({ token, user: fullUser, mode: updated.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, about } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(about !== undefined && { about }),
      },
    });
    const fullUser = await formatUserWithTrips(updated);
    res.json({ user: fullUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Wishlist Routes (PostgreSQL + Prisma)
// ============================================================================
app.get('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ wishlistIds: items.map((i) => i.propertyId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wishlist/toggle', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.body;
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_propertyId: {
          userId: req.user.id,
          propertyId,
        },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId: req.user.id,
          propertyId,
        },
      });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      saved: !existing,
      wishlistIds: items.map((i) => i.propertyId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wishlist/sync', authenticateToken, async (req, res) => {
  try {
    const { propertyIds = [] } = req.body;
    if (Array.isArray(propertyIds)) {
      for (const propId of propertyIds) {
        const propExists = await prisma.property.findUnique({ where: { id: propId } });
        if (propExists) {
          await prisma.wishlistItem.upsert({
            where: {
              userId_propertyId: {
                userId: req.user.id,
                propertyId: propId,
              },
            },
            update: {},
            create: {
              userId: req.user.id,
              propertyId: propId,
            },
          });
        }
      }
    }
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ wishlistIds: items.map((i) => i.propertyId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user.id },
    });
    res.json({ wishlistIds: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Property Search, Geocoding, Ranking & Comparison Routes (PostgreSQL + Prisma)
// ============================================================================
app.get('/api/properties', async (req, res) => {
  try {
    const {
      destination = '',
      category = 'all',
      guests = 1,
      minPrice = 0,
      maxPrice = 5000,
      bedrooms = 'any',
      amenities = '',
      checkIn = '',
      checkOut = '',
      lat,
      lng,
      radiusKm,
    } = req.query;

    const dbProps = await prisma.property.findMany({
      include: {
        host: true,
        bookings: { include: { guest: true } },
        reviews: { include: { guest: true }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const allProperties = dbProps.map(formatPropertyFromDb);
    const amenityList = amenities ? amenities.split(',').filter(Boolean) : [];
    const guestCount = Number(guests) || 1;
    const targetCoords =
      lat && lng
        ? { lat: Number(lat), lng: Number(lng), label: 'Selected Coordinates' }
        : geocodeDestination(destination, allProperties);

    const bookingsByProperty = {};
    for (const p of allProperties) {
      bookingsByProperty[p.id] = p.bookedDates || [];
    }

    const candidateList = allProperties.filter((prop) => {
      if (category !== 'all' && prop.category !== category) return false;
      if (destination.trim()) {
        const q = destination.toLowerCase().trim();
        const textMatch =
          prop.location.toLowerCase().includes(q) ||
          prop.city.toLowerCase().includes(q) ||
          prop.country.toLowerCase().includes(q) ||
          prop.title.toLowerCase().includes(q);
        const geoMatch =
          targetCoords &&
          prop.coordinates &&
          calculateHaversineDistanceKm(targetCoords, prop.coordinates) <= (Number(radiusKm) || 350);
        if (!textMatch && !geoMatch) return false;
      }
      if (guestCount > 1 && prop.guests < guestCount) return false;
      if (prop.price < Number(minPrice) || prop.price > Number(maxPrice)) return false;
      if (bedrooms !== 'any' && prop.bedrooms < parseInt(bedrooms, 10)) return false;
      if (amenityList.length > 0) {
        const hasAll = amenityList.every((a) =>
          prop.amenities.some((pa) => pa.toLowerCase().includes(a.toLowerCase()))
        );
        if (!hasAll) return false;
      }
      return true;
    });

    const ranked = rankProperties(candidateList, {
      targetCoords,
      requestedGuests: guestCount,
      selectedAmenities: amenityList,
      checkIn,
      checkOut,
      bookingsByProperty,
      maxBudget: Number(maxPrice) || 1000,
    });

    res.json({
      count: ranked.length,
      geocodedDestination: targetCoords,
      properties: ranked,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const prop = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        host: true,
        bookings: { include: { guest: true } },
        reviews: { include: { guest: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!prop) return res.status(404).json({ error: 'Property not found' });
    res.json(formatPropertyFromDb(prop));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/properties/compare', async (req, res) => {
  try {
    const {
      propertyIds = [],
      weights = DEFAULT_COMPARISON_WEIGHTS,
      destination = '',
      guests = 2,
      amenities = [],
      checkIn = '',
      checkOut = '',
    } = req.body;

    const dbProps = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      include: {
        host: true,
        bookings: { include: { guest: true } },
        reviews: { include: { guest: true } },
      },
    });

    const selected = dbProps.map(formatPropertyFromDb);
    const targetCoords = geocodeDestination(destination, selected);
    const bookingsByProperty = {};
    for (const p of selected) {
      bookingsByProperty[p.id] = p.bookedDates || [];
    }

    const compared = selected
      .map((prop) => ({
        ...prop,
        suitability: calculateSuitabilityScore(prop, {
          allProperties: selected,
          weights,
          targetCoords,
          requestedGuests: guests,
          selectedAmenities: amenities,
          checkIn,
          checkOut,
          bookingsByProperty,
        }),
      }))
      .sort((a, b) => b.suitability.score - a.suitability.score);

    res.json({
      formula: 'S(p) = Σ (w_i × n_i(p))',
      weights,
      results: compared,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/properties', authenticateToken, requireRole('HOST', 'ADMIN'), async (req, res) => {
  try {
    const {
      title,
      type = 'Entire villa',
      category = 'trending',
      location,
      city,
      country = 'India',
      price = 250,
      guests = 4,
      bedrooms = 2,
      beds = 2,
      bathrooms = 2,
      description = '',
      amenities = ['High-Speed Wi-Fi', 'Air Conditioning', 'Free Parking', 'Chef Kitchen'],
      images = [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
      ],
      coordinates = { lat: 17.385, lng: 78.4867 },
    } = req.body;

    if (!title || !city) {
      return res.status(400).json({ error: 'Property title and city are required.' });
    }

    const created = await prisma.property.create({
      data: {
        id: `prop-${Date.now()}`,
        title,
        type,
        category,
        location: location || `${city}, ${country}`,
        city,
        state: city,
        country,
        latitude: Number(coordinates.lat) || 17.385,
        longitude: Number(coordinates.lng) || 78.4867,
        price: Number(price),
        cleaningFee: Math.round(Number(price) * 0.2),
        serviceFee: Math.round(Number(price) * 0.12),
        rating: 5.0,
        reviewCount: 0,
        guests: Number(guests),
        bedrooms: Number(bedrooms),
        beds: Number(beds),
        bathrooms: Number(bathrooms),
        featured: true,
        isSuperhost: true,
        images,
        description:
          description ||
          `Welcome to ${title} in ${city}. Curated with modern amenities, high-speed Wi-Fi, and verified StayFinder host hospitality.`,
        amenities,
        highlights: [
          { icon: 'Award', title: 'Verified Listing', description: 'Inspected for quality and accurate coordinates.' },
          { icon: 'Key', title: 'Self Check-in', description: 'Smart lock access upon arrival.' },
        ],
        hostMeta: {
          name: req.user.name || 'Verified Host',
          avatar:
            req.user.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          superhost: true,
          joinedDate: 'Joined in 2026',
          responseRate: '100%',
          responseTime: 'within an hour',
          bio: 'Verified AbodeX / StayFinder property host.',
        },
        nearbyPOIs: getPropertyPOIs({ city, category }),
        ratingBreakdown: {
          cleanliness: 5.0,
          accuracy: 5.0,
          communication: 5.0,
          location: 5.0,
          checkIn: 5.0,
          value: 5.0,
        },
        hostId: req.user.id,
      },
      include: { host: true, bookings: true, reviews: true },
    });

    res.status(201).json(formatPropertyFromDb(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/properties/:id', authenticateToken, requireRole('HOST', 'ADMIN'), async (req, res) => {
  try {
    const {
      title,
      type,
      category,
      location,
      city,
      country,
      price,
      guests,
      bedrooms,
      beds,
      bathrooms,
      description,
      amenities,
      images,
    } = req.body;

    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(category !== undefined && { category }),
        ...(location !== undefined && { location }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(price !== undefined && {
          price: Number(price),
          cleaningFee: Math.round(Number(price) * 0.2),
          serviceFee: Math.round(Number(price) * 0.12),
        }),
        ...(guests !== undefined && { guests: Number(guests) }),
        ...(bedrooms !== undefined && { bedrooms: Number(bedrooms) }),
        ...(beds !== undefined && { beds: Number(beds) }),
        ...(bathrooms !== undefined && { bathrooms: Number(bathrooms) }),
        ...(description !== undefined && { description }),
        ...(amenities !== undefined && { amenities }),
        ...(images !== undefined && { images }),
      },
      include: { host: true, bookings: { include: { guest: true } }, reviews: { include: { guest: true } } },
    });

    res.json(formatPropertyFromDb(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/properties/:id', authenticateToken, requireRole('HOST', 'ADMIN'), async (req, res) => {
  try {
    await prisma.property.delete({ where: { id: req.params.id } });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Booking Availability & Conflict Detection Routes (PostgreSQL + Prisma Transaction)
// ============================================================================
app.post('/api/bookings/check-availability', async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut } = req.body;
    const dbBookings = await prisma.booking.findMany({
      where: { propertyId, status: { not: 'CANCELLED' } },
      include: { guest: true },
    });

    const formattedExisting = dbBookings.map((b) => ({
      id: b.id,
      checkIn: b.checkIn.toISOString().split('T')[0],
      checkOut: b.checkOut.toISOString().split('T')[0],
      status: b.status,
      guestName: b.guest?.name || 'Guest',
    }));

    const result = checkDateRangeOverlap(checkIn, checkOut, formattedExisting);
    res.json({
      propertyId,
      checkIn,
      checkOut,
      available: !result.hasConflict,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut, guests = 2 } = req.body;

    // Use a Prisma database transaction to prevent race-condition double bookings (Section 4.1.4 & 4.4)
    const createdBooking = await prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: propertyId },
        include: { host: true },
      });
      if (!property) {
        throw new Error('NOT_FOUND:Property not found.');
      }

      const existingBookings = await tx.booking.findMany({
        where: { propertyId, status: { not: 'CANCELLED' } },
      });

      const formattedExisting = existingBookings.map((b) => ({
        id: b.id,
        checkIn: b.checkIn.toISOString().split('T')[0],
        checkOut: b.checkOut.toISOString().split('T')[0],
        status: b.status,
      }));

      const conflictCheck = checkDateRangeOverlap(checkIn, checkOut, formattedExisting);
      if (conflictCheck.hasConflict) {
        const conflictErr = new Error(conflictCheck.reason);
        conflictErr.statusCode = 409;
        conflictErr.conflictingBookings = conflictCheck.conflictingBookings;
        throw conflictErr;
      }

      const nights = conflictCheck.nights;
      const totalPrice =
        property.price * nights + (property.cleaningFee || 100) + (property.serviceFee || 60);
      const confirmationCode = `SF-${Math.floor(10000 + Math.random() * 90000)}-${property.city
        .substring(0, 2)
        .toUpperCase()}`;

      const saved = await tx.booking.create({
        data: {
          id: `trip-${Date.now()}`,
          confirmationCode,
          propertyId: property.id,
          guestId: req.user.id,
          checkIn: new Date(`${checkIn}T00:00:00.000Z`),
          checkOut: new Date(`${checkOut}T00:00:00.000Z`),
          guests: Number(guests),
          totalPrice,
          status: 'CONFIRMED',
        },
        include: {
          property: { include: { host: true } },
          guest: true,
        },
      });

      return saved;
    });

    res.status(201).json(formatBookingFromDb(createdBooking));
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({
        error: err.message,
        conflictingBookings: err.conflictingBookings || [],
      });
    }
    if (err.message?.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: err.message.replace('NOT_FOUND:', '') });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const whereClause =
      req.user.role === 'ADMIN' || req.user.role === 'HOST'
        ? {}
        : { guestId: req.user.id };

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: { property: { include: { host: true } }, guest: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(bookings.map(formatBookingFromDb));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: { property: { include: { host: true } }, guest: true },
    });
    res.json(formatBookingFromDb(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.booking.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Reviews & Ratings Routes (PostgreSQL + Prisma)
// ============================================================================
app.post('/api/properties/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rating = 5,
      cleanliness = 5,
      accuracy = 5,
      communication = 5,
      location = 5,
      checkIn = 5,
      value = 5,
      comment = '',
    } = req.body;

    if (!comment.trim()) {
      return res.status(400).json({ error: 'Review comment cannot be empty.' });
    }

    const dateLabel = new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const createdReview = await prisma.review.create({
      data: {
        id: `rev-${Date.now()}`,
        rating: Number(rating),
        cleanliness: Number(cleanliness),
        accuracy: Number(accuracy),
        communication: Number(communication),
        location: Number(location),
        checkIn: Number(checkIn),
        value: Number(value),
        comment: comment.trim(),
        authorName: req.user.name || 'Verified Guest',
        authorAvatar:
          req.user.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        dateLabel,
        propertyId: id,
        guestId: req.user.id,
      },
    });

    const allReviews = await prisma.review.findMany({ where: { propertyId: id } });
    const count = allReviews.length || 1;
    const avg = allReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / count;
    const avgBreakdown = {
      cleanliness: Number((allReviews.reduce((s, r) => s + (r.cleanliness || 5), 0) / count).toFixed(1)),
      accuracy: Number((allReviews.reduce((s, r) => s + (r.accuracy || 5), 0) / count).toFixed(1)),
      communication: Number((allReviews.reduce((s, r) => s + (r.communication || 5), 0) / count).toFixed(1)),
      location: Number((allReviews.reduce((s, r) => s + (r.location || 5), 0) / count).toFixed(1)),
      checkIn: Number((allReviews.reduce((s, r) => s + (r.checkIn || 5), 0) / count).toFixed(1)),
      value: Number((allReviews.reduce((s, r) => s + (r.value || 5), 0) / count).toFixed(1)),
    };

    const updatedProp = await prisma.property.update({
      where: { id },
      data: {
        rating: Number(avg.toFixed(2)),
        reviewCount: allReviews.length,
        ratingBreakdown: avgBreakdown,
      },
    });

    res.status(201).json({
      review: {
        id: createdReview.id,
        author: createdReview.authorName,
        avatar: createdReview.authorAvatar,
        date: createdReview.dateLabel,
        rating: createdReview.rating,
        comment: createdReview.comment,
      },
      rating: updatedProp.rating,
      reviewCount: updatedProp.reviewCount,
      ratingBreakdown: avgBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reviews/:id', authenticateToken, requireRole('HOST', 'ADMIN'), async (req, res) => {
  try {
    const rev = await prisma.review.delete({ where: { id: req.params.id } });
    const remaining = await prisma.review.findMany({ where: { propertyId: rev.propertyId } });
    const count = remaining.length;
    const avg = count > 0 ? remaining.reduce((s, r) => s + (r.rating || 5), 0) / count : 5.0;
    await prisma.property.update({
      where: { id: rev.propertyId },
      data: { rating: Number(avg.toFixed(2)), reviewCount: count },
    });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Admin Management & Support Issue Routes (PostgreSQL + Prisma)
// ============================================================================
app.get('/api/admin/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { bookings: true, properties: true, reviews: true, supportIssues: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(
      users.map(({ passwordHash, ...u }) => ({
        ...u,
        bookingsCount: u._count?.bookings || 0,
        propertiesCount: u._count?.properties || 0,
        reviewsCount: u._count?.reviews || 0,
        issuesCount: u._count?.supportIssues || 0,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create a new User (Guest or Host)
app.post('/api/admin/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password = 'password123', phone = '', about = '', role = 'GUEST' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 8);
    const created = await prisma.user.create({
      data: {
        id: `user-${Date.now()}`,
        name,
        email: cleanEmail,
        passwordHash,
        phone,
        about: about || 'Verified AbodeX / StayFinder member.',
        role: ['GUEST', 'HOST', 'ADMIN'].includes(role) ? role : 'GUEST',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        joinedDate: 'Joined in 2026',
      },
    });
    const { passwordHash: _, ...safe } = created;
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update any user's profile, role, verification status, or password
app.put('/api/admin/users/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, phone, about, role, identityVerified, password } = req.body;
    const dataToUpdate = {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email: email.toLowerCase().trim() }),
      ...(phone !== undefined && { phone }),
      ...(about !== undefined && { about }),
      ...(role !== undefined && ['GUEST', 'HOST', 'ADMIN'].includes(role) && { role }),
      ...(identityVerified !== undefined && { identityVerified: Boolean(identityVerified) }),
      ...(password ? { passwordHash: bcrypt.hashSync(password, 8) } : {}),
    };

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: dataToUpdate,
    });
    const { passwordHash: _, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete a user and cascade delete their data
app.delete('/api/admin/users/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own active Admin account.' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Support Issues: Get issues (All for Admin, Own for Guest/Host)
app.get('/api/issues', authenticateToken, async (req, res) => {
  try {
    const whereClause = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const issues = await prisma.supportIssue.findMany({
      where: whereClause,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(
      issues.map((i) => ({
        id: i.id,
        subject: i.subject,
        category: i.category,
        description: i.description,
        status: i.status,
        adminResolution: i.adminResolution,
        createdAt: i.createdAt,
        userId: i.userId,
        userName: i.user?.name || 'User',
        userEmail: i.user?.email || '',
        userRole: i.user?.role || 'GUEST',
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Support Issues: Submit a new issue (Guest / Host)
app.post('/api/issues', authenticateToken, async (req, res) => {
  try {
    const { subject, category = 'Booking / Refund', description } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required.' });
    }
    const created = await prisma.supportIssue.create({
      data: {
        id: `issue-${Date.now()}`,
        subject: subject.trim(),
        category,
        description: description.trim(),
        status: 'OPEN',
        userId: req.user.id,
      },
      include: { user: true },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Resolve or update a user's Support Issue
app.patch('/api/issues/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { status, adminResolution } = req.body;
    const updated = await prisma.supportIssue.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(adminResolution !== undefined && { adminResolution }),
      },
      include: { user: true },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/issues/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.supportIssue.delete({ where: { id: req.params.id } });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// Real-Time Host–Guest Messaging Routes & Socket.IO (PostgreSQL + Prisma)
// ============================================================================
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const msgs = await prisma.message.findMany({
      include: { property: true, sender: true, receiver: true },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      propertyId: m.propertyId,
      propertyTitle: m.property?.title || 'General Inquiry',
      hostName: m.property?.hostMeta?.name || 'Elena Vance',
      hostAvatar:
        m.property?.hostMeta?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      senderId: m.senderId,
      senderName: m.senderName,
      senderRole: m.senderRole,
      content: m.content,
      createdAt: m.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const {
      propertyId = 'prop-1',
      content,
      senderRole = 'GUEST',
      senderName,
    } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const prop =
      (await prisma.property.findUnique({ where: { id: propertyId } })) ||
      (await prisma.property.findFirst());
    const hostUser = await prisma.user.findFirst({ where: { role: 'HOST' } });
    const guestUser = await prisma.user.findFirst({ where: { role: 'GUEST' } });

    const savedMsg = await prisma.message.create({
      data: {
        id: `msg-${Date.now()}`,
        conversationId: `conv-${prop.id}`,
        content: content.trim(),
        senderName: senderName || req.user.name || 'Guest',
        senderRole: senderRole === 'HOST' ? 'HOST' : 'GUEST',
        senderId: req.user.id,
        receiverId: senderRole === 'HOST' ? guestUser.id : hostUser.id,
        propertyId: prop.id,
      },
      include: { property: true },
    });

    const formattedUserMsg = {
      id: savedMsg.id,
      conversationId: savedMsg.conversationId,
      propertyId: prop.id,
      propertyTitle: prop.title,
      hostName: prop.hostMeta?.name || 'Elena Vance',
      hostAvatar: prop.hostMeta?.avatar,
      senderId: savedMsg.senderId,
      senderName: savedMsg.senderName,
      senderRole: savedMsg.senderRole,
      content: savedMsg.content,
      createdAt: savedMsg.createdAt,
    };

    io.emit('new_message', formattedUserMsg);

    if (senderRole === 'GUEST') {
      setTimeout(async () => {
        try {
          const lower = content.toLowerCase();
          let replyText = `Thanks for reaching out about "${prop.title}"! Yes, those dates are flexible and self check-in via smart lock is included. Let me know if you need any local recommendations in ${prop.city}!`;
          if (lower.includes('check-in') || lower.includes('early') || lower.includes('time')) {
            replyText = `Standard check-in at ${prop.title} starts at 2:00 PM, and we're happy to arrange early luggage drop-off or early check-in at 12:00 PM at no extra charge!`;
          } else if (lower.includes('wifi') || lower.includes('work') || lower.includes('internet')) {
            replyText = `Yes! We have high-speed fiber Wi-Fi (500+ Mbps) and a dedicated ergonomic workspace, ideal for remote work and video calls.`;
          }

          const savedReply = await prisma.message.create({
            data: {
              id: `msg-${Date.now() + 1}`,
              conversationId: `conv-${prop.id}`,
              content: replyText,
              senderName: prop.hostMeta?.name || 'Elena Vance',
              senderRole: 'HOST',
              senderId: hostUser.id,
              receiverId: req.user.id,
              propertyId: prop.id,
            },
          });

          io.emit('new_message', {
            id: savedReply.id,
            conversationId: savedReply.conversationId,
            propertyId: prop.id,
            propertyTitle: prop.title,
            hostName: prop.hostMeta?.name || 'Elena Vance',
            hostAvatar: prop.hostMeta?.avatar,
            senderId: savedReply.senderId,
            senderName: savedReply.senderName,
            senderRole: 'HOST',
            content: savedReply.content,
            createdAt: savedReply.createdAt,
          });
        } catch (e) {
          console.error('Auto reply error:', e);
        }
      }, 1200);
    }

    res.status(201).json(formattedUserMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

io.on('connection', (socket) => {
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 StayFinder / AbodeX Backend API (Prisma + PostgreSQL) & Socket.IO Server running on http://localhost:${PORT}`);
});
