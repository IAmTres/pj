// Therapist Connection Management

function generateConnectionCode() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function connectWithTherapist(therapistCode) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        throw new Error('User not logged in');
    }

    const therapists = JSON.parse(localStorage.getItem('therapists') || '[]');
    const therapist = therapists.find(t => t.connectionCode === therapistCode);

    if (!therapist) {
        throw new Error('Invalid therapist code');
    }

    // Update user's therapist connection
    currentUser.psychologistId = therapist.id;
    currentUser.therapistConnectedAt = new Date().toISOString();
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Add to therapist's client list
    const connections = JSON.parse(localStorage.getItem('therapistConnections') || '[]');
    connections.push({
        therapistId: therapist.id,
        clientId: currentUser.id,
        connectedAt: new Date().toISOString(),
        status: 'active'
    });
    localStorage.setItem('therapistConnections', JSON.stringify(connections));

    return therapist;
}

function disconnectFromTherapist() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.psychologistId) {
        throw new Error('No active therapist connection');
    }

    // Update connection status
    const connections = JSON.parse(localStorage.getItem('therapistConnections') || '[]');
    const connection = connections.find(c => 
        c.clientId === currentUser.id && 
        c.therapistId === currentUser.psychologistId &&
        c.status === 'active'
    );

    if (connection) {
        connection.status = 'disconnected';
        connection.disconnectedAt = new Date().toISOString();
        localStorage.setItem('therapistConnections', JSON.stringify(connections));
    }

    // Remove therapist from user
    delete currentUser.psychologistId;
    delete currentUser.therapistConnectedAt;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function getTherapistClients(therapistId) {
    const connections = JSON.parse(localStorage.getItem('therapistConnections') || '[]');
    const activeConnections = connections.filter(c => 
        c.therapistId === therapistId && 
        c.status === 'active'
    );

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return activeConnections.map(conn => {
        const user = users.find(u => u.id === conn.clientId);
        return {
            ...user,
            connectedAt: conn.connectedAt
        };
    });
}

function getClientJournalEntries(clientId, therapistId) {
    // Verify connection
    const connections = JSON.parse(localStorage.getItem('therapistConnections') || '[]');
    const hasConnection = connections.some(c => 
        c.clientId === clientId && 
        c.therapistId === therapistId && 
        c.status === 'active'
    );

    if (!hasConnection) {
        throw new Error('No active connection with this client');
    }

    // Get shared entries
    const allEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    return allEntries.filter(entry => 
        entry.userId === clientId && 
        entry.shareWithPsychologist
    );
}

function updateSharingSettings(settings) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        throw new Error('User not logged in');
    }

    currentUser.sharingSettings = {
        ...currentUser.sharingSettings,
        ...settings
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function addTherapistNote(clientId, note) {
    const notes = JSON.parse(localStorage.getItem('therapistNotes') || '[]');
    const newNote = {
        id: Date.now().toString(),
        clientId,
        therapistId: JSON.parse(localStorage.getItem('currentUser')).id,
        content: note,
        timestamp: new Date().toISOString()
    };
    notes.push(newNote);
    localStorage.setItem('therapistNotes', JSON.stringify(notes));
    return newNote;
}

function getTherapistNotes(clientId, therapistId) {
    const notes = JSON.parse(localStorage.getItem('therapistNotes') || '[]');
    return notes.filter(note => 
        note.clientId === clientId && 
        note.therapistId === therapistId
    );
}
