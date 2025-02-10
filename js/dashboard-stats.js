// Dashboard Statistics Management

function updateDashboardStats() {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return;

    // Filter entries for current user
    const userEntries = entries.filter(entry => entry.userId === currentUser.id);

    // Update total entries
    const totalEntries = userEntries.length;
    document.getElementById('totalEntries').textContent = totalEntries;

    // Calculate streaks
    const streakInfo = calculateStreak();
    document.getElementById('currentStreak').textContent = `${streakInfo.currentStreak} days`;
    document.getElementById('longestStreak').textContent = `${streakInfo.longestStreak} days`;

    // Calculate average mood
    if (userEntries.length > 0) {
        const moodValues = {
            'Very Happy': 5,
            'Happy': 4,
            'Neutral': 3,
            'Sad': 2,
            'Very Sad': 1
        };

        const moodSum = userEntries.reduce((sum, entry) => {
            return sum + (moodValues[entry.mood] || 3);
        }, 0);

        const averageMoodValue = moodSum / userEntries.length;
        let averageMoodText = 'Neutral';

        if (averageMoodValue >= 4.5) averageMoodText = 'Very Happy';
        else if (averageMoodValue >= 3.5) averageMoodText = 'Happy';
        else if (averageMoodValue >= 2.5) averageMoodText = 'Neutral';
        else if (averageMoodValue >= 1.5) averageMoodText = 'Sad';
        else averageMoodText = 'Very Sad';

        document.getElementById('averageMood').textContent = averageMoodText;
    }

    // Update entry counts by timeframe
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayEntries = userEntries.filter(entry => new Date(entry.timestamp) >= todayStart).length;
    const weekEntries = userEntries.filter(entry => new Date(entry.timestamp) >= weekStart).length;
    const monthEntries = userEntries.filter(entry => new Date(entry.timestamp) >= monthStart).length;

    // Update counts in the filter buttons
    document.getElementById('todayCount').textContent = `(${todayEntries})`;
    document.getElementById('weekCount').textContent = `(${weekEntries})`;
    document.getElementById('monthCount').textContent = `(${monthEntries})`;
    document.getElementById('allCount').textContent = `(${totalEntries})`;

    // Calculate completion rate
    const completedEntries = userEntries.filter(entry => entry.completed).length;
    const completionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;
    document.getElementById('completionRate').textContent = `${completionRate}%`;

    // Update entries count in the header
    document.getElementById('entriesCount').textContent = `${totalEntries} total entries`;
}

// Function to calculate mood distribution
function getMoodDistribution() {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return {};

    const userEntries = entries.filter(entry => entry.userId === currentUser.id);
    const distribution = {
        'Very Happy': 0,
        'Happy': 0,
        'Neutral': 0,
        'Sad': 0,
        'Very Sad': 0
    };

    userEntries.forEach(entry => {
        if (distribution.hasOwnProperty(entry.mood)) {
            distribution[entry.mood]++;
        }
    });

    return distribution;
}

// Function to get writing time statistics
function getWritingTimeStats() {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return { average: 0, total: 0 };

    const userEntries = entries.filter(entry => entry.userId === currentUser.id);
    const totalTime = userEntries.reduce((sum, entry) => sum + (entry.writingTime || 0), 0);
    const averageTime = userEntries.length > 0 ? Math.round(totalTime / userEntries.length) : 0;

    return {
        average: averageTime,
        total: totalTime
    };
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateDashboardStats,
        getMoodDistribution,
        getWritingTimeStats
    };
}
