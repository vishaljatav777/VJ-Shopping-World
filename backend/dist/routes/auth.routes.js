import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
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
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const parseResult = RegisterSchema.safeParse(req.body);
        if (!parseResult.success) {
            const fieldErrors = parseResult.error.flatten().fieldErrors;
            const firstMsg = Object.values(fieldErrors).flat()[0] || 'Validation failed';
            return res.status(400).json({ error: firstMsg, details: parseResult.error.flatten() });
        }
        const { phoneNumber, email, password, name, role } = parseResult.data;
        const cleanEmail = email ? email.trim().toLowerCase() : null;
        // Check if user exists by phone or email (with resilient fallback for DB schema)
        let existingUser = null;
        try {
            existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phoneNumber },
                        ...(cleanEmail ? [{ email: cleanEmail }] : [])
                    ]
                }
            });
        }
        catch (dbErr) {
            console.warn('Registration query with email failed, falling back to phoneNumber query:', dbErr?.message || dbErr);
            try {
                existingUser = await prisma.user.findFirst({
                    where: { phoneNumber }
                });
            }
            catch (fallbackErr) {
                console.error('Registration database lookup error:', fallbackErr);
            }
        }
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
        // Create user with graceful fallback if email column is absent
        let user;
        try {
            user = await prisma.user.create({
                data: {
                    phoneNumber,
                    ...(cleanEmail ? { email: cleanEmail } : {}),
                    passwordHash,
                    name,
                    role
                }
            });
        }
        catch (createErr) {
            console.warn('Registration user creation with email failed, falling back without email:', createErr?.message || createErr);
            user = await prisma.user.create({
                data: {
                    phoneNumber,
                    passwordHash,
                    name,
                    role
                }
            });
        }
        // Issue JWT
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'vj_shopping_world_jwt_super_secret_key_2026', { expiresIn: '7d' });
        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                email: user.email || null,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    }
    catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({ error: error?.message || 'Internal server error during registration.' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
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
        let user = null;
        try {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phoneNumber: loginId },
                        { email: loginId.toLowerCase() },
                        { email: loginId }
                    ]
                }
            });
        }
        catch (findErr) {
            console.warn('Login attempt with email failed, falling back to phoneNumber lookup:', findErr?.message || findErr);
            try {
                user = await prisma.user.findFirst({
                    where: { phoneNumber: loginId }
                });
            }
            catch (fallbackErr) {
                console.error('Login database query error:', fallbackErr);
            }
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid email/mobile number or password.' });
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email/mobile number or password.' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'vj_shopping_world_jwt_super_secret_key_2026', { expiresIn: '7d' });
        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                email: user.email || null,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ error: error?.message || 'Internal server error during login.' });
    }
});
// GET /api/auth/me
router.get('/me', authenticateJwt, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
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
        if (!user) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        return res.json({ user });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
});
// PUT /api/auth/profile — Update customer personal profile
router.put('/profile', authenticateJwt, async (req, res) => {
    try {
        const { name, phoneNumber } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized user.' });
        }
        const updatedUser = await prisma.user.update({
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
        return res.json({
            message: 'Profile details updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Failed to update profile.' });
    }
});
// DELETE /api/auth/account — Delete customer account
router.delete('/account', authenticateJwt, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized user.' });
        }
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false }
        });
        return res.json({ message: 'Account deleted successfully.' });
    }
    catch (error) {
        console.error('Delete account error:', error);
        return res.status(500).json({ error: 'Failed to delete account.' });
    }
});
// PUT /api/auth/role — Upgrade or update user role (BUYER -> MERCHANT / RIDER)
router.put('/role', authenticateJwt, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized user.' });
        }
        if (!['BUYER', 'MERCHANT', 'RIDER'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role.' });
        }
        const updatedUser = await prisma.user.update({
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
        const token = jwt.sign({ id: updatedUser.id, role: updatedUser.role }, process.env.JWT_SECRET || 'vj_shopping_world_jwt_super_secret_key_2026', { expiresIn: '7d' });
        return res.json({
            message: `Role successfully updated to ${role}`,
            token,
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Role update error:', error);
        return res.status(500).json({ error: 'Failed to update account role.' });
    }
});
export default router;
