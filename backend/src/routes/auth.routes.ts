import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import UserMongo from '../models/user.model.js';
import { authenticateJwt, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

const RegisterSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['BUYER', 'MERCHANT', 'RIDER']).default('BUYER')
});

const LoginSchema = z.object({
  identifier: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1)
});

// Resilient User Lookup (Tries PostgreSQL Prisma first, falls back to MongoDB Atlas)
async function findUserByCredentials(identifier: string) {
  const clean = identifier.trim();
  const cleanLower = clean.toLowerCase();

  // 1. Try PostgreSQL via Prisma
  try {
    const pUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: clean },
          { email: cleanLower },
          { email: clean }
        ]
      }
    });
    if (pUser) {
      return {
        id: pUser.id,
        name: pUser.name,
        phoneNumber: pUser.phoneNumber,
        email: pUser.email || null,
        passwordHash: pUser.passwordHash,
        role: pUser.role || 'BUYER',
        createdAt: pUser.createdAt
      };
    }
  } catch (pErr) {
    try {
      const pUserPhone = await prisma.user.findFirst({
        where: { phoneNumber: clean }
      });
      if (pUserPhone) {
        return {
          id: pUserPhone.id,
          name: pUserPhone.name,
          phoneNumber: pUserPhone.phoneNumber,
          email: pUserPhone.email || null,
          passwordHash: pUserPhone.passwordHash,
          role: pUserPhone.role || 'BUYER',
          createdAt: pUserPhone.createdAt
        };
      }
    } catch {}
  }

  // 2. Try MongoDB Atlas Fallback
  try {
    const mUser = await UserMongo.findOne({
      $or: [
        { phoneNumber: clean },
        { email: cleanLower }
      ]
    });
    if (mUser) {
      return {
        id: mUser._id.toString(),
        name: mUser.name,
        phoneNumber: mUser.phoneNumber,
        email: mUser.email || null,
        passwordHash: mUser.passwordHash,
        role: mUser.role || 'BUYER',
        createdAt: mUser.createdAt
      };
    }
  } catch (mErr) {}

  return null;
}

// Resilient User Creation (Tries PostgreSQL Prisma first, falls back to MongoDB Atlas)
async function createUserRecord(data: { phoneNumber: string; email?: string | null; passwordHash: string; name: string; role: string }) {
  // 1. Try PostgreSQL via Prisma
  try {
    const pUser = await prisma.user.create({
      data: {
        phoneNumber: data.phoneNumber,
        ...(data.email ? { email: data.email } : {}),
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role as any
      }
    });
    return {
      id: pUser.id,
      name: pUser.name,
      phoneNumber: pUser.phoneNumber,
      email: pUser.email || null,
      role: pUser.role,
      createdAt: pUser.createdAt
    };
  } catch (pErr: any) {
    console.warn('PostgreSQL creation unavailable, storing user in MongoDB Atlas:', pErr?.message || pErr);
  }

  // 2. Fallback to MongoDB Atlas
  const mUser = await UserMongo.create({
    phoneNumber: data.phoneNumber,
    email: data.email || undefined,
    passwordHash: data.passwordHash,
    name: data.name,
    role: data.role
  });

  return {
    id: mUser._id.toString(),
    name: mUser.name,
    phoneNumber: mUser.phoneNumber,
    email: mUser.email || null,
    role: mUser.role,
    createdAt: mUser.createdAt
  };
}

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      const firstMsg = Object.values(fieldErrors).flat()[0] || 'Validation failed';
      return res.status(400).json({ error: firstMsg, details: parseResult.error.flatten() });
    }

    const { phoneNumber, email, password, name, role } = parseResult.data;
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Check if user already exists
    const existingUser = await findUserByCredentials(phoneNumber) || (cleanEmail ? await findUserByCredentials(cleanEmail) : null);

    if (existingUser) {
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(409).json({ error: 'An account with this phone number already exists.' });
      }
      if (cleanEmail && existingUser.email === cleanEmail) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }
      return res.status(409).json({ error: 'User already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User Record
    const user = await createUserRecord({
      phoneNumber,
      email: cleanEmail,
      passwordHash,
      name,
      role
    });

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'vj_shopping_world_jwt_super_secret_key_2026',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Please provide valid credentials.', details: parseResult.error.flatten() });
    }

    const { identifier, phoneNumber, email, password } = parseResult.data;
    const loginId = (identifier || phoneNumber || email || '').trim();

    if (!loginId) {
      return res.status(400).json({ error: 'Please enter your email or 10-digit mobile number.' });
    }

    const user = await findUserByCredentials(loginId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/mobile number or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/mobile number or password.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'vj_shopping_world_jwt_super_secret_key_2026',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized user.' });

    let user: any = null;

    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
          merchant: true,
          rider: true
        }
      });
    } catch {}

    if (!user) {
      const mUser = await UserMongo.findById(userId);
      if (mUser) {
        user = {
          id: mUser._id.toString(),
          name: mUser.name,
          phoneNumber: mUser.phoneNumber,
          email: mUser.email || null,
          role: mUser.role || 'BUYER',
          isActive: mUser.isActive,
          createdAt: mUser.createdAt
        };
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// PUT /api/auth/profile — Update customer personal profile
router.put('/profile', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phoneNumber } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user.' });
    }

    let updatedUser: any = null;

    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name ? { name } : {}),
          ...(phoneNumber ? { phoneNumber } : {})
        },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });
    } catch {}

    if (!updatedUser) {
      const mUser = await UserMongo.findByIdAndUpdate(
        userId,
        {
          ...(name ? { name } : {}),
          ...(phoneNumber ? { phoneNumber } : {})
        },
        { new: true }
      );
      if (mUser) {
        updatedUser = {
          id: mUser._id.toString(),
          name: mUser.name,
          phoneNumber: mUser.phoneNumber,
          email: mUser.email || null,
          role: mUser.role || 'BUYER',
          isActive: mUser.isActive,
          createdAt: mUser.createdAt
        };
      }
    }

    return res.json({
      message: 'Profile details updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// DELETE /api/auth/account — Delete customer account
router.delete('/account', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user.' });
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });
    } catch {
      await UserMongo.findByIdAndUpdate(userId, { isActive: false });
    }

    return res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// PUT /api/auth/role — Upgrade or update user role (BUYER -> MERCHANT / RIDER)
router.put('/role', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user.' });
    }

    if (!['BUYER', 'MERCHANT', 'RIDER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    let updatedUser: any = null;

    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      });
    } catch {}

    if (!updatedUser) {
      const mUser = await UserMongo.findByIdAndUpdate(userId, { role }, { new: true });
      if (mUser) {
        updatedUser = {
          id: mUser._id.toString(),
          name: mUser.name,
          phoneNumber: mUser.phoneNumber,
          email: mUser.email || null,
          role: mUser.role || 'BUYER',
          isActive: mUser.isActive,
          createdAt: mUser.createdAt
        };
      }
    }

    const token = jwt.sign(
      { id: updatedUser.id, role: updatedUser.role },
      process.env.JWT_SECRET || 'vj_shopping_world_jwt_super_secret_key_2026',
      { expiresIn: '7d' }
    );

    return res.json({
      message: `Role successfully updated to ${role}`,
      token,
      user: updatedUser
    });
  } catch (error) {
    console.error('Role update error:', error);
    return res.status(500).json({ error: 'Failed to update account role.' });
  }
});

export default router;
