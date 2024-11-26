const User = require('../models/User');

async function resetAllUserStatuses() {
    try {
        await User.updateMany(
            { status: 'online' },
            { $set: { status: 'offline' } }
        );
        console.log('Successfully reset all user statuses to offline');
    } catch (error) {
        console.error('Error resetting user statuses:', error);
    }
}

module.exports = {
    resetAllUserStatuses
};
