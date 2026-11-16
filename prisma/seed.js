import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { properties as seedProperties } from '../src/data/properties.js';
import { mockUser } from '../src/data/mockUser.js';
import { getPropertyPOIs } from '../src/utils/stayfinderAlgorithms.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AbodeX / StayFinder PostgreSQL Database...');

  const passwordHash = bcrypt.hashSync('password123', 8);

  // 1. Upsert Users (Guest, Host, Admin)
  const guestUser = await prisma.user.upsert({
    where: { email: 'alex.rivera@example.com' },
    update: {},
    create: {
      id: 'user-101',
      name: mockUser.name,
      email: mockUser.email,
      passwordHash,
      role: 'GUEST',
      avatar: mockUser.avatar,
      phone: mockUser.phone,
      about: mockUser.about,
      joinedDate: mockUser.joinedDate,
      identityVerified: true,
      superguest: true,
    },
  });

  const hostUser = await prisma.user.upsert({
    where: { email: 'elena.vance@abodex.com' },
    update: {},
    create: {
      id: 'host-201',
      name: 'Elena Vance',
      email: 'elena.vance@abodex.com',
      passwordHash,
      role: 'HOST',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      phone: '+1 (310) 555-0192',
      about: 'Architectural designer & Superhost managing luxury coastal and heritage villas on AbodeX / StayFinder.',
      joinedDate: 'Joined in May 2018',
      identityVerified: true,
      superguest: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@abodex.com' },
    update: {},
    create: {
      id: 'admin-301',
      name: 'Sharath Babu (Admin)',
      email: 'admin@abodex.com',
      passwordHash,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      phone: '+91 98765 43210',
      about: 'StayFinder / AbodeX System Administrator overseeing platform listings, bookings, and trust & safety.',
      joinedDate: 'Platform Administrator',
      identityVerified: true,
      superguest: true,
    },
  });

  // 2. Upsert Properties & their Reviews
  for (const prop of seedProperties) {
    const pois = getPropertyPOIs(prop);
    await prisma.property.upsert({
      where: { id: prop.id },
      update: {
        title: prop.title,
        price: prop.price,
        nearbyPOIs: pois,
      },
      create: {
        id: prop.id,
        title: prop.title,
        type: prop.type,
        category: prop.category,
        description: prop.description,
        location: prop.location,
        city: prop.city,
        state: prop.state || prop.city,
        country: prop.country,
        latitude: prop.coordinates?.lat || 0,
        longitude: prop.coordinates?.lng || 0,
        price: prop.price,
        cleaningFee: prop.cleaningFee || 100,
        serviceFee: prop.serviceFee || 60,
        guests: prop.guests,
        bedrooms: prop.bedrooms,
        beds: prop.beds,
        bathrooms: prop.bathrooms,
        rating: prop.rating,
        reviewCount: prop.reviewCount,
        featured: Boolean(prop.featured),
        isSuperhost: Boolean(prop.isSuperhost),
        images: prop.images,
        amenities: prop.amenities,
        highlights: prop.highlights || [],
        hostMeta: prop.host || {},
        nearbyPOIs: pois,
        ratingBreakdown: prop.ratingBreakdown || {},
        hostId: hostUser.id,
      },
    });

    // Seed Reviews for this property
    if (prop.reviews && prop.reviews.length > 0) {
      for (const rev of prop.reviews) {
        await prisma.review.upsert({
          where: { id: rev.id },
          update: {},
          create: {
            id: rev.id,
            rating: rev.rating || 5,
            cleanliness: prop.ratingBreakdown?.cleanliness || 5,
            accuracy: prop.ratingBreakdown?.accuracy || 5,
            communication: prop.ratingBreakdown?.communication || 5,
            location: prop.ratingBreakdown?.location || 5,
            checkIn: prop.ratingBreakdown?.checkIn || 5,
            value: prop.ratingBreakdown?.value || 5,
            comment: rev.comment,
            authorName: rev.author,
            authorAvatar: rev.avatar,
            dateLabel: rev.date,
            propertyId: prop.id,
            guestId: guestUser.id,
          },
        });
      }
    }
  }

  // 3. Seed Initial Bookings (Upcoming & Past)
  const initialBookings = [
    {
      id: 'trip-1',
      confirmationCode: 'HM-82914-ML',
      propertyId: 'prop-1',
      guestId: guestUser.id,
      checkIn: new Date('2026-10-14T00:00:00.000Z'),
      checkOut: new Date('2026-10-19T00:00:00.000Z'),
      guests: 2,
      totalPrice: 3665,
      status: 'CONFIRMED',
    },
    {
      id: 'trip-2',
      confirmationCode: 'HM-11048-AS',
      propertyId: 'prop-2',
      guestId: guestUser.id,
      checkIn: new Date('2026-12-22T00:00:00.000Z'),
      checkOut: new Date('2026-12-27T00:00:00.000Z'),
      guests: 4,
      totalPrice: 1897,
      status: 'CONFIRMED',
    },
    {
      id: 'past-1',
      confirmationCode: 'HM-55320-SA',
      propertyId: 'prop-3',
      guestId: guestUser.id,
      checkIn: new Date('2026-05-10T00:00:00.000Z'),
      checkOut: new Date('2026-05-16T00:00:00.000Z'),
      guests: 2,
      totalPrice: 3345,
      status: 'COMPLETED',
    },
    {
      id: 'past-2',
      confirmationCode: 'HM-39104-KY',
      propertyId: 'prop-8',
      guestId: guestUser.id,
      checkIn: new Date('2025-11-04T00:00:00.000Z'),
      checkOut: new Date('2025-11-10T00:00:00.000Z'),
      guests: 2,
      totalPrice: 2485,
      status: 'COMPLETED',
    },
  ];

  for (const b of initialBookings) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }

  // 4. Seed Initial Wishlist Items
  for (const propId of ['prop-1', 'prop-3', 'prop-8']) {
    await prisma.wishlistItem.upsert({
      where: {
        userId_propertyId: {
          userId: guestUser.id,
          propertyId: propId,
        },
      },
      update: {},
      create: {
        userId: guestUser.id,
        propertyId: propId,
      },
    });
  }

  // 5. Seed Initial Messages
  await prisma.message.upsert({
    where: { id: 'msg-seed-1' },
    update: {},
    create: {
      id: 'msg-seed-1',
      conversationId: 'conv-prop-1',
      content:
        'Hi Alex! Welcome to AbodeX / StayFinder. Let me know if you have any questions about The Glass Pavilion, check-in times, or nearby Malibu attractions!',
      senderName: 'Elena Vance',
      senderRole: 'HOST',
      senderId: hostUser.id,
      receiverId: guestUser.id,
      propertyId: 'prop-1',
    },
  });

  await prisma.message.upsert({
    where: { id: 'msg-seed-2' },
    update: {},
    create: {
      id: 'msg-seed-2',
      conversationId: 'conv-prop-2',
      content:
        'Hi Alex! Our Nordic A-Frame Cabin in Aspen is ready with firewood and the cedar hot tub heated. Let us know if you need ski lift passes or shuttle tips.',
      senderName: 'Lars Lindqvist',
      senderRole: 'HOST',
      senderId: hostUser.id,
      receiverId: guestUser.id,
      propertyId: 'prop-2',
    },
  });

  // 6. Seed Initial Support Issues for Admin Resolution
  await prisma.supportIssue.upsert({
    where: { id: 'issue-seed-1' },
    update: {},
    create: {
      id: 'issue-seed-1',
      subject: 'Requesting date modification for Malibu reservation HM-82914-ML',
      category: 'Booking / Dates',
      description: 'Hi Admin, our flight to California was shifted by 1 day. Can we adjust our check-in date or get fee waiver approval?',
      status: 'OPEN',
      userId: guestUser.id,
    },
  });

  await prisma.supportIssue.upsert({
    where: { id: 'issue-seed-2' },
    update: {},
    create: {
      id: 'issue-seed-2',
      subject: 'Host payout verification & Superhost badge renewal',
      category: 'Host Account',
      description: 'Submitted updated tax and payout routing details for our luxury villa listings.',
      status: 'IN_PROGRESS',
      adminResolution: 'Documents received and verified by Admin team. Superhost badge active.',
      userId: hostUser.id,
    },
  });

  console.log(`✅ Database seeded with ${seedProperties.length} properties, 3 role users (Guest/Host/Admin), 4 bookings, reviews, wishlist, messages, and support issues!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
