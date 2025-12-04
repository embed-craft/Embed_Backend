const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

class AuthController {

    /**
     * Login User (Super Admin or Client)
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // 1. Find User
            console.log('Login attempt for:', email);
            const user = await User.findOne({ email }).select('+password').populate('organization_id');
            if (!user) {
                console.log('User not found');
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 2. Check Password
            const isMatch = await user.matchPassword(password);
            console.log('Password match:', isMatch);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 3. Check Contract Status (If Client)
            if (user.role !== 'super_admin' && user.organization_id) {
                const org = user.organization_id;

                // Check if Org is Active
                if (!org.is_active) {
                    return res.status(403).json({ error: 'Account is inactive. Contact support.' });
                }

                // Check Contract Expiry
                if (org.contract_end_date && new Date() > new Date(org.contract_end_date)) {
                    return res.status(403).json({ error: 'Contract expired. Please renew.' });
                }
            }

            // 4. Generate Token
            const token = jwt.sign(
                { id: user._id, role: user.role, orgId: user.organization_id?._id },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // 5. Return Response
            res.json({
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    organization: user.organization_id
                }
            });

        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ error: 'Server Error' });
        }
    }

    /**
     * Register User (Internal / Super Admin only for now)
     * POST /api/auth/register
     */
    async register(req, res) {
        try {
            const { email, password, role, organization_id } = req.body;

            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ error: 'User already exists' });
            }

            user = await User.create({
                email,
                password,
                role,
                organization_id
            });

            res.status(201).json({ message: 'User created successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Change Password
     * POST /api/auth/change-password
     */
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            // Get user with password field included
            const user = await User.findById(req.user.id).select('+password');

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ error: 'Incorrect current password' });
            }

            // Update password (pre-save hook will hash it)
            user.password = newPassword;
            await user.save();

            res.json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error('Change Password Error:', error);
            res.status(500).json({ error: 'Failed to update password' });
        }
    }
}

module.exports = new AuthController();
