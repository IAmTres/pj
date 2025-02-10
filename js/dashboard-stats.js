// Dashboard Statistics Management
let currentMoodTimeframe = 'week';

function refreshStats() {
    const button = document.querySelector('button[onclick="refreshStats()"]');
    button.classList.add('animate-spin');
    
    // Simulate refresh delay
    setTimeout(() => {
        updateDashboardStats();
        button.classList.remove('animate-spin');
        
        // Show refresh notification
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center shadow-lg transform translate-y-full transition-transform duration-300';
        notification.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            <span>Statistics updated</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateY(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }, 800);
}

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
function changeMoodTimeframe(timeframe) {
    currentMoodTimeframe = timeframe;
    
    // Update active state of buttons
    document.querySelectorAll('[onclick^="changeMoodTimeframe"]').forEach(btn => {
        if (btn.getAttribute('onclick').includes(timeframe)) {
            btn.classList.add('bg-primary-100', 'text-primary-600');
            btn.classList.remove('bg-gray-100', 'text-gray-600');
        } else {
            btn.classList.remove('bg-primary-100', 'text-primary-600');
            btn.classList.add('bg-gray-100', 'text-gray-600');
        }
    });
    
    updateMoodDistribution();
}

function getMoodDistribution() {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return {};

    const userEntries = entries.filter(entry => entry.userId === currentUser.id);
    const distribution = {
        'great': 0,
        'good': 0,
        'okay': 0,
        'down': 0,
        'rough': 0
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

function updateMoodDistribution() {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return;
    
    // Filter entries by timeframe and user
    const now = new Date();
    const filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        const daysDiff = (now - entryDate) / (1000 * 60 * 60 * 24);
        
        return entry.userId === currentUser.id && (
            (currentMoodTimeframe === 'week' && daysDiff <= 7) ||
            (currentMoodTimeframe === 'month' && daysDiff <= 30) ||
            currentMoodTimeframe === 'all'
        );
    });
    
    // Count moods
    const moodCounts = {
        'great': 0,
        'good': 0,
        'okay': 0,
        'down': 0,
        'rough': 0
    };
    
    filteredEntries.forEach(entry => {
        if (moodCounts.hasOwnProperty(entry.mood)) {
            moodCounts[entry.mood]++;
        }
    });
    
    // Update UI
    const moodColors = {
        'great': 'bg-green-500',
        'good': 'bg-blue-500',
        'okay': 'bg-yellow-500',
        'down': 'bg-orange-500',
        'rough': 'bg-red-500'
    };
    
    const totalEntries = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    const moodDistributionEl = document.getElementById('moodDistribution');
    
    moodDistributionEl.innerHTML = Object.entries(moodCounts)
        .map(([mood, count]) => {
            const percentage = totalEntries ? Math.round((count / totalEntries) * 100) : 0;
            return `
                <div class="relative">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-medium text-gray-700 capitalize">${mood}</span>
                        <span class="text-xs font-medium text-gray-700">${percentage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div class="${moodColors[mood]} h-2.5 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        })
        .join('');
    
    if (totalEntries === 0) {
        moodDistributionEl.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <i class="fas fa-chart-bar text-3xl mb-2"></i>
                <p class="text-sm">No entries found for this timeframe</p>
            </div>
        `;
    }
}

// Initialize with week view
setTimeout(() => {
    changeMoodTimeframe('week');
}, 0);

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateDashboardStats,
        getMoodDistribution,
        getWritingTimeStats,
        refreshStats,
        changeMoodTimeframe,
        updateMoodDistribution
    };
}
