// Journal Entries Management

function loadJournalEntries(timeframe = 'all') {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return;

    // Filter entries for current user
    let userEntries = entries.filter(entry => entry.userId === currentUser.id);

    // Apply timeframe filter
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    switch(timeframe) {
        case 'today':
            userEntries = userEntries.filter(entry => new Date(entry.timestamp) >= todayStart);
            break;
        case 'week':
            userEntries = userEntries.filter(entry => new Date(entry.timestamp) >= weekStart);
            break;
        case 'month':
            userEntries = userEntries.filter(entry => new Date(entry.timestamp) >= monthStart);
            break;
    }

    // Sort entries by date (newest first)
    userEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    displayJournalEntries(userEntries);
    updateDashboardStats();
}

function displayJournalEntries(entries) {
    const container = document.getElementById('journalEntries');
    
    if (!entries || entries.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-book text-gray-400 text-2xl"></i>
                </div>
                <h3 class="text-gray-900 font-medium mb-1">No journal entries yet</h3>
                <p class="text-gray-500 text-sm">Start writing your thoughts and feelings</p>
                <a href="new-journal-entry.html" 
                   class="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all">
                    <i class="fas fa-plus"></i>
                    Create Your First Entry
                </a>
            </div>
        `;
        return;
    }

    const moodIcons = {
        'Very Happy': '😊',
        'Happy': '🙂',
        'Neutral': '😐',
        'Sad': '😔',
        'Very Sad': '😢'
    };

    container.innerHTML = entries.map(entry => `
        <div class="bg-white p-4 rounded-lg border border-gray-200 hover:border-primary-300 transition-all">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-2xl" title="${entry.mood}">${moodIcons[entry.mood] || '😐'}</span>
                        <h3 class="font-medium text-gray-900">${entry.title || 'Untitled Entry'}</h3>
                    </div>
                    <p class="text-sm text-gray-500">
                        ${new Date(entry.timestamp).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="editJournalEntry('${entry.id}')" 
                            class="text-gray-500 hover:text-primary-600 transition-colors">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="confirmDeleteJournalEntry('${entry.id}')" 
                            class="text-gray-500 hover:text-red-600 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="prose prose-sm max-w-none">
                ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}
            </div>
            <div class="flex flex-wrap gap-2 mt-3">
                ${entry.activities ? entry.activities.map(activity => `
                    <span class="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs">
                        ${activity}
                    </span>
                `).join('') : ''}
                ${entry.energyLevel ? `
                    <span class="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                        Energy: ${entry.energyLevel}/10
                    </span>
                ` : ''}
                ${entry.shareWithPsychologist ? `
                    <span class="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                        <i class="fas fa-user-md text-xs mr-1"></i>
                        Shared with therapist
                    </span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function filterEntries(timeframe) {
    // Update active state of filter buttons
    document.querySelectorAll('[onclick^="filterEntries"]').forEach(button => {
        if (button.getAttribute('onclick').includes(timeframe)) {
            button.classList.remove('bg-gray-200', 'text-gray-700');
            button.classList.add('bg-primary-600', 'text-white');
        } else {
            button.classList.remove('bg-primary-600', 'text-white');
            button.classList.add('bg-gray-200', 'text-gray-700');
        }
    });

    loadJournalEntries(timeframe);
}

function searchEntries() {
    const searchTerm = document.getElementById('searchEntries').value.toLowerCase();
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return;

    let userEntries = entries.filter(entry => entry.userId === currentUser.id);

    if (searchTerm) {
        userEntries = userEntries.filter(entry => 
            entry.title?.toLowerCase().includes(searchTerm) ||
            entry.content?.toLowerCase().includes(searchTerm) ||
            entry.mood?.toLowerCase().includes(searchTerm) ||
            entry.activities?.some(activity => activity.toLowerCase().includes(searchTerm))
        );
    }

    displayJournalEntries(userEntries);
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadJournalEntries,
        displayJournalEntries,
        filterEntries,
        searchEntries
    };
}
