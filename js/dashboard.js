// Dashboard functionality for both users and therapists
class JournalDashboard {
    constructor(isTherapist = false) {
        this.isTherapist = isTherapist;
        this.entries = [];
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadEntries();
        this.setupEventListeners();
        this.updateDashboardStats();
        this.renderEntries();
    }

    loadEntries() {
        // Load entries from localStorage for now, in production this would be from a database
        const storageKey = this.isTherapist ? 'therapist_entries' : 'user_entries';
        const savedEntries = localStorage.getItem(storageKey);
        this.entries = savedEntries ? JSON.parse(savedEntries) : [];
    }

    saveEntry(entry) {
        // Add new entry
        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            title: entry.title,
            content: entry.content,
            mood: entry.mood,
            tags: entry.tags,
            sharedWithTherapist: entry.sharedWithTherapist,
            therapistNotes: entry.therapistNotes || '',
            therapistFeedback: entry.therapistFeedback || '',
            isArchived: false
        };

        this.entries.unshift(newEntry);
        this.saveToStorage();

        // If shared with therapist, also save to therapist's view
        if (entry.sharedWithTherapist) {
            this.saveToTherapistView(newEntry);
        }

        this.renderEntries();
        this.updateDashboardStats();
    }

    saveToStorage() {
        const storageKey = this.isTherapist ? 'therapist_entries' : 'user_entries';
        localStorage.setItem(storageKey, JSON.stringify(this.entries));
    }

    saveToTherapistView(entry) {
        const therapistEntries = JSON.parse(localStorage.getItem('therapist_entries') || '[]');
        therapistEntries.unshift(entry);
        localStorage.setItem('therapist_entries', JSON.stringify(therapistEntries));
    }

    updateDashboardStats() {
        const stats = this.calculateStats();
        
        // Update UI elements
        document.getElementById('total-entries').textContent = stats.totalEntries;
        document.getElementById('shared-entries').textContent = stats.sharedEntries;
        document.getElementById('current-streak').textContent = stats.currentStreak;
        document.getElementById('mood-distribution').innerHTML = this.renderMoodDistribution(stats.moodDistribution);
    }

    calculateStats() {
        return {
            totalEntries: this.entries.length,
            sharedEntries: this.entries.filter(e => e.sharedWithTherapist).length,
            currentStreak: this.calculateStreak(),
            moodDistribution: this.calculateMoodDistribution()
        };
    }

    calculateStreak() {
        let streak = 0;
        let currentDate = new Date();
        
        for (let entry of this.entries) {
            const entryDate = new Date(entry.timestamp);
            if (this.isSameDay(entryDate, currentDate)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    calculateMoodDistribution() {
        const distribution = {};
        this.entries.forEach(entry => {
            distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
        });
        return distribution;
    }

    renderMoodDistribution(distribution) {
        const colors = {
            'Happy': '#4CAF50',
            'Calm': '#2196F3',
            'Anxious': '#FFC107',
            'Sad': '#9C27B0',
            'Angry': '#F44336'
        };

        return Object.entries(distribution)
            .map(([mood, count]) => `
                <div class="mood-bar">
                    <div class="mood-label">${mood}</div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${(count / this.entries.length) * 100}%; background-color: ${colors[mood]}"></div>
                    </div>
                    <div class="mood-count">${count}</div>
                </div>
            `).join('');
    }

    renderEntries() {
        const container = document.getElementById('entries-container');
        container.innerHTML = this.entries.map(entry => this.renderEntryCard(entry)).join('');
    }

    renderEntryCard(entry) {
        const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="entry-card ${entry.sharedWithTherapist ? 'shared' : ''}" data-entry-id="${entry.id}">
                <div class="entry-header">
                    <h3>${entry.title}</h3>
                    <span class="entry-date">${date}</span>
                </div>
                <div class="entry-mood">
                    <span class="mood-indicator ${entry.mood.toLowerCase()}"></span>
                    ${entry.mood}
                </div>
                <div class="entry-preview">${entry.content.substring(0, 150)}...</div>
                ${entry.tags.map(tag => `<span class="entry-tag">${tag}</span>`).join('')}
                ${this.renderEntryActions(entry)}
            </div>
        `;
    }

    renderEntryActions(entry) {
        if (this.isTherapist) {
            return `
                <div class="entry-actions">
                    <button onclick="dashboard.addTherapistNote(${entry.id})" class="btn-note">
                        Add Note
                    </button>
                    <button onclick="dashboard.provideFeedback(${entry.id})" class="btn-feedback">
                        Provide Feedback
                    </button>
                </div>
            `;
        }

        return `
            <div class="entry-actions">
                <button onclick="dashboard.editEntry(${entry.id})" class="btn-edit">
                    Edit
                </button>
                <button onclick="dashboard.toggleSharing(${entry.id})" class="btn-share ${entry.sharedWithTherapist ? 'shared' : ''}">
                    ${entry.sharedWithTherapist ? 'Shared' : 'Share with Therapist'}
                </button>
                <button onclick="dashboard.archiveEntry(${entry.id})" class="btn-archive">
                    Archive
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // New Entry Button
        document.getElementById('new-entry-btn').addEventListener('click', () => {
            this.showNewEntryForm();
        });

        // Filter Controls
        document.getElementById('filter-controls').addEventListener('change', (e) => {
            this.filterEntries(e.target.value);
        });

        // Search
        document.getElementById('entry-search').addEventListener('input', (e) => {
            this.searchEntries(e.target.value);
        });
    }

    showNewEntryForm() {
        // Implementation for showing the new entry form
        const modal = document.getElementById('new-entry-modal');
        modal.classList.remove('hidden');
    }

    filterEntries(filterType) {
        let filteredEntries = [...this.entries];
        
        switch(filterType) {
            case 'shared':
                filteredEntries = this.entries.filter(e => e.sharedWithTherapist);
                break;
            case 'private':
                filteredEntries = this.entries.filter(e => !e.sharedWithTherapist);
                break;
            case 'archived':
                filteredEntries = this.entries.filter(e => e.isArchived);
                break;
            // Add more filter types as needed
        }

        this.renderFilteredEntries(filteredEntries);
    }

    searchEntries(searchTerm) {
        if (!searchTerm) {
            this.renderEntries();
            return;
        }

        const filteredEntries = this.entries.filter(entry =>
            entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        this.renderFilteredEntries(filteredEntries);
    }

    renderFilteredEntries(entries) {
        const container = document.getElementById('entries-container');
        container.innerHTML = entries.map(entry => this.renderEntryCard(entry)).join('');
    }

    // Therapist-specific methods
    addTherapistNote(entryId) {
        if (!this.isTherapist) return;
        
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;

        // Show note modal and handle saving
        // Implementation for therapist note modal
    }

    provideFeedback(entryId) {
        if (!this.isTherapist) return;
        
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;

        // Show feedback modal and handle saving
        // Implementation for therapist feedback modal
    }
}

// Initialize dashboard based on user type
const userType = localStorage.getItem('user_type'); // 'user' or 'therapist'
const dashboard = new JournalDashboard(userType === 'therapist');
