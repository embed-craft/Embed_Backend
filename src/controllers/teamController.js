const User = require('../models/User');
const crypto = require('crypto');

/**
 * Get all team members for the authenticated organization
 */
exports.getMembers = async (req, res) => {
    try {
        const team = await User.find({ organization_id: req.orgId }).select('-password');
        res.json({ team });
    } catch (error) {
        console.error('Get Members Error:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
};

/**
 * Invite a new team member
 */
exports.inviteMember = async (req, res) => {
    try {
        const { email, role } = req.body; // Name is not in User schema yet

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Generate random temp password
        // Generate random temp password
        const tempPassword = '1234'; // Default password as requested

        user = await User.create({
            name: req.body.name, // Save the name provided in invitation
            email,
            password: tempPassword, // Will be hashed by pre-save hook
            role: role || 'editor',
            organization_id: req.orgId
        });

        // In a real app, send email with tempPassword here
        console.log(`Invited user ${email} with password: ${tempPassword}`);

        res.status(201).json({
            message: 'Invitation sent successfully',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                id: user._id,
                email: user.email,
                role: user.role,
                status: 'active'
            },
            tempPassword // Return temp password so admin can share it manually
        });
    } catch (error) {
        console.error('Invite Member Error:', error);
        res.status(500).json({ error: 'Failed to invite user' });
    }
};

/**
 * Remove a team member
 */
exports.removeMember = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting self
        if (id === req.user.id) {
            return res.status(400).json({ error: 'Cannot remove yourself' });
        }

        const deletedUser = await User.findOneAndDelete({
            _id: id,
            organization_id: req.orgId
        });

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User removed successfully' });
    } catch (error) {
        console.error('Remove Member Error:', error);
        res.status(500).json({ error: 'Failed to remove user' });
    }
};
