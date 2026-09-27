import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
const router = Router();
const RegisterSchema = z.object({
    phoneNumber: z.string().min(10).max(15),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['BUYER', 'MERCHANT', 'RIDER']).default('BUYER')
});
const LoginSchema = z.object({
    phoneNumber: z.string(),
    password: z.string()
});
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const parseResult = RegisterSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
        }
        const { phoneNumber, password, name, role } = parseResult.data;
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber }
        });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this phone number already exists.' });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        // Create user
        const user = await prisma.user.create({
            data: {
                phoneNumber,
                passwordHash,
                name,
                role
            }
        });
        // Issue JWT
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'vj_shopping_world_jwt_super_secret_key_2026', { expiresIn: '7d' });
        // Return response without passwordHash
        return res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    }
    catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({ error: 'Internal server error during registration.' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const parseResult = LoginSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
        }
        const { phoneNumber, password } = parseResult.data;
        const user = await prisma.user.findUnique({
            where: { phoneNumber }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid phone number or password.' });
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid phone number or password.' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'vj_shopping_world_jwt_super_secret_key_2026', { expiresIn: '7d' });
        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ error: 'Internal server error during login.' });
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
export default router;
