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
function normalizePhoneNumber(input) {
    const digits = input.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
        return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
        return digits.slice(1);
    }
    if (digits.length > 10) {
        return digits.slice(-10);
    }
    return digits;
}
// MySQL Prisma User Lookup
async function findUserByCredentials(identifier) {
    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();
    const cleanDigits = clean.replace(/\D/g, '');
    const normalizedPhone = normalizePhoneNumber(clean);
    try {
        const whereConditions = [
            { phoneNumber: clean },
            { email: cleanLower },
            { email: clean }
        ];
        if (cleanDigits) {
            whereConditions.push({ phoneNumber: cleanDigits });
        }
        if (normalizedPhone) {
            whereConditions.push({ phoneNumber: normalizedPhone });
        }
        if (cleanDigits.length >= 10) {
            whereConditions.push({ phoneNumber: cleanDigits.slice(-10) });
        }
        const pUser = await prisma.user.findFirst({
            where: {
                OR: whereConditions
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
    }
    catch (error) {
        console.error('MySQL user lookup error:', error);
    }
    return null;
}
// MySQL Prisma User & Merchant / Rider Account Creation
async function createUserRecord(data) {
    console.log(`\n======================================================`);
    console.log(`👤 NEW USER REGISTRATION: Saving to MySQL Database...`);
    console.log(`   - Name: ${data.name}`);
    console.log(`   - Phone: ${data.phoneNumber}`);
    console.log(`   - Role: ${data.role}`);
    console.log(`   - Storage Target: MySQL ORM Database`);
    console.log(`======================================================\n`);
    const pUser = await prisma.user.create({
        data: {
            phoneNumber: data.phoneNumber,
            ...(data.email ? { email: data.email } : {}),
            passwordHash: data.passwordHash,
            name: data.name,
            role: data.role
        }
    });
    console.log(`✅ USER SAVED IN MYSQL! User ID: ${pUser.id}`);
    // If Merchant, auto-create Merchant Store profile in MySQL
    if (data.role === 'MERCHANT') {
        try {
            const merchant = await prisma.merchant.create({
                data: {
                    userId: pUser.id,
                    legalName: `${data.name}'s Express Store`,
                    gstNumber: `07${Date.now().toString().slice(-10)}Z1`,
                    bankAccountNumber: `ACC${Date.now().toString().slice(-8)}`,
                    bankIfsc: 'VJEX0001234',
                    isKycVerified: true
                }
            });
            console.log(`🏬 MERCHANT PROFILE SAVED IN MYSQL! Merchant ID: ${merchant.id}`);
        }
        catch (mErr) {
            console.warn('Merchant auto-profile creation notice:', mErr);
        }
    }
    // If Rider, auto-create Rider profile in MySQL
    if (data.role === 'RIDER') {
        try {
            const rider = await prisma.rider.create({
                data: {
                    userId: pUser.id,
                    vehicleNumber: `DL-01-${Date.now().toString().slice(-4)}`,
                    drivingLicense: `DL-LIC-${Date.now().toString().slice(-6)}`,
                    isAvailable: true
                }
            });
            console.log(`🛵 RIDER PROFILE SAVED IN MYSQL! Rider ID: ${rider.id}`);
        }
        catch (rErr) {
            console.warn('Rider auto-profile creation notice:', rErr);
        }
    }
    return {
        id: pUser.id,
        name: pUser.name,
        phoneNumber: pUser.phoneNumber,
        email: pUser.email || null,
        role: pUser.role,
        createdAt: pUser.createdAt
    };
}
// POST /api/auth/register — Register new user into MySQL
router.post('/register', async (req, res) => {
    try {
        const parseResult = RegisterSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
            return;
        }
        const { phoneNumber, email, password, name, role } = parseResult.data;
        const cleanPhone = normalizePhoneNumber(phoneNumber);
        const formattedEmail = email && email.trim() !== '' ? email.trim().toLowerCase() : null;
        if (cleanPhone.length < 10) {
            res.status(400).json({ error: 'Please enter a valid 10-digit mobile phone number.' });
            return;
        }
        // Check existing user in MySQL
        const existingUser = await findUserByCredentials(cleanPhone);
        if (existingUser) {
            res.status(409).json({ error: 'Account with this phone number already exists.' });
            return;
        }
        if (formattedEmail) {
            const existingEmail = await findUserByCredentials(formattedEmail);
            if (existingEmail) {
                res.status(409).json({ error: 'Account with this email address already exists.' });
                return;
            }
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await createUserRecord({
            phoneNumber: cleanPhone,
            email: formattedEmail,
            passwordHash,
            name,
            role
        });
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET || 'vj_shopping_world_jwt_super_secret_key_2026', { expiresIn: '7d' });
        res.status(201).json({
            message: 'Account created successfully in MySQL database!',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                phoneNumber: newUser.phoneNumber,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error?.message?.includes("Can't reach database server") || error?.code === 'P1001') {
            res.status(503).json({
                error: 'MySQL database connection required.',
                message: 'DATABASE_URL is not set on Render Dashboard. Please add your MySQL connection string in Render Environment Variables.'
            });
            return;
        }
        res.status(500).json({ error: 'Registration process failed', message: error?.message || 'Server error' });
    }
});
// POST /api/auth/login — Authenticate user from MySQL
router.post('/login', async (req, res) => {
    try {
        const parseResult = LoginSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
            return;
        }
        const { identifier, phoneNumber, email, password } = parseResult.data;
        const loginTarget = identifier || phoneNumber || email;
        if (!loginTarget) {
            res.status(400).json({ error: 'Phone number or email is required for login.' });
            return;
        }
        const user = await findUserByCredentials(loginTarget);
        if (!user) {
            res.status(401).json({ error: 'Invalid phone number / email or password.' });
            return;
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid phone number / email or password.' });
            return;
        }
        console.log(`🔐 LOGIN SUCCESS: Authenticated User [ID: ${user.id}, Name: ${user.name}, Role: ${user.role}] from MySQL`);
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'vj_shopping_world_jwt_super_secret_key_2026', { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
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
    }
    catch (error) {
        console.error('Login error:', error);
        if (error?.message?.includes("Can't reach database server") || error?.code === 'P1001') {
            res.status(503).json({
                error: 'MySQL database connection required.',
                message: 'DATABASE_URL is not set on Render Dashboard. Please add your MySQL connection string in Render Environment Variables.'
            });
            return;
        }
        res.status(500).json({ error: 'Login process failed', message: error?.message || 'Server error' });
    }
});
// GET /api/auth/me — Fetch current authenticated user profile from MySQL
router.get('/me', authenticateJwt, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized token.' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                phoneNumber: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                merchant: true,
                rider: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User profile not found in MySQL database.' });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error('Fetch me error:', error);
        return res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
});
// PUT /api/auth/profile — Update customer personal profile in MySQL
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
                email: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });
        return res.json({
            message: 'Profile details updated successfully in MySQL database',
            user: updatedUser
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Failed to update profile.' });
    }
});
// DELETE /api/auth/account — Delete user account in MySQL
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
        return res.json({ message: 'Account disabled successfully in MySQL database.' });
    }
    catch (error) {
        console.error('Delete account error:', error);
        return res.status(500).json({ error: 'Failed to delete account.' });
    }
});
// PUT /api/auth/role — Upgrade user role in MySQL
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
                email: true,
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
