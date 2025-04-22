// Supabase Configuration - Replace with your project URL and anon key
const SUPABASE_URL = 'https://idokysoyusnmjagpvtzb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkb2t5c295dXNubWphZ3B2dHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMzg0OTgsImV4cCI6MjA2MDkxNDQ5OH0.LNb2GXC-jwbEpGi_LueGRYSgk9KQq0fDgBbO4NDVwmM';
const supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const landingContainer = document.getElementById('landing-container');
const authContainer = document.getElementById('auth-container');
const appContent = document.getElementById('app-content');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const logoutBtn = document.getElementById('logout-btn');
const createNoteBtn = document.getElementById('create-note-btn');
const noteModal = document.getElementById('note-modal');
const closeModalBtn = document.getElementById('close-modal');
const noteForm = document.getElementById('note-form');
const modalTitle = document.getElementById('modal-title');
const noteIdInput = document.getElementById('note-id');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const noteCategoryInput = document.getElementById('note-category');
const noteColorInput = document.getElementById('note-color');
const pokemonOptions = document.querySelectorAll('.pokemon-option');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const deleteModal = document.getElementById('delete-modal');
const closeDeleteModalBtn = document.getElementById('close-delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const notesContainer = document.getElementById('notes-container');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const exportBtn = document.getElementById('export-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeToggleApp = document.getElementById('theme-toggle-app');
const themeToggleLanding = document.getElementById('theme-toggle-landing');
const showAuthBtn = document.getElementById('show-auth-btn');
const guestAccessBtn = document.getElementById('guest-access-btn');
const guestLoginBtn = document.getElementById('guest-login-btn');
const backToLandingBtn = document.getElementById('back-to-landing');
const userStatus = document.getElementById('user-status');

// State variables
let currentUser = null;
let isGuestMode = false;
let currentNoteId = null;
let notesSubscription = null;
let currentTheme = localStorage.getItem('theme') || 'light';
let allNotes = [];
let localNotes = JSON.parse(localStorage.getItem('localNotes') || '[]');

// Pokemon data for displaying type information
const pokemonTypes = {
    pikachu: 'Electric',
    bulbasaur: 'Grass',
    charmander: 'Fire',
    squirtle: 'Water',
    jigglypuff: 'Fairy'
};

// Theme functions
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<span class="icon">☀️</span>';
        themeToggleApp.innerHTML = '<span class="icon">☀️</span>';
        themeToggleLanding.innerHTML = '<span class="icon">☀️</span>';
    } else {
        document.body.removeAttribute('data-theme');
        themeToggleBtn.innerHTML = '<span class="icon">🌙</span>';
        themeToggleApp.innerHTML = '<span class="icon">🌙</span>';
        themeToggleLanding.innerHTML = '<span class="icon">🌙</span>';
    }
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    
    // Dispatch theme changed event
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Show/Hide Views
function showLanding() {
    landingContainer.classList.remove('hidden');
    authContainer.classList.add('hidden');
    appContent.classList.add('hidden');
}

function showAuth() {
    landingContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    appContent.classList.add('hidden');
}

function showApp() {
    landingContainer.classList.add('hidden');
    authContainer.classList.add('hidden');
    appContent.classList.remove('hidden');
}

// Guest Mode
function enableGuestMode() {
    isGuestMode = true;
    currentUser = { id: 'guest' };
    userStatus.textContent = 'Guest Mode';
    showApp();
    loadLocalNotes();
}

function loadLocalNotes() {
    notesContainer.innerHTML = '';
    allNotes = localNotes;
    
    if (localNotes.length === 0) {
        notesContainer.innerHTML = `
            <div class="empty-state">
                <p>You don't have any notes yet. Create your first note!</p>
            </div>
        `;
        return;
    }
    
    localNotes.forEach(note => addNoteToUI(note));
    
    // Add hover effects to notes
    addNoteHoverEffects();
}

function saveLocalNotes() {
    localStorage.setItem('localNotes', JSON.stringify(allNotes));
}

// Auth Functions
async function handleLogin(email, password) {
    loginError.textContent = '';
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        isGuestMode = false;
        userStatus.textContent = currentUser.email;
        showApp();
        loadNotes();
        setupRealtimeSubscription();
    } catch (error) {
        loginError.textContent = error.message || 'Failed to login';
    }
}

async function handleSignup(email, password) {
    signupError.textContent = '';
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        if (data.user && !data.session) {
            signupError.textContent = 'Please check your email for confirmation link';
        } else if (data.user && data.session) {
            currentUser = data.user;
            isGuestMode = false;
            userStatus.textContent = currentUser.email;
            showApp();
            loadNotes();
            setupRealtimeSubscription();
        }
    } catch (error) {
        signupError.textContent = error.message || 'Failed to sign up';
    }
}

async function handleLogout() {
    try {
        if (!isGuestMode) {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            currentUser = null;
            unsubscribeFromNotes();
        } else {
            isGuestMode = false;
            currentUser = null;
            allNotes = [];
        }
        
        showLanding();
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Realtime Subscription
function setupRealtimeSubscription() {
    if (notesSubscription || isGuestMode) return;
    
    notesSubscription = supabase
        .channel('public:notes')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'notes',
                filter: `user_id=eq.${currentUser.id}`
            }, 
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newNote = payload.new;
                    addNoteToUI(newNote);
                    allNotes.push(newNote);
                } else if (payload.eventType === 'UPDATE') {
                    const updatedNote = payload.new;
                    updateNoteInUI(updatedNote);
                    const index = allNotes.findIndex(note => note.id === updatedNote.id);
                    if (index !== -1) {
                        allNotes[index] = updatedNote;
                    }
                } else if (payload.eventType === 'DELETE') {
                    const deletedNote = payload.old;
                    removeNoteFromUI(deletedNote.id);
                    allNotes = allNotes.filter(note => note.id !== deletedNote.id);
                }
            }
        )
        .subscribe();
}

function unsubscribeFromNotes() {
    if (notesSubscription) {
        supabase.removeChannel(notesSubscription);
        notesSubscription = null;
    }
}

// Note CRUD Operations
async function loadNotes() {
    if (isGuestMode) {
        loadLocalNotes();
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        notesContainer.innerHTML = '';
        allNotes = data;
        
        if (data.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <p>You don't have any notes yet. Create your first note!</p>
                </div>
            `;
            return;
        }
        
        data.forEach(note => addNoteToUI(note));
        
        // Add hover effects to notes
        addNoteHoverEffects();
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

// Note CRUD Operations - Server operations
async function createNoteInServer(noteData) {
    try {
        const { data, error } = await supabase
            .from('notes')
            .insert([noteData])
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error creating note:', error);
        throw error;
    }
}

async function deleteNoteFromServer(id) {
    try {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error deleting note from server:', error);
        throw error;
    }
}

async function updateNote(id, noteData) {
    if (isGuestMode) {
        const index = allNotes.findIndex(note => note.id === id);
        if (index !== -1) {
            const updatedNote = {
                ...allNotes[index],
                ...noteData,
                updated_at: new Date().toISOString()
            };
            
            allNotes[index] = updatedNote;
            updateNoteInUI(updatedNote);
            saveLocalNotes();
            return updatedNote;
        }
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('notes')
            .update(noteData)
            .eq('id', id)
            .eq('user_id', currentUser.id)
            .select()
            .single();
        
        if (error) throw error;
        
        return data;
    } catch (error) {
        console.error('Error updating note:', error);
        throw error;
    }
}

// Note Form Submission
noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get submit button and show loading state
    const submitBtn = noteForm.querySelector('[type="submit"]');
    submitBtn.classList.add('loading');
    
    const noteData = {
        title: noteTitleInput.value,
        content: noteContentInput.value,
        category: noteCategoryInput.value,
        color: noteColorInput.value,
        user_id: currentUser.id
    };
    
    try {
        if (noteIdInput.value) {
            // Update existing note
            await updateNote(noteIdInput.value, noteData);
        } else {
            // Create new note
            if (isGuestMode) {
                const now = new Date().toISOString();
                const newNote = {
                    id: 'local-' + Date.now(),
                    ...noteData,
                    created_at: now,
                    updated_at: now
                };
                
                allNotes.push(newNote);
                addNoteToUI(newNote);
                saveLocalNotes();
            } else {
                await createNoteInServer(noteData);
            }
        }
        
        closeNoteModal();
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note. Please try again later.');
    } finally {
        // Remove loading state
        submitBtn.classList.remove('loading');
    }
});

// Delete Note
confirmDeleteBtn.addEventListener('click', async () => {
    // Show loading state
    confirmDeleteBtn.classList.add('loading');
    
    try {
        if (isGuestMode) {
            allNotes = allNotes.filter(note => note.id !== currentNoteId);
            removeNoteFromUI(currentNoteId);
            saveLocalNotes();
        } else {
            await deleteNoteFromServer(currentNoteId);
        }
        
        closeDeleteModal();
        closeNoteModal();
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again later.');
    } finally {
        // Remove loading state
        confirmDeleteBtn.classList.remove('loading');
    }
});

// UI Functions
function addNoteToUI(note) {
    const noteElement = createNoteElement(note);
    
    // Add a staggered entrance animation
    noteElement.style.animationDelay = `${Math.random() * 0.3}s`;
    noteElement.classList.add('note-entrance');
    
    notesContainer.prepend(noteElement);
}

function updateNoteInUI(note) {
    const existingNoteElement = document.getElementById(`note-${note.id}`);
    if (existingNoteElement) {
        // Save current dimensions before applying animation
        const rect = existingNoteElement.getBoundingClientRect();
        const height = rect.height;
        const width = rect.width;
        
        // Apply fixed dimensions to prevent size jumps
        existingNoteElement.style.height = `${height}px`;
        existingNoteElement.style.width = `${width}px`;
        
        // Apply the flip class and update color
        existingNoteElement.className = `note-card ${note.color} flip`;
        
        // Add particle effect on update
        createUpdateParticles(existingNoteElement);
        
        setTimeout(() => {
            const updatedNoteElement = createNoteElement(note);
            
            // Replace the element and clear fixed dimensions after animation
            existingNoteElement.replaceWith(updatedNoteElement);
            
            // Reset any inline styles that might be added
            setTimeout(() => {
                // Make sure the element still exists in DOM
                const newElem = document.getElementById(`note-${note.id}`);
                if (newElem) {
                    newElem.style.height = '';
                    newElem.style.width = '';
                }
            }, 50);
            
            addNoteHoverEffects();
        }, 400);
    }
}

function removeNoteFromUI(noteId) {
    const noteElement = document.getElementById(`note-${noteId}`);
    if (noteElement) {
        noteElement.classList.add('fadeOut');
        setTimeout(() => {
            noteElement.remove();
            if (notesContainer.children.length === 0) {
                notesContainer.innerHTML = `
                    <div class="empty-state">
                        <p>You don't have any notes yet. Create your first note!</p>
                    </div>
                `;
            }
        }, 300);
    }
}

function createNoteElement(note) {
    const noteElement = document.createElement('div');
    noteElement.className = `note-card ${note.color}`;
    noteElement.id = `note-${note.id}`;
    noteElement.setAttribute('draggable', 'true');
    
    // Format date
    const createdDate = new Date(note.created_at);
    const updatedDate = new Date(note.updated_at);
    const dateToShow = note.created_at !== note.updated_at 
        ? `Updated: ${formatDate(updatedDate)}`
        : `Created: ${formatDate(createdDate)}`;
    
    // Add Pokemon type to display
    const pokemonType = pokemonTypes[note.color] || '';
    const typeDisplay = pokemonType ? `<span class="note-type">${pokemonType}</span>` : '';
    
    noteElement.innerHTML = `
        <div class="note-title">${escapeHtml(note.title)}</div>
        <div class="note-content">${escapeHtml(note.content)}</div>
        <div class="note-footer">
            <div class="note-meta">
                <span class="note-category">${escapeHtml(note.category)}</span>
                ${typeDisplay}
            </div>
            <span class="note-date">${dateToShow}</span>
        </div>
    `;
    
    // Add click event to open note for editing
    noteElement.addEventListener('click', () => openNoteForEditing(note));
    
    // Add drag and drop events
    noteElement.addEventListener('dragstart', handleDragStart);
    noteElement.addEventListener('dragover', handleDragOver);
    noteElement.addEventListener('drop', handleDrop);
    noteElement.addEventListener('dragenter', handleDragEnter);
    noteElement.addEventListener('dragleave', handleDragLeave);
    
    return noteElement;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    
    // If less than 24 hours, show relative time
    if (diff < 24 * 60 * 60 * 1000) {
        if (diff < 60 * 60 * 1000) {
            return `${Math.floor(diff / (60 * 1000))} min ago`;
        } else {
            return `${Math.floor(diff / (60 * 60 * 1000))} hours ago`;
        }
    }
    
    // Otherwise show the date
    return `${month} ${day}, ${year}`;
}

// Modal Functions
function openNoteModal(isEdit = false) {
    modalTitle.textContent = isEdit ? 'Edit Note' : 'Create Note';
    deleteNoteBtn.classList.toggle('hidden', !isEdit);
    
    if (!isEdit) {
        noteIdInput.value = '';
        noteTitleInput.value = '';
        noteContentInput.value = '';
        noteCategoryInput.value = 'Ideas'; // Default to Ideas
        setSelectedColor('pikachu');
    }
    
    noteModal.classList.add('active');
    document.body.classList.add('modal-open');
    
    // Focus first input field after a short delay to ensure modal is visible
    setTimeout(() => {
        noteTitleInput.focus();
        // Set up an event listener for the Escape key
        document.addEventListener('keydown', handleModalKeydown);
    }, 100);
    
    // Add click outside to close modal
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 200);
}

function closeNoteModal() {
    noteModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    
    // Remove keyboard and click outside event listeners
    document.removeEventListener('keydown', handleModalKeydown);
    document.removeEventListener('click', handleOutsideClick);
}

function handleModalKeydown(e) {
    if (e.key === 'Escape') {
        closeNoteModal();
    }
}

function handleOutsideClick(e) {
    // Check if the click is outside the modal content
    if (noteModal.classList.contains('active') && 
        !e.target.closest('.modal-content') && 
        e.target.closest('.modal')) {
        closeNoteModal();
    }
}

function openNoteForEditing(note) {
    currentNoteId = note.id;
    noteIdInput.value = note.id;
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;
    noteCategoryInput.value = note.category;
    setSelectedColor(note.color);
    
    openNoteModal(true);
}

function openDeleteModal() {
    deleteModal.classList.add('active');
    document.body.classList.add('modal-open');
    
    // Focus the cancel button by default for safety
    setTimeout(() => {
        document.getElementById('cancel-delete').focus();
        // Set up an event listener for the Escape key
        document.addEventListener('keydown', handleDeleteModalKeydown);
    }, 100);
    
    // Add click outside to close modal
    setTimeout(() => {
        document.addEventListener('click', handleDeleteOutsideClick);
    }, 200);
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    // Only remove modal-open class if note modal is also closed
    if (!noteModal.classList.contains('active')) {
        document.body.classList.remove('modal-open');
    }
    
    // Remove keyboard and click outside event listeners
    document.removeEventListener('keydown', handleDeleteModalKeydown);
    document.removeEventListener('click', handleDeleteOutsideClick);
}

function handleDeleteModalKeydown(e) {
    if (e.key === 'Escape') {
        closeDeleteModal();
    }
}

function handleDeleteOutsideClick(e) {
    // Check if the click is outside the modal content
    if (deleteModal.classList.contains('active') && 
        !e.target.closest('.modal-content') && 
        e.target.closest('.modal')) {
        closeDeleteModal();
    }
}

// Color picker functions -> Pokemon picker functions
function setSelectedColor(color) {
    noteColorInput.value = color;
    pokemonOptions.forEach(option => {
        if (option.dataset.color === color) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// Search and Filter Functions
function filterNotes() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;
    
    // Add animation to the filter icon
    const filterIcon = document.querySelector('.category-filter::before');
    if (filterIcon) {
        filterIcon.style.animation = 'pulse 0.5s ease';
        setTimeout(() => {
            filterIcon.style.animation = '';
        }, 500);
    }
    
    const filteredNotes = allNotes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm) || 
                             note.content.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryValue === '' || note.category === categoryValue;
        
        return matchesSearch && matchesCategory;
    });
    
    notesContainer.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        notesContainer.innerHTML = `
            <div class="empty-state">
                <p>No notes match your search criteria.</p>
                <p class="empty-state-emoji">${getCategoryEmoji(categoryValue) || '🔍'}</p>
            </div>
        `;
    } else {
        // Sort notes by category if a category is selected
        if (categoryValue) {
            filteredNotes.sort((a, b) => {
                if (a.category === categoryValue && b.category !== categoryValue) return -1;
                if (a.category !== categoryValue && b.category === categoryValue) return 1;
                return 0;
            });
        }
        
        // Add with staggered animation
        filteredNotes.forEach((note, index) => {
            setTimeout(() => {
                addNoteToUI(note);
            }, index * 50); // Stagger the appearance
        });
    }
}

// Helper function to get emoji for category
function getCategoryEmoji(category) {
    const emojis = {
        'Work': '💼',
        'Personal': '🏠',
        'Ideas': '💡',
        'Study': '📚',
        'Health': '🍎'
    };
    return emojis[category] || '';
}

// Export Function
function exportNotes() {
    const notesToExport = JSON.stringify(allNotes, null, 2);
    const blob = new Blob([notesToExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_notes_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Drag and Drop Functions
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    
    if (draggedElement !== this) {
        const allNoteElements = Array.from(notesContainer.querySelectorAll('.note-card'));
        const draggedIndex = allNoteElements.indexOf(draggedElement);
        const targetIndex = allNoteElements.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }
    }
    
    this.classList.remove('drag-over');
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Set initial theme
    setTheme(currentTheme);
    
    // Setup Pokemon effects
    setupPokemonEffects();
    
    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        showApp();
        userStatus.textContent = currentUser.email;
        loadNotes();
        setupRealtimeSubscription();
    } else {
        showLanding();
    }
    
    // Add animated background
    createAnimatedBackground();
    
    // Setup event listeners
    setupEventListeners();
});

// Landing Page Navigation
showAuthBtn.addEventListener('click', showAuth);
guestAccessBtn.addEventListener('click', enableGuestMode);
backToLandingBtn.addEventListener('click', showLanding);
guestLoginBtn.addEventListener('click', enableGuestMode);

// Auth Tab Switching
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

// Auth Form Submissions
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    handleLogin(email, password);
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    handleSignup(email, password);
});

// Logout Button
logoutBtn.addEventListener('click', handleLogout);

// Note Modal
createNoteBtn.addEventListener('click', () => openNoteModal(false));
closeModalBtn.addEventListener('click', closeNoteModal);

// Color Picker -> Pokemon Picker
pokemonOptions.forEach(option => {
    option.addEventListener('click', () => {
        const pokemon = option.dataset.color;
        setSelectedColor(pokemon);
        
        // Add a small hop animation when selected
        option.classList.add('pokemon-hop');
        setTimeout(() => {
            option.classList.remove('pokemon-hop');
        }, 800);
    });
    
    // Add title with Pokemon type on hover
    const pokemonName = option.dataset.color.charAt(0).toUpperCase() + option.dataset.color.slice(1);
    const pokemonType = pokemonTypes[option.dataset.color];
    option.title = `${pokemonName} (${pokemonType})`;
});

// Search and Filter
searchInput.addEventListener('input', filterNotes);
categoryFilter.addEventListener('change', filterNotes);

// Export Notes
exportBtn.addEventListener('click', exportNotes);

// Theme Toggle
themeToggleBtn.addEventListener('click', toggleTheme);
themeToggleApp.addEventListener('click', toggleTheme);
themeToggleLanding.addEventListener('click', toggleTheme);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === noteModal) {
        closeNoteModal();
    }
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});

// Function to add hover effects to notes
function addNoteHoverEffects() {
    const noteCards = document.querySelectorAll('.note-card');
    
    noteCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Apply a subtle rotation based on mouse position
            card.onmousemove = function(e) {
                const x = e.clientX - card.getBoundingClientRect().left;
                const y = e.clientY - card.getBoundingClientRect().top;
                
                const centerX = card.offsetWidth / 2;
                const centerY = card.offsetHeight / 2;
                
                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;
                
                // Get the Pokemon type to adjust the glow color
                const pokemonClass = Array.from(card.classList)
                    .find(cls => ['pikachu', 'bulbasaur', 'charmander', 'squirtle', 'jigglypuff'].includes(cls));
                
                // Modify transform while preserving the existing CSS hover transform
                card.style.transform = `translateY(-10px) rotateX(${-deltaY * 5}deg) rotateY(${deltaX * 5}deg)`;
                
                // Add a subtle glow based on pokemon type that follows the cursor
                const glowX = Math.min(Math.max(x / card.offsetWidth, 0.3), 0.7);
                const glowY = Math.min(Math.max(y / card.offsetHeight, 0.3), 0.7);
                
                // Use custom properties to set the radial gradient position
                card.style.setProperty('--glow-x', `${glowX * 100}%`);
                card.style.setProperty('--glow-y', `${glowY * 100}%`);
            };
        });
        
        card.addEventListener('mouseleave', () => {
            card.onmousemove = null;
            card.style.transform = '';
            card.style.removeProperty('--glow-x');
            card.style.removeProperty('--glow-y');
        });
    });
}

// Pokemon animations and effects
function setupPokemonEffects() {
    // Enhanced Pokemon selection with animation only
    pokemonOptions.forEach(option => {
        option.addEventListener('click', () => {
            const pokemon = option.dataset.color;
            setSelectedColor(pokemon);
            
            // Add a small hop animation when selected
            option.classList.add('pokemon-hop');
            setTimeout(() => {
                option.classList.remove('pokemon-hop');
            }, 800);
        });
    });
}

// Function to create particles when updating a note
function createUpdateParticles(element) {
    const rect = element.getBoundingClientRect();
    const particles = 12; // Slightly fewer particles
    
    for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div');
        particle.className = 'update-particle';
        
        // Randomize particle properties
        const size = Math.random() * 6 + 4; // Smaller size range
        const left = Math.random() * rect.width;
        const top = Math.random() * rect.height * 0.6 + rect.height * 0.2; // More centralized
        const duration = Math.random() * 0.6 + 0.5; // Shorter duration
        const delay = Math.random() * 0.1; // Less delay variation
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}px`;
        particle.style.top = `${top}px`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        // Add a slight color tint based on note color
        const noteColor = element.classList.contains('pikachu') ? '#FFF8E6' :
                          element.classList.contains('bulbasaur') ? '#F1FFEA' :
                          element.classList.contains('charmander') ? '#FFF1EA' :
                          element.classList.contains('squirtle') ? '#EEF4FF' :
                          element.classList.contains('jigglypuff') ? '#FFF5FB' : '#FFFFFF';
        
        particle.style.backgroundColor = noteColor;
        particle.style.opacity = '0.9';
        
        element.appendChild(particle);
        
        // Remove particles after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, (duration + delay) * 1000 + 100);
    }
}

// Function to create an animated background
function createAnimatedBackground() {
    const appContainer = document.querySelector('.app-container');
    const bgCanvas = document.createElement('canvas');
    bgCanvas.className = 'background-canvas';
    bgCanvas.style.position = 'fixed';
    bgCanvas.style.top = '0';
    bgCanvas.style.left = '0';
    bgCanvas.style.width = '100vw';
    bgCanvas.style.height = '100vh';
    bgCanvas.style.pointerEvents = 'none';
    bgCanvas.style.zIndex = '-1';
    bgCanvas.style.opacity = '0.05';
    
    appContainer.appendChild(bgCanvas);
    
    const ctx = bgCanvas.getContext('2d');
    
    // Make canvas full screen
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    
    // Create random floating particles
    const particles = [];
    const pokemonItems = ['pokeball', 'greatball', 'ultraball', 'masterball', 'star'];
    
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            size: Math.random() * 10 + 5,
            speedX: Math.random() * 1 - 0.5,
            speedY: Math.random() * 1 - 0.5,
            type: pokemonItems[Math.floor(Math.random() * pokemonItems.length)]
        });
    }
    
    // Update particles
    function animateParticles() {
        ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        particles.forEach(p => {
            // Move particle
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Bounce off edges
            if (p.x <= 0 || p.x >= bgCanvas.width) p.speedX *= -1;
            if (p.y <= 0 || p.y >= bgCanvas.height) p.speedY *= -1;
            
            // Draw particle
            ctx.beginPath();
            
            if (p.type === 'pokeball') {
                ctx.fillStyle = currentTheme === 'dark' ? '#ad3b3a' : '#ff5a59'; 
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            } else if (p.type === 'greatball') {
                ctx.fillStyle = currentTheme === 'dark' ? '#3a56ad' : '#5986ff';
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            } else if (p.type === 'ultraball') {
                ctx.fillStyle = currentTheme === 'dark' ? '#8a852c' : '#ffff59';
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            } else if (p.type === 'masterball') {
                ctx.fillStyle = currentTheme === 'dark' ? '#67348a' : '#9e59ff';
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            } else {
                // Star shape
                const spikes = 5;
                const outerRadius = p.size;
                const innerRadius = p.size / 2;
                
                ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI * i) / spikes;
                    ctx.lineTo(
                        p.x + radius * Math.cos(angle),
                        p.y + radius * Math.sin(angle)
                    );
                }
                ctx.closePath();
                ctx.fillStyle = currentTheme === 'dark' ? '#856a2c' : '#ffc859';
            }
            
            ctx.fill();
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    // Start animation
    animateParticles();
    
    // Update canvas size on window resize
    window.addEventListener('resize', () => {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    });
    
    // Update particles when theme changes
    document.addEventListener('themeChanged', () => {
        // Adjust particle colors based on theme
        animateParticles();
    });
}

// Enhanced event listeners
function setupEventListeners() {
    const form = document.querySelector('form');
    form.addEventListener('submit', event => {
        // Note: We don't need this check since the form submission
        // is already handled by the noteForm submit event listener
        // This was causing a reference error since createNote and updateNote
        // functions don't exist in this context
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Delete Note button in modal
deleteNoteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openDeleteModal();
});

closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

// Remove audio elements from the DOM since we're not using sounds anymore
document.querySelectorAll('audio').forEach(audio => {
    audio.remove();
}); 