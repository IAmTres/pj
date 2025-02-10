// Dashboard functionality for managing journal entries and health tracking

class JournalDashboard {
    constructor() {
        this.entries = JSON.parse(localStorage.getItem('journal_entries') || '[]');
        this.meals = JSON.parse(localStorage.getItem('meals') || '[]');
        this.waterIntake = JSON.parse(localStorage.getItem('water_intake') || '0');
        this.selectedMood = null;
        
        this.initializeEventListeners();
        this.updateDashboard();
    }

    initializeEventListeners() {
        // New Entry Modal
        document.querySelector('[data-action="new-entry"]').addEventListener('click', () => {
            document.getElementById('new-entry-modal').classList.remove('hidden');
        });

        // Mood Selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('ring-2', 'ring-primary-500'));
                e.target.classList.add('ring-2', 'ring-primary-500');
                this.selectedMood = e.target.dataset.mood;
            });
        });

        // Save Entry
        document.getElementById('save-entry').addEventListener('click', () => {
            const content = document.getElementById('entry-content').value;
            if (!content || !this.selectedMood) {
                alert('Please enter your thoughts and select a mood');
                return;
            }

            this.addEntry({
                id: Date.now(),
                content,
                mood: this.selectedMood,
                timestamp: new Date().toISOString()
            });

            document.getElementById('new-entry-modal').classList.add('hidden');
            document.getElementById('entry-content').value = '';
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('ring-2', 'ring-primary-500'));
            this.selectedMood = null;
        });

        // Close Modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.fixed').forEach(modal => modal.classList.add('hidden'));
            });
        });

        // Meal Logging
        document.getElementById('save-meal').addEventListener('click', () => {
            const calories = parseInt(document.getElementById('meal-calories').value);
            const notes = document.getElementById('meal-notes').value;

            if (!calories || isNaN(calories)) {
                alert('Please enter valid calories');
                return;
            }

            this.addMeal({
                id: Date.now(),
                calories,
                notes,
                timestamp: new Date().toISOString()
            });

            document.getElementById('meal-modal').classList.add('hidden');
            document.getElementById('meal-calories').value = '';
            document.getElementById('meal-notes').value = '';
        });

        // Water Intake
        document.querySelector('[data-action="add-water"]').addEventListener('click', () => {
            this.waterIntake += 250; // Add 250ml
            localStorage.setItem('water_intake', JSON.stringify(this.waterIntake));
            this.updateWaterProgress();
        });
    }

    addEntry(entry) {
        this.entries.push(entry);
        localStorage.setItem('journal_entries', JSON.stringify(this.entries));
        this.updateDashboard();
    }

    addMeal(meal) {
        this.meals.push(meal);
        localStorage.setItem('meals', JSON.stringify(this.meals));
        this.updateDashboard();
    }

    updateDashboard() {
        this.updateStats();
        this.updateWaterProgress();
        this.updateCalorieProgress();
    }

    updateStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEntries = this.entries.filter(entry => new Date(entry.timestamp) >= today);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        const weekEntries = this.entries.filter(entry => new Date(entry.timestamp) >= weekStart);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEntries = this.entries.filter(entry => new Date(entry.timestamp) >= monthStart);

        // Update entry counts
        document.querySelector('[data-count="today"]').textContent = `Today (${todayEntries.length})`;
        document.querySelector('[data-count="week"]').textContent = `This Week (${weekEntries.length})`;
        document.querySelector('[data-count="month"]').textContent = `This Month (${monthEntries.length})`;
        document.querySelector('[data-count="all"]').textContent = `All Time (${this.entries.length})`;

        // Update stats
        document.querySelector('[data-stat="total-entries"]').textContent = this.entries.length;
        document.querySelector('[data-stat="current-streak"]').textContent = this.calculateCurrentStreak() + ' days';
        document.querySelector('[data-stat="longest-streak"]').textContent = this.calculateLongestStreak() + ' days';
        document.querySelector('[data-stat="average-mood"]').textContent = this.calculateAverageMood();
        document.querySelector('[data-stat="completion-rate"]').textContent = this.calculateCompletionRate() + '%';
    }

    updateWaterProgress() {
        const target = 2000; // 2L daily target
        const progress = (this.waterIntake / target) * 100;
        document.querySelector('.water-progress').style.width = `${Math.min(100, progress)}%`;
        document.querySelector('.water-text').textContent = `${this.waterIntake}ml / ${target}ml`;
    }

    updateCalorieProgress() {
        const target = 2000; // 2000 kcal daily target
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayCalories = this.meals
            .filter(meal => new Date(meal.timestamp) >= todayStart)
            .reduce((sum, meal) => sum + meal.calories, 0);

        const progress = (todayCalories / target) * 100;
        document.querySelector('.calorie-progress').style.width = `${Math.min(100, progress)}%`;
        document.querySelector('.calorie-text').textContent = `${todayCalories}/${target} kcal`;
    }

    calculateCurrentStreak() {
        if (this.entries.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let currentDate = new Date(today);

        while (true) {
            const hasEntry = this.entries.some(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate.getFullYear() === currentDate.getFullYear() &&
                       entryDate.getMonth() === currentDate.getMonth() &&
                       entryDate.getDate() === currentDate.getDate();
            });

            if (!hasEntry) break;
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    }

    calculateLongestStreak() {
        if (this.entries.length === 0) return 0;

        let longestStreak = 0;
        let currentStreak = 0;
        let lastDate = null;

        const sortedEntries = this.entries
            .map(entry => new Date(entry.timestamp))
            .sort((a, b) => a - b);

        sortedEntries.forEach(date => {
            if (!lastDate) {
                currentStreak = 1;
            } else {
                const diffDays = Math.floor((date - lastDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            }
            longestStreak = Math.max(longestStreak, currentStreak);
            lastDate = date;
        });

        return longestStreak;
    }

    calculateAverageMood() {
        if (this.entries.length === 0) return '-';

        const moodScores = {
            'very-happy': 5,
            'happy': 4,
            'neutral': 3,
            'sad': 2,
            'very-sad': 1
        };

        const sum = this.entries.reduce((acc, entry) => acc + moodScores[entry.mood], 0);
        const average = sum / this.entries.length;

        if (average >= 4.5) return '😊';
        if (average >= 3.5) return '🙂';
        if (average >= 2.5) return '😐';
        if (average >= 1.5) return '🙁';
        return '😢';
    }

    calculateCompletionRate() {
        const today = new Date();
        const startDate = new Date(this.entries[0]?.timestamp || today);
        const totalDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const daysWithEntries = new Set(
            this.entries.map(entry => {
                const date = new Date(entry.timestamp);
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            })
        ).size;

        return Math.round((daysWithEntries / totalDays) * 100);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new JournalDashboard();
});
class JournalDashboard {
    constructor() {
        this.entries = JSON.parse(localStorage.getItem('journal_entries') || '[]');
        this.meals = JSON.parse(localStorage.getItem('meals') || '[]');
        this.waterIntake = JSON.parse(localStorage.getItem('water_intake') || '0');
        this.selectedMood = null;
        
        this.initializeEventListeners();
        this.updateDashboard();
    }

    initializeEventListeners() {
        // New Entry Modal
        document.querySelector('[data-action="new-entry"]').addEventListener('click', () => {
            document.getElementById('new-entry-modal').classList.remove('hidden');
        });

        // Mood Selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('ring-2', 'ring-primary-500'));
                e.target.classList.add('ring-2', 'ring-primary-500');
                this.selectedMood = e.target.dataset.mood;
            });
        });

        // Save Entry
        document.getElementById('save-entry').addEventListener('click', () => {
            const content = document.getElementById('entry-content').value;
            if (!content || !this.selectedMood) {
                alert('Please enter your thoughts and select a mood');
                return;
            }

            this.addEntry({
                id: Date.now(),
                content,
                mood: this.selectedMood,
                timestamp: new Date().toISOString()
            });

            document.getElementById('new-entry-modal').classList.add('hidden');
            document.getElementById('entry-content').value = '';
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('ring-2', 'ring-primary-500'));
            this.selectedMood = null;
        });

        // Close Modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.fixed').forEach(modal => modal.classList.add('hidden'));
            });
        });

        // Meal Logging
        document.getElementById('save-meal').addEventListener('click', () => {
            const calories = parseInt(document.getElementById('meal-calories').value);
            const notes = document.getElementById('meal-notes').value;

            if (!calories || isNaN(calories)) {
                alert('Please enter valid calories');
                return;
            }

            this.addMeal({
                id: Date.now(),
                calories,
                notes,
                timestamp: new Date().toISOString()
            });

            document.getElementById('meal-modal').classList.add('hidden');
            document.getElementById('meal-calories').value = '';
            document.getElementById('meal-notes').value = '';
        });

        // Water Intake
        document.querySelector('[data-action="add-water"]').addEventListener('click', () => {
            this.waterIntake += 250; // Add 250ml
            localStorage.setItem('water_intake', JSON.stringify(this.waterIntake));
            this.updateWaterProgress();
        });
    }
    constructor() {
        this.entries = [];
        this.currentUser = null;
        this.foodLog = {
            calories: 0,
            waterGlasses: 0,
            meals: {
                breakfast: 0,
                lunch: 0,
                dinner: 0,
                snacks: 0
            }
        };
        this.init();
    }

    addEntry(entry) {
        this.entries.push(entry);
        localStorage.setItem('journal_entries', JSON.stringify(this.entries));
        this.updateDashboard();
    }

    addMeal(meal) {
        this.meals.push(meal);
        localStorage.setItem('meals', JSON.stringify(this.meals));
        this.updateDashboard();
    }

    updateDashboard() {
        this.updateStats();
        this.updateWaterProgress();
        this.updateCalorieProgress();
    }

    updateStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEntries = this.entries.filter(entry => new Date(entry.timestamp) >= today);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        const weekEntries = this.entries.filter(entry => new Date(entry.timestamp) >= weekStart);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEntries = this.entries.filter(entry => new Date(entry.timestamp) >= monthStart);

        // Update entry counts
        document.querySelector('[data-count="today"]').textContent = `Today (${todayEntries.length})`;
        document.querySelector('[data-count="week"]').textContent = `This Week (${weekEntries.length})`;
        document.querySelector('[data-count="month"]').textContent = `This Month (${monthEntries.length})`;
        document.querySelector('[data-count="all"]').textContent = `All Time (${this.entries.length})`;

        // Update stats
        document.querySelector('[data-stat="total-entries"]').textContent = this.entries.length;
        document.querySelector('[data-stat="current-streak"]').textContent = this.calculateCurrentStreak() + ' days';
        document.querySelector('[data-stat="longest-streak"]').textContent = this.calculateLongestStreak() + ' days';
        document.querySelector('[data-stat="average-mood"]').textContent = this.calculateAverageMood();
        document.querySelector('[data-stat="completion-rate"]').textContent = this.calculateCompletionRate() + '%';
    }

    updateWaterProgress() {
        const target = 2000; // 2L daily target
        const progress = (this.waterIntake / target) * 100;
        document.querySelector('.water-progress').style.width = `${Math.min(100, progress)}%`;
        document.querySelector('.water-text').textContent = `${this.waterIntake}ml / ${target}ml`;
    }

    updateCalorieProgress() {
        const target = 2000; // 2000 kcal daily target
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayCalories = this.meals
            .filter(meal => new Date(meal.timestamp) >= todayStart)
            .reduce((sum, meal) => sum + meal.calories, 0);

        const progress = (todayCalories / target) * 100;
        document.querySelector('.calorie-progress').style.width = `${Math.min(100, progress)}%`;
        document.querySelector('.calorie-text').textContent = `${todayCalories}/${target} kcal`;
    }

    calculateStreak() {
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < this.entries.length; i++) {
            const entryDate = new Date(this.entries[i].timestamp);
            entryDate.setHours(0, 0, 0, 0);
            
            if (i === 0 && entryDate < currentDate) break;
            
            if (i === 0 || this.isConsecutiveDay(new Date(this.entries[i-1].timestamp), entryDate)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    calculateLongestStreak() {
        let currentStreak = 0;
        let longestStreak = 0;
        
        for (let i = 0; i < this.entries.length; i++) {
            if (i === 0) {
                currentStreak = 1;
            } else {
                const currentDate = new Date(this.entries[i].timestamp);
                const prevDate = new Date(this.entries[i-1].timestamp);
                
                if (this.isConsecutiveDay(prevDate, currentDate)) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            }
            longestStreak = Math.max(longestStreak, currentStreak);
        }
        return longestStreak;
    }

    isConsecutiveDay(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 1;
    }

    calculateAverageMood() {
        if (this.entries.length === 0) return null;
        
        const moodScores = {
            'very-happy': 5,
            'happy': 4,
            'neutral': 3,
            'sad': 2,
            'very-sad': 1
        };
        
        const totalScore = this.entries.reduce((sum, entry) => {
            return sum + (moodScores[entry.mood] || 3);
        }, 0);
        
        const average = totalScore / this.entries.length;
        if (average >= 4.5) return 'Very Happy';
        if (average >= 3.5) return 'Happy';
        if (average >= 2.5) return 'Neutral';
        if (average >= 1.5) return 'Sad';
        return 'Very Sad';
    }

    calculateCompletionRate() {
        if (this.entries.length === 0) return 0;
        const completedEntries = this.entries.filter(e => e.isComplete).length;
        return Math.round((completedEntries / this.entries.length) * 100);
    }

    handleQuickAction(action) {
        switch(action) {
            case 'new-entry':
                this.showNewEntryModal();
                break;
            case 'connect-therapist':
                this.showTherapistModal();
                break;
            case 'log-meal':
                this.showMealForm();
                break;
            case 'add-water':
                this.updateWaterIntake(1);
                break;
        }
    }

    updateWaterIntake(glasses) {
        this.foodLog.waterGlasses = Math.min(8, this.foodLog.waterGlasses + glasses);
        this.saveToStorage();
        this.updateFoodTracker();
    }

    showMealForm(mealType) {
        // Implementation for meal form modal
        console.log(`Show meal form for ${mealType}`);
    }

    updateFoodTracker() {
        // Update calorie progress bar
        const calorieBar = document.querySelector('.calorie-progress');
        const calorieText = document.querySelector('.calorie-text');
        if (calorieBar && calorieText) {
            const percentage = Math.min(100, (this.foodLog.calories / 2000) * 100);
            calorieBar.style.width = `${percentage}%`;
            calorieText.textContent = `${this.foodLog.calories}/2000 kcal`;
        }

        // Update water intake
        const waterText = document.querySelector('.water-text');
        if (waterText) {
            waterText.textContent = `${this.foodLog.waterGlasses}/8 glasses`;
        }

        // Update meal calories
        Object.entries(this.foodLog.meals).forEach(([meal, calories]) => {
            const mealElement = document.querySelector(`[data-meal-type="${meal}"] .calories`);
            if (mealElement) {
                mealElement.textContent = `${calories} cal`;
            }
        });
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
        // Quick Action Buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Water Intake Buttons
        document.querySelectorAll('[data-water]').forEach(button => {
            button.addEventListener('click', (e) => {
                const glasses = parseInt(e.target.dataset.water);
                this.updateWaterIntake(glasses);
            });
        });

        // Meal Logging
        document.querySelectorAll('[data-meal-type]').forEach(section => {
            section.addEventListener('click', (e) => {
                const mealType = e.target.closest('[data-meal-type]').dataset.mealType;
                this.showMealForm(mealType);
            });
        });
    }

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
