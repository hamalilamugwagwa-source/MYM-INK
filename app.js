// ========================================
// MYB - Creative Writing & Storytelling Platform
// Main Application JavaScript
// ========================================

// Global State Management
const AppState = {
    currentUser: null,
    currentBook: null,
    currentChapter: 1,
    books: [],
    userLibrary: [],
    purchasedBooks: [],
    readingProgress: {},
    likedBooks: [],
    darkMode: false,
    isAdmin: false,
    hamburgerMenuOpen: false,
    adminMenuOpen: false
};

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        AppState.darkMode = true;
        updateThemeIcon();
    }
    
    // Load saved user session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        AppState.currentUser = JSON.parse(savedUser);
        // Check if user is admin by looking up in demo users
        const demoUsers = getDemoUsers();
        const userData = demoUsers.find(u => u.id === AppState.currentUser.id);
        AppState.isAdmin = userData && userData.role === 'admin';
        updateAuthUI();
    }
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load initial data
    await loadBooks();
    await loadGenres();
    
    // Render homepage
    renderHomePage();
    
    // Initialize enhanced features
    if (typeof initializeEnhancedFeatures === 'function') {
        initializeEnhancedFeatures();
    }
    
    // Initialize auth logo with fallback
    initializeAuthLogo();
    
    // Handle initial route
    handleRoute();
}

// Initialize auth modal logo
function initializeAuthLogo() {
    const authLogoImg = document.getElementById('auth-logo-img');
    if (authLogoImg) {
        // Try to load the logo image
        authLogoImg.onerror = function() {
            // If image fails to load, create a beautiful SVG gradient logo as fallback
            this.style.display = 'none';
            const logoContainer = this.parentElement;
            
            const svgLogo = document.createElement('div');
            svgLogo.innerHTML = `
                <svg width="280" height="280" viewBox="0 0 280 280" style="filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3));">
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
                            <stop offset="25%" style="stop-color:#8B5CF6;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#EC4899;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#F43F5E;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Open Book -->
                    <path d="M 70 140 Q 70 100 100 100 L 130 100 L 130 200 L 100 200 Q 70 200 70 160 Z" 
                          fill="url(#logoGradient)" opacity="0.9"/>
                    <path d="M 210 140 Q 210 100 180 100 L 150 100 L 150 200 L 180 200 Q 210 200 210 160 Z" 
                          fill="url(#logoGradient)" opacity="0.9"/>
                    
                    <!-- Book Pages Lines -->
                    <line x1="100" y1="120" x2="130" y2="120" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    <line x1="100" y1="140" x2="130" y2="140" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    <line x1="100" y1="160" x2="130" y2="160" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    <line x1="150" y1="120" x2="180" y2="120" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    <line x1="150" y1="140" x2="180" y2="140" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    <line x1="150" y1="160" x2="180" y2="160" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                    
                    <!-- Feather Quill -->
                    <path d="M 190 60 Q 200 40 210 50 Q 215 55 210 70 L 180 140 L 175 135 Z" 
                          fill="url(#logoGradient)" opacity="0.95"/>
                    <path d="M 195 65 L 190 75 M 200 70 L 195 80 M 205 75 L 200 85" 
                          stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
                    
                    <!-- MYB Text -->
                    <text x="140" y="240" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
                          fill="url(#logoGradient)" text-anchor="middle">MYB</text>
                </svg>
            `;
            logoContainer.insertBefore(svgLogo, logoContainer.firstChild);
        };
    }
}

// ========================================
// Event Listeners
// ========================================

function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavClick);
    });
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Auth button
    document.getElementById('auth-btn').addEventListener('click', () => {
        if (AppState.currentUser) {
            logout();
        } else {
            openModal('auth-modal');
        }
    });
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', handleAuthTabClick);
    });
    
    // Auth forms
    document.getElementById('signin-form').addEventListener('submit', handleSignIn);
    document.getElementById('signup-form').addEventListener('submit', handleSignUp);
    
    // My Library tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleLibraryTabClick);
    });
    
    // Search functionality
    document.getElementById('nav-search-input').addEventListener('input', handleSearch);
    
    // Filter functionality
    const genreFilter = document.getElementById('genre-filter');
    const sortFilter = document.getElementById('sort-filter');
    const statusFilter = document.getElementById('status-filter');
    
    if (genreFilter) genreFilter.addEventListener('change', applyFilters);
    if (sortFilter) sortFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    
    // Handle browser back/forward
    window.addEventListener('popstate', handleRoute);
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Hamburger menu toggle
    const hamburgerToggle = document.getElementById('hamburger-toggle');
    if (hamburgerToggle) {
        hamburgerToggle.addEventListener('click', toggleHamburgerMenu);
    }

    // Admin menu toggle
    const adminToggle = document.getElementById('admin-toggle');
    if (adminToggle) {
        adminToggle.addEventListener('click', toggleAdminMenu);
    }

    // Hamburger menu links
    document.querySelectorAll('.hamburger-link').forEach(link => {
        link.addEventListener('click', handleHamburgerLinkClick);
    });

    // Admin menu links
    document.querySelectorAll('.admin-menu-link').forEach(link => {
        link.addEventListener('click', handleAdminLinkClick);
    });

    // Close menus when clicking outside
    document.addEventListener('click', closeMenusOnOutsideClick);
    
    // Newsletter form
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }

    // Centralized navigation and action handling
    document.body.addEventListener('click', (e) => {
        // Navigation for buttons and links with data-page
        const navTarget = e.target.closest('[data-page]');
        if (navTarget && !navTarget.classList.contains('nav-link')) { // nav-links handled separately
            e.preventDefault();
            navigateTo(navTarget.dataset.page);
        }

        // Action handlers for buttons with data-action
        const actionTarget = e.target.closest('[data-action]');
        if (actionTarget) {
            e.preventDefault();
            if (actionTarget.dataset.action === 'privacy') showPrivacyPolicy();
            if (actionTarget.dataset.action === 'terms') showTermsOfService();
        }
    });
}

// ========================================
// Navigation & Routing
// ========================================

function handleNavClick(e) {
    e.preventDefault();
    const page = e.currentTarget.dataset.page;
    navigateTo(page);
}

function navigateTo(page) {
    // Update URL
    history.pushState({ page }, '', `#${page}`);
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Load page-specific content
        switch(page) {
            case 'home':
                renderHomePage();
                break;
            case 'library':
                renderLibraryPage();
                break;
            case 'mylibrary':
                renderMyLibraryPage();
                break;
            case 'profile':
                renderProfilePage();
                break;
            case 'admin':
                if (!AppState.isAdmin) {
                    showToast('Admin access required', 'error');
                    navigateTo('home');
                }
                break;
            case 'community':
                if (typeof renderCommunityFeed === 'function') {
                    renderCommunityFeed();
                }
                break;
            case 'messages':
                if (!AppState.currentUser) {
                    showToast('Please sign in to access messages', 'error');
                    navigateTo('home');
                }
                break;
            case 'help':
            case 'faq':
            case 'contact':
                // These pages are static, no special loading needed
                break;
        }
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleRoute() {
    const hash = window.location.hash.slice(1);
    const page = hash || 'home';
    
    // Check if it's a book detail page
    if (hash.startsWith('book/')) {
        const bookId = hash.split('/')[1];
        showBookDetail(bookId);
    } else if (hash.startsWith('read/')) {
        const parts = hash.split('/');
        const bookId = parts[1];
        const chapter = parseInt(parts[2]) || 1;
        showReader(bookId, chapter);
    } else {
        navigateTo(page);
        
        // Load page-specific content
        if (page === 'pdf-library') {
            if (typeof renderPDFStoriesLibrary === 'function') {
                renderPDFStoriesLibrary();
            }
        } else if (page === 'forum') {
            if (typeof renderForumThreads === 'function') {
                renderForumThreads();
            }
        } else if (page === 'contests') {
            if (typeof renderActiveContests === 'function') {
                renderActiveContests();
            }
        } else if (page === 'admin') {
            // Load admin dashboard data
            if (AppState.isAdmin && typeof renderPendingPDFStories === 'function') {
                renderPendingPDFStories();
            }
        }
    }
}

// ========================================
// Data Loading Functions
// ========================================

function getDemoUsers() {
    const baseUsers = [
        {
            id: 'admin-001',
            username: 'Admin',
            email: 'miyobamhamalila@gmail.com',
            password: '2019',
            role: 'admin',
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            is_verified: true,
            joined_date: '2024-01-01T00:00:00Z',
            bio: 'Platform Administrator'
        },
        {
            id: 'demo-user-001',
            username: 'BookLover',
            email: 'demo@example.com',
            password: 'demo123',
            role: 'user',
            followers_count: 15,
            following_count: 23,
            posts_count: 5,
            is_verified: true,
            joined_date: '2024-02-15T00:00:00Z',
            bio: 'Avid reader and book enthusiast'
        },
        {
            id: 'demo-user-002',
            username: 'StoryTeller',
            email: 'story@example.com',
            password: 'story123',
            role: 'user',
            followers_count: 8,
            following_count: 12,
            posts_count: 3,
            is_verified: false,
            joined_date: '2024-03-01T00:00:00Z',
            bio: 'Aspiring writer sharing my stories'
        }
    ];

    // Load additional users from localStorage
    const storedUsers = localStorage.getItem('demoUsers');
    if (storedUsers) {
        const additionalUsers = JSON.parse(storedUsers);
        return [...baseUsers, ...additionalUsers];
    }

    return baseUsers;
}

function saveDemoUser(user) {
    const storedUsers = localStorage.getItem('demoUsers');
    const additionalUsers = storedUsers ? JSON.parse(storedUsers) : [];
    additionalUsers.push(user);
    localStorage.setItem('demoUsers', JSON.stringify(additionalUsers));
}

function getDemoBooks() {
    return [
        {
            id: 'demo-1',
            title: 'The Lost Kingdom',
            author: 'Sarah Mitchell',
            genre: 'Fantasy',
            cover_url: 'https://via.placeholder.com/200x300?text=The+Lost+Kingdom',
            synopsis: 'In a world where magic is fading, one young warrior must embark on a quest to restore the ancient powers before darkness consumes everything.',
            price: 4.99,
            rating: 4.8,
            reads: 12500,
            likes: 890,
            featured: true,
            status: 'completed',
            published_date: '2024-01-15T00:00:00Z',
            tags: ['fantasy', 'adventure', 'magic']
        },
        {
            id: 'demo-2',
            title: 'Shadows of the Past',
            author: 'Michael Reynolds',
            genre: 'Mystery',
            cover_url: 'https://via.placeholder.com/200x300?text=Shadows+of+the+Past',
            synopsis: 'A detective uncovers a conspiracy that reaches the highest levels of power, threatening to expose secrets that have been buried for decades.',
            price: 3.99,
            rating: 4.6,
            reads: 8900,
            likes: 654,
            featured: false,
            status: 'completed',
            published_date: '2024-02-01T00:00:00Z',
            tags: ['mystery', 'thriller', 'conspiracy']
        },
        {
            id: 'demo-3',
            title: 'Digital Dreams',
            author: 'Emma Chen',
            genre: 'Sci-Fi',
            cover_url: 'https://via.placeholder.com/200x300?text=Digital+Dreams',
            synopsis: 'In a future where humans and AI coexist, one programmer discovers that the line between reality and virtual worlds is thinner than anyone imagined.',
            price: 5.49,
            rating: 4.9,
            reads: 15600,
            likes: 1200,
            featured: true,
            status: 'ongoing',
            published_date: '2024-01-20T00:00:00Z',
            tags: ['sci-fi', 'technology', 'artificial intelligence']
        },
        {
            id: 'demo-4',
            title: 'Hearts Entwined',
            author: 'Jessica Parker',
            genre: 'Romance',
            cover_url: 'https://via.placeholder.com/200x300?text=Hearts+Entwined',
            synopsis: 'Two rival chefs are forced to work together when their restaurants are merged, leading to unexpected sparks and culinary delights.',
            price: 3.49,
            rating: 4.7,
            reads: 11200,
            likes: 980,
            featured: false,
            status: 'completed',
            published_date: '2024-01-10T00:00:00Z',
            tags: ['romance', 'contemporary', 'food']
        },
        {
            id: 'demo-5',
            title: 'The Forgotten City',
            author: 'David Thompson',
            genre: 'Adventure',
            cover_url: 'https://via.placeholder.com/200x300?text=The+Forgotten+City',
            synopsis: 'An archaeologist discovers an ancient city that holds secrets about humanity\'s origins, but awakening these secrets comes at a terrible cost.',
            price: 4.49,
            rating: 4.5,
            reads: 7800,
            likes: 567,
            featured: false,
            status: 'completed',
            published_date: '2024-02-15T00:00:00Z',
            tags: ['adventure', 'archaeology', 'ancient history']
        },
        {
            id: 'demo-6',
            title: 'Whispers in the Dark',
            author: 'Rachel Blackwood',
            genre: 'Horror',
            cover_url: 'https://via.placeholder.com/200x300?text=Whispers+in+the+Dark',
            synopsis: 'A family moves into an old Victorian house, only to discover that some residents never truly leave. The whispers start softly, but they grow louder...',
            price: 3.99,
            rating: 4.4,
            reads: 9200,
            likes: 743,
            featured: false,
            status: 'completed',
            published_date: '2024-01-25T00:00:00Z',
            tags: ['horror', 'supernatural', 'ghosts']
        }
    ];
}

async function loadBooks() {
    try {
        const response = await fetch('tables/books?limit=100');
        if (response.ok) {
            const data = await response.json();
            AppState.books = data.data || [];
        } else if (response.status === 404) {
            // API not available, use demo data
            console.log('API not available, using demo data');
            AppState.books = getDemoBooks();
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
        return AppState.books;
    } catch (error) {
        console.error('Error loading books:', error);
        // Fallback to demo data
        AppState.books = getDemoBooks();
        return AppState.books;
    }
}

async function loadGenres() {
    // Extract unique genres from books
    const genres = [...new Set(AppState.books.map(book => book.genre).filter(Boolean))];
    
    // Populate genre filter
    const genreFilter = document.getElementById('genre-filter');
    if (genreFilter) {
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreFilter.appendChild(option);
        });
    }
    
    return genres;
}

async function loadChapters(bookId) {
    try {
        const response = await fetch(`tables/chapters?limit=100`);
        const data = await response.json();
        const chapters = (data.data || []).filter(ch => ch.book_id === bookId);
        return chapters.sort((a, b) => a.chapter_number - b.chapter_number);
    } catch (error) {
        console.error('Error loading chapters:', error);
        return [];
    }
}

async function loadUserPurchases() {
    if (!AppState.currentUser) return [];
    
    try {
        const response = await fetch('tables/purchases?limit=100');
        const data = await response.json();
        const purchases = (data.data || []).filter(p => p.user_id === AppState.currentUser.id);
        AppState.purchasedBooks = purchases.map(p => p.book_id);
        return purchases;
    } catch (error) {
        console.error('Error loading purchases:', error);
        return [];
    }
}

async function loadReadingProgress() {
    if (!AppState.currentUser) return {};
    
    try {
        const response = await fetch('tables/reading_progress?limit=100');
        const data = await response.json();
        const progress = (data.data || []).filter(p => p.user_id === AppState.currentUser.id);
        
        const progressMap = {};
        progress.forEach(p => {
            progressMap[p.book_id] = p;
        });
        
        AppState.readingProgress = progressMap;
        return progressMap;
    } catch (error) {
        console.error('Error loading reading progress:', error);
        return {};
    }
}

// ========================================
// Home Page Rendering
// ========================================

function renderHomePage() {
    renderFeaturedBooks();
    renderTrendingBooks();
    renderGenres();
    updateStatsDisplay();
}

function renderFeaturedBooks() {
    const container = document.getElementById('featured-books');
    if (!container) return;
    
    const featuredBooks = AppState.books
        .filter(book => book.featured)
        .slice(0, 6);
    
    container.innerHTML = featuredBooks.length > 0
        ? featuredBooks.map(book => createBookCard(book)).join('')
        : '<div class="empty-state"><i class="fas fa-book"></i><h3>No featured books yet</h3><p>Check back soon for amazing stories!</p></div>';
}

function renderTrendingBooks() {
    const container = document.getElementById('trending-books');
    if (!container) return;
    
    const trendingBooks = [...AppState.books]
        .sort((a, b) => (b.reads || 0) - (a.reads || 0))
        .slice(0, 6);
    
    container.innerHTML = trendingBooks.length > 0
        ? trendingBooks.map(book => createBookCard(book)).join('')
        : '<div class="empty-state"><i class="fas fa-fire"></i><h3>No trending books yet</h3></div>';
}

function renderGenres() {
    const container = document.getElementById('genres-grid');
    if (!container) return;
    
    const genres = [
        { name: 'Romance', icon: 'fa-heart', count: '25K+' },
        { name: 'Fantasy', icon: 'fa-dragon', count: '18K+' },
        { name: 'Mystery', icon: 'fa-mask', count: '15K+' },
        { name: 'Sci-Fi', icon: 'fa-rocket', count: '12K+' },
        { name: 'Thriller', icon: 'fa-bolt', count: '10K+' },
        { name: 'Horror', icon: 'fa-ghost', count: '8K+' }
    ];
    
    container.innerHTML = genres.map(genre => `
        <div class="genre-card" onclick="filterByGenre('${genre.name}')">
            <i class="fas ${genre.icon}"></i>
            <h3>${genre.name}</h3>
            <p>${genre.count} Stories</p>
        </div>
    `).join('');
}

// ========================================
// Library Page Rendering
// ========================================

function renderLibraryPage() {
    applyFilters();
}

function applyFilters() {
    const genreFilter = document.getElementById('genre-filter')?.value || '';
    const sortFilter = document.getElementById('sort-filter')?.value || 'popular';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const searchQuery = document.getElementById('nav-search-input')?.value.toLowerCase() || '';
    
    let filteredBooks = [...AppState.books];
    
    // Apply genre filter
    if (genreFilter) {
        filteredBooks = filteredBooks.filter(book => book.genre === genreFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
        filteredBooks = filteredBooks.filter(book => book.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
        filteredBooks = filteredBooks.filter(book =>
            book.title.toLowerCase().includes(searchQuery) ||
            book.author.toLowerCase().includes(searchQuery) ||
            (book.genre && book.genre.toLowerCase().includes(searchQuery))
        );
    }
    
    // Apply sorting
    switch(sortFilter) {
        case 'popular':
            filteredBooks.sort((a, b) => (b.reads || 0) - (a.reads || 0));
            break;
        case 'recent':
            filteredBooks.sort((a, b) => new Date(b.published_date) - new Date(a.published_date));
            break;
        case 'rating':
            filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'title':
            filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }
    
    const container = document.getElementById('library-books');
    if (container) {
        container.innerHTML = filteredBooks.length > 0
            ? filteredBooks.map(book => createBookCard(book)).join('')
            : '<div class="empty-state"><i class="fas fa-search"></i><h3>No books found</h3><p>Try adjusting your filters</p></div>';
    }
}

function filterByGenre(genre) {
    navigateTo('library');
    setTimeout(() => {
        const genreFilter = document.getElementById('genre-filter');
        if (genreFilter) {
            genreFilter.value = genre;
            applyFilters();
        }
    }, 100);
}

// ========================================
// Book Card Component
// ========================================

function createBookCard(book) {
    const rating = book.rating || 0;
    const reads = formatNumber(book.reads || 0);
    const likes = formatNumber(book.likes || 0);
    
    return `
        <div class="book-card" onclick="showBookDetail('${book.id}')">
            ${book.featured ? '<div class="book-badge">Featured</div>' : ''}
            <img src="${book.cover_url}" alt="${book.title}" class="book-cover" onerror="this.src='https://via.placeholder.com/200x300?text=Book+Cover'">
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <div class="book-meta">
                    <span class="book-rating">
                        <i class="fas fa-star"></i> ${rating.toFixed(1)}
                    </span>
                    <span>
                        <i class="fas fa-eye"></i> ${reads}
                    </span>
                    <span>
                        <i class="fas fa-heart"></i> ${likes}
                    </span>
                </div>
                ${book.tags && book.tags.length > 0 ? `
                    <div class="book-tags">
                        ${book.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ========================================
// Book Detail Page
// ========================================

async function showBookDetail(bookId) {
    const book = AppState.books.find(b => b.id === bookId);
    if (!book) {
        showToast('Book not found', 'error');
        return;
    }
    
    AppState.currentBook = book;
    
    // Increment view count
    incrementBookViews(bookId);
    
    // Update URL
    history.pushState({ page: 'book-detail', bookId }, '', `#book/${bookId}`);
    
    // Show book detail page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('book-detail-page').classList.add('active');
    
    // Load chapters
    const chapters = await loadChapters(bookId);
    
    // Check if user has purchased this book
    const isPurchased = AppState.purchasedBooks.includes(bookId);
    
    // Get reading progress
    const progress = AppState.readingProgress[bookId];
    const currentChapter = progress ? progress.current_chapter : 1;
    
    // Render book detail
    const container = document.getElementById('book-detail-content');
    container.innerHTML = `
        <div>
            <img src="${book.cover_url}" alt="${book.title}" class="book-detail-cover" onerror="this.src='https://via.placeholder.com/300x450?text=Book+Cover'">
        </div>
        <div class="book-detail-info">
            <div class="book-detail-header">
                <h1>${book.title}</h1>
                <p class="author">by ${book.author}</p>
            </div>
            
            <div class="book-detail-stats">
                <div class="book-detail-stat">
                    <strong><i class="fas fa-star"></i> ${(book.rating || 0).toFixed(1)}</strong>
                    <span>Rating</span>
                </div>
                <div class="book-detail-stat">
                    <strong><i class="fas fa-eye"></i> ${formatNumber(book.reads || 0)}</strong>
                    <span>Reads</span>
                </div>
                <div class="book-detail-stat">
                    <strong><i class="fas fa-heart"></i> ${formatNumber(book.likes || 0)}</strong>
                    <span>Likes</span>
                </div>
                <div class="book-detail-stat">
                    <strong><i class="fas fa-book"></i> ${chapters.length}</strong>
                    <span>Chapters</span>
                </div>
            </div>
            
            <div class="book-detail-actions">
                <button class="btn-primary btn-large" onclick="showReader('${book.id}', ${currentChapter})">
                    <i class="fas fa-book-reader"></i>
                    ${progress ? 'Continue Reading' : 'Read Online FREE'}
                </button>
                ${!isPurchased ? `
                    <button class="btn-outline btn-large" onclick="initiatePayment('${book.id}')">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                    <span class="price-tag">
                        <i class="fas fa-tag"></i>
                        $${(book.price || 0).toFixed(2)}
                    </span>
                ` : `
                    <button class="btn-outline btn-large" onclick="downloadBook('${book.id}')">
                        <i class="fas fa-download"></i>
                        Download (Purchased)
                    </button>
                `}
                <button class="btn-icon" onclick="toggleBookLike('${book.id}')" title="Add to Favorites" style="width: 50px; height: 50px; font-size: 1.2rem;">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="btn-icon" onclick="showCommentsModal('${book.id}')" title="Comments" style="width: 50px; height: 50px; font-size: 1.2rem;">
                    <i class="fas fa-comments"></i>
                </button>
            </div>
            
            <div class="book-detail-synopsis">
                <h3>Synopsis</h3>
                <p>${book.synopsis || 'No description available.'}</p>
            </div>
            
            <div style="margin-top: 1.5rem;">
                <button class="btn-outline" onclick="showCommentsModal('${book.id}')">
                    <i class="fas fa-comments"></i> View Comments
                </button>
            </div>
            
            ${chapters.length > 0 ? `
                <div class="book-detail-chapters">
                    <h3><i class="fas fa-list"></i> Chapters</h3>
                    <div class="chapters-list">
                        ${chapters.map(chapter => `
                            <div class="chapter-item" onclick="showReader('${book.id}', ${chapter.chapter_number})">
                                <div>
                                    <div class="chapter-title">Chapter ${chapter.chapter_number}: ${chapter.title}</div>
                                    <div class="chapter-meta">${formatNumber(chapter.word_count || 0)} words</div>
                                </div>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// Reader Interface
// ========================================

async function showReader(bookId, chapterNumber = 1) {
    const book = AppState.books.find(b => b.id === bookId);
    if (!book) return;
    
    const chapters = await loadChapters(bookId);
    const chapter = chapters.find(ch => ch.chapter_number === chapterNumber);
    
    if (!chapter) {
        showToast('Chapter not found', 'error');
        return;
    }
    
    AppState.currentBook = book;
    AppState.currentChapter = chapterNumber;
    
    // Update URL
    history.pushState({ page: 'reader', bookId, chapterNumber }, '', `#read/${bookId}/${chapterNumber}`);
    
    // Show reader page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('reader-page').classList.add('active');
    
    // Render reader
    const container = document.getElementById('reader-container');
    container.innerHTML = `
        <div class="reader-header">
            <button class="btn-outline" onclick="history.back()">
                <i class="fas fa-arrow-left"></i>
                Back to Book
            </button>
            <div class="reader-controls">
                <button class="btn-icon" onclick="toggleTheme()">
                    <i class="fas fa-adjust"></i>
                </button>
                <button class="btn-icon" onclick="addBookmark()">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
        </div>
        
        <div class="reader-content">
            <h1>${book.title}</h1>
            <h2>Chapter ${chapter.chapter_number}: ${chapter.title}</h2>
            ${formatChapterContent(chapter.content || 'No content available.')}
        </div>
        
        <div class="reader-navigation">
            ${chapterNumber > 1 ? `
                <button class="btn-outline" onclick="showReader('${bookId}', ${chapterNumber - 1})">
                    <i class="fas fa-chevron-left"></i>
                    Previous Chapter
                </button>
            ` : '<div></div>'}
            
            ${chapterNumber < chapters.length ? `
                <button class="btn-primary" onclick="showReader('${bookId}', ${chapterNumber + 1})">
                    Next Chapter
                    <i class="fas fa-chevron-right"></i>
                </button>
            ` : '<div></div>'}
        </div>
    `;
    
    // Save reading progress
    saveReadingProgress(bookId, chapterNumber);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatChapterContent(content) {
    // Split content into paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs.map(p => `<p>${p}</p>`).join('');
}

async function saveReadingProgress(bookId, chapterNumber) {
    if (!AppState.currentUser) return;
    
    try {
        const existing = AppState.readingProgress[bookId];
        
        if (existing) {
            // Update existing progress
            await fetch(`tables/reading_progress/${existing.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_chapter: chapterNumber,
                    last_read: new Date().toISOString()
                })
            });
        } else {
            // Create new progress entry
            const response = await fetch('tables/reading_progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: AppState.currentUser.id,
                    book_id: bookId,
                    current_chapter: chapterNumber,
                    last_read: new Date().toISOString()
                })
            });
            const data = await response.json();
            AppState.readingProgress[bookId] = data;
        }
    } catch (error) {
        console.error('Error saving reading progress:', error);
    }
}

// ========================================
// My Library Page
// ========================================

async function renderMyLibraryPage() {
    if (!AppState.currentUser) {
        document.getElementById('reading-books').innerHTML = renderLoginPrompt();
        document.getElementById('purchased-books').innerHTML = renderLoginPrompt();
        document.getElementById('favorites-books').innerHTML = renderLoginPrompt();
        return;
    }
    
    await loadReadingProgress();
    await loadUserPurchases();
    
    // Render currently reading
    const readingBooks = Object.keys(AppState.readingProgress).map(bookId => {
        return AppState.books.find(b => b.id === bookId);
    }).filter(Boolean);
    
    document.getElementById('reading-books').innerHTML = readingBooks.length > 0
        ? readingBooks.map(book => createBookCard(book)).join('')
        : '<div class="empty-state"><i class="fas fa-book-reader"></i><h3>No books in progress</h3><p>Start reading to see books here</p></div>';
    
    // Render purchased books
    const purchased = AppState.purchasedBooks.map(bookId => {
        return AppState.books.find(b => b.id === bookId);
    }).filter(Boolean);
    
    document.getElementById('purchased-books').innerHTML = purchased.length > 0
        ? purchased.map(book => createBookCard(book)).join('')
        : '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No purchased books</h3><p>Download books to read offline</p></div>';
    
    // Render favorites (placeholder)
    document.getElementById('favorites-books').innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><h3>No favorites yet</h3><p>Mark books as favorites to see them here</p></div>';
}

function handleLibraryTabClick(e) {
    const tab = e.currentTarget.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Show corresponding content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}-content`).classList.add('active');
}

function renderLoginPrompt() {
    return `
        <div class="empty-state">
            <i class="fas fa-user-lock"></i>
            <h3>Sign in to access your library</h3>
            <button class="btn-primary" onclick="openModal('auth-modal')">
                <i class="fas fa-sign-in-alt"></i>
                Sign In
            </button>
        </div>
    `;
}

// ========================================
// Profile Page
// ========================================

function renderProfilePage() {
    const container = document.getElementById('profile-card');
    
    if (!AppState.currentUser) {
        container.innerHTML = renderLoginPrompt();
        return;
    }
    
    const user = AppState.currentUser;
    const initial = user.username.charAt(0).toUpperCase();
    const readingCount = Object.keys(AppState.readingProgress).length;
    const purchasedCount = AppState.purchasedBooks.length;
    
    container.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">${initial}</div>
            <div class="profile-info">
                <h2>${user.username}</h2>
                <p class="profile-bio">${user.email}</p>
                <p class="profile-bio">${user.bio || 'Book lover and avid reader'}</p>
            </div>
        </div>
        
        <div class="profile-stats">
            <div class="profile-stat">
                <strong>${readingCount}</strong>
                <span>Reading</span>
            </div>
            <div class="profile-stat">
                <strong>${purchasedCount}</strong>
                <span>Purchased</span>
            </div>
            <div class="profile-stat">
                <strong>0</strong>
                <span>Reviews</span>
            </div>
        </div>
        
        <button class="btn-outline btn-block" onclick="logout()">
            <i class="fas fa-sign-out-alt"></i>
            Sign Out
        </button>
    `;
}

// ========================================
// Authentication
// ========================================

function handleAuthTabClick(e) {
    const tab = e.currentTarget.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Show corresponding form
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${tab}-form`).classList.add('active');
}

async function handleSignIn(e) {
    e.preventDefault();

    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;

    try {
        // Validate input
        if (!email || !password) {
            showToast('Please enter both email and password', 'error');
            return;
        }

        // Try server authentication first
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password })
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.token;

                // Decode token to get user info (simple decode, in production use proper JWT library)
                const payload = JSON.parse(atob(token.split('.')[1]));

                const userWithoutPassword = {
                    id: payload.id,
                    username: data.username,
                    email: payload.username,
                    role: payload.role,
                    token: token
                };

                AppState.currentUser = userWithoutPassword;
                AppState.isAdmin = payload.role === 'admin';
                localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

                closeModal('auth-modal');
                updateAuthUI();
                showToast(`Welcome back, ${data.username}!`, 'success');

                // Reload user data
                await loadUserPurchases();
                await loadReadingProgress();

                // Navigate to appropriate page
                if (payload.role === 'admin') {
                    navigateTo('admin');
                } else {
                    navigateTo('home');
                }
                return;
            }
        } catch (serverError) {
            console.log('Server auth failed, trying demo users:', serverError);
        }

        // Fallback to demo users if server is not available
        const demoUsers = getDemoUsers();
        const user = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (user) {
            // Create a clean user object without password
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;

            AppState.currentUser = userWithoutPassword;
            AppState.isAdmin = user.role === 'admin';
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

            closeModal('auth-modal');
            updateAuthUI();
            showToast(`Welcome back, ${user.username}!`, 'success');

            // Reload user data
            await loadUserPurchases();
            await loadReadingProgress();

            // Navigate to appropriate page
            if (user.role === 'admin') {
                navigateTo('admin');
            } else {
                navigateTo('home');
            }
        } else {
            showToast('Invalid email or password', 'error');
        }
    } catch (error) {
        console.error('Sign-in error:', error);
        // Fallback to demo users if the server fails
        const demoUsers = getDemoUsers();
        const user = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (user) {
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;

            AppState.currentUser = userWithoutPassword;
            AppState.isAdmin = user.role === 'admin';
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

            closeModal('auth-modal');
            updateAuthUI();
            showToast(`Welcome back, ${user.username}! (Demo Mode)`, 'success');
            if (user.role === 'admin') navigateTo('admin');
        } else {
            showToast('Invalid email or password', 'error');
        }
    }
}

async function handleSignUp(e) {
    e.preventDefault();

    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!username || !email || !password) {
        return showToast('Please fill in all fields', 'error');
    }
    if (password.length < 6) {
        return showToast('Password must be at least 6 characters long', 'error');
    }

    // Fallback to demo users if server is not available
    const demoUsers = getDemoUsers();
    const existingUser = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
        return showToast('Email already registered', 'error');
    }

        // Create new user object
        const newUser = {
            id: `user-${Date.now()}`,
            username,
            email: email.toLowerCase(),
            password, // In demo mode, store password (in production, hash it)
            role: 'user',
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            is_verified: false,
            joined_date: new Date().toISOString(),
            bio: 'New reader on MYB'
        };

        // Save to localStorage for persistence
        saveDemoUser(newUser);

        // Create a clean user object without password for session
        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.password;

        AppState.currentUser = userWithoutPassword;
        AppState.isAdmin = false;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

        closeModal('auth-modal');
        updateAuthUI();
        showToast(`Welcome to MYB, ${username}!`, 'success');

        // Navigate to home
        navigateTo('home');
    } catch (error) {
        console.error('Error signing up:', error);
        showToast('Error creating account. Please try again.', 'error');
    }
}

function logout() {
    AppState.currentUser = null;
    AppState.purchasedBooks = [];
    AppState.readingProgress = {};
    localStorage.removeItem('currentUser');
    
    updateAuthUI();
    navigateTo('home');
    showToast('Signed out successfully', 'success');
}

function updateAuthUI() {
    const authBtn = document.getElementById('auth-btn');
    const adminMenuItem = document.querySelector('.admin-menu-item');

    if (AppState.currentUser) {
        authBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${AppState.currentUser.username}`;

        // Show admin menu item if user is admin
        if (AppState.isAdmin && adminMenuItem) {
            adminMenuItem.style.display = 'flex';
        }
    } else {
        authBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> Sign In`;

        // Hide admin menu item when not logged in
        if (adminMenuItem) {
            adminMenuItem.style.display = 'none';
        }
    }
}

// ========================================
// Payment System
// ========================================

function initiatePayment(bookId) {
    // Use enhanced payment if available
    if (typeof initiatePaymentEnhanced === 'function') {
        initiatePaymentEnhanced(bookId);
        return;
    }
    
    if (!AppState.currentUser) {
        showToast('Please sign in to purchase books', 'error');
        openModal('auth-modal');
        return;
    }
    
    const book = AppState.books.find(b => b.id === bookId);
    if (!book) return;
    
    const container = document.getElementById('payment-container');
    container.innerHTML = `
        <div class="payment-header">
            <h2>Complete Your Purchase</h2>
            <p>Download "${book.title}" for offline reading</p>
            <div class="payment-amount">$${(book.price || 0).toFixed(2)}</div>
        </div>
        
        <div class="payment-methods">
            <div class="payment-method active" data-method="card">
                <i class="fab fa-cc-stripe"></i>
                <div>Credit Card</div>
            </div>
            <div class="payment-method" data-method="paypal">
                <i class="fab fa-paypal"></i>
                <div>PayPal</div>
            </div>
        </div>
        
        <form id="payment-form">
            <div class="form-group">
                <label>Card Number</label>
                <input type="text" placeholder="1234 5678 9012 3456" required>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label>Expiry Date</label>
                    <input type="text" placeholder="MM/YY" required>
                </div>
                <div class="form-group">
                    <label>CVV</label>
                    <input type="text" placeholder="123" required>
                </div>
            </div>
            
            <button type="submit" class="btn-primary btn-block">
                <i class="fas fa-lock"></i>
                Complete Purchase
            </button>
        </form>
        
        <p style="text-align: center; color: var(--text-tertiary); font-size: 0.85rem; margin-top: 1rem;">
            <i class="fas fa-shield-alt"></i> Secure payment powered by Stripe
        </p>
    `;
    
    // Handle payment method selection
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Handle payment submission
    document.getElementById('payment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await processPayment(bookId, book.price);
    });
    
    openModal('payment-modal');
}

async function processPayment(bookId, amount) {
    try {
        // Simulate payment processing
        showToast('Processing payment...', 'success');
        
        // Create purchase record
        const response = await fetch('tables/purchases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: AppState.currentUser.id,
                book_id: bookId,
                amount: amount,
                payment_method: 'credit_card',
                purchase_date: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            AppState.purchasedBooks.push(bookId);
            closeModal('payment-modal');
            showToast('Purchase successful! You can now download the book.', 'success');
            
            // Refresh book detail page
            setTimeout(() => {
                showBookDetail(bookId);
            }, 1000);
        } else {
            showToast('Payment failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showToast('Payment error. Please try again.', 'error');
    }
}

function downloadBook(bookId) {
    const book = AppState.books.find(b => b.id === bookId);
    if (!book) return;
    
    showToast(`Downloading "${book.title}"...`, 'success');
    
    // Simulate download
    setTimeout(() => {
        showToast('Download complete!', 'success');
    }, 2000);
}

// ========================================
// Theme Toggle
// ========================================

function toggleTheme() {
    AppState.darkMode = !AppState.darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', AppState.darkMode ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = AppState.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ========================================
// Search Functionality
// ========================================

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (query.length > 0) {
        // If not on library page, navigate there
        const currentPage = document.querySelector('.page.active');
        if (currentPage.id !== 'library-page') {
            navigateTo('library');
        }
        
        // Apply search filter
        setTimeout(() => {
            applyFilters();
        }, 100);
    }
}

// ========================================
// Modal Functions
// ========================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ========================================
// Toast Notifications
// ========================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} toast-icon"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ========================================
// Utility Functions
// ========================================

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function addBookmark() {
    showToast('Bookmark added!', 'success');
}

function toggleMobileMenu() {
    // Mobile menu functionality
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// ========================================
// Menu Toggle Functions
// ========================================

function toggleHamburgerMenu(e) {
    if (e) e.stopPropagation();

    const hamburgerMenu = document.getElementById('hamburger-menu');
    const hamburgerToggle = document.getElementById('hamburger-toggle');

    if (!hamburgerMenu) return;

    AppState.hamburgerMenuOpen = !AppState.hamburgerMenuOpen;

    if (AppState.hamburgerMenuOpen) {
        hamburgerMenu.classList.add('active');
        if (hamburgerToggle) hamburgerToggle.classList.add('active');

        // Close admin menu if open
        if (AppState.adminMenuOpen) {
            toggleAdminMenu();
        }
    } else {
        hamburgerMenu.classList.remove('active');
        if (hamburgerToggle) hamburgerToggle.classList.remove('active');
    }
}

function toggleAdminMenu(e) {
    if (e) e.stopPropagation();

    // Only allow if user is admin
    if (!AppState.isAdmin) return;

    const adminMenu = document.getElementById('admin-menu');
    const adminToggle = document.querySelector('.admin-menu-item');

    if (!adminMenu) return;

    AppState.adminMenuOpen = !AppState.adminMenuOpen;

    if (AppState.adminMenuOpen) {
        adminMenu.classList.add('active');
        if (adminToggle) adminToggle.classList.add('active');

        // Close hamburger menu if open
        if (AppState.hamburgerMenuOpen) {
            toggleHamburgerMenu();
        }
    } else {
        adminMenu.classList.remove('active');
        if (adminToggle) adminToggle.classList.remove('active');
    }
}

function handleHamburgerLinkClick(e) {
    const page = e.currentTarget.dataset.page;
    if (page) {
        navigateTo(page);
    }

    // Close hamburger menu
    if (AppState.hamburgerMenuOpen) {
        toggleHamburgerMenu();
    }
}

function handleAdminLinkClick(e) {
    const adminPage = e.currentTarget.dataset.adminPage;
    if (adminPage) {
        navigateToAdminPage(adminPage);
    }

    // Close admin menu
    if (AppState.adminMenuOpen) {
        toggleAdminMenu();
    }
}

function navigateToAdminPage(adminPage) {
    // Update URL
    history.pushState({ page: 'admin', adminPage }, '', `#admin-${adminPage}`);

    // Update active admin link
    document.querySelectorAll('.admin-menu-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.adminPage === adminPage) {
            link.classList.add('active');
        }
    });

    // Load admin page content
    loadAdminPage(adminPage);
}

function loadAdminPage(adminPage) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show admin page
    const adminPageElement = document.getElementById('admin-page');
    if (adminPageElement) {
        adminPageElement.classList.add('active');

        // Load specific admin content based on page
        switch(adminPage) {
            case 'approve':
                if (typeof renderPendingPDFStories === 'function') {
                    renderPendingPDFStories();
                }
                break;
            case 'users':
                if (typeof renderUserManagement === 'function') {
                    renderUserManagement();
                }
                break;
            case 'reports':
                if (typeof renderReportsModeration === 'function') {
                    renderReportsModeration();
                }
                break;
            case 'analytics':
                if (typeof renderAnalytics === 'function') {
                    renderAnalytics();
                }
                break;
            case 'settings':
                if (typeof renderAdminSettings === 'function') {
                    renderAdminSettings();
                }
                break;
        }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeMenusOnOutsideClick(e) {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const adminMenu = document.getElementById('admin-menu');
    const hamburgerToggle = document.getElementById('hamburger-toggle');
    const adminToggle = document.querySelector('.admin-menu-item');

    // Close hamburger menu if clicked outside
    if (AppState.hamburgerMenuOpen &&
        hamburgerMenu &&
        !hamburgerMenu.contains(e.target) &&
        hamburgerToggle &&
        !hamburgerToggle.contains(e.target)) {
        toggleHamburgerMenu();
    }

    // Close admin menu if clicked outside
    if (AppState.adminMenuOpen &&
        adminMenu &&
        !adminMenu.contains(e.target) &&
        adminToggle &&
        !adminToggle.contains(e.target)) {
        toggleAdminMenu();
    }
}

// ========================================
// Newsletter Subscription
// ========================================

function handleNewsletterSubmit(e) {
    e.preventDefault();
    const emailInput = e.target.querySelector('input[type="email"]');
    const email = emailInput.value;
    
    // Simulate newsletter subscription
    showToast('Thank you for subscribing! Check your email for confirmation.', 'success');
    emailInput.value = '';
    
    // In production, send to backend
    console.log('Newsletter subscription:', email);
}

// ========================================
// Enhanced Book Features
// ========================================

// Add view count when book is viewed
async function incrementBookViews(bookId) {
    try {
        const book = AppState.books.find(b => b.id === bookId);
        if (book) {
            const newReads = (book.reads || 0) + 1;
            await fetch(`tables/books/${bookId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reads: newReads })
            });
            book.reads = newReads;
        }
    } catch (error) {
        console.error('Error incrementing views:', error);
    }
}

// Like/Unlike book functionality
async function toggleBookLike(bookId) {
    if (!AppState.currentUser) {
        showToast('Please sign in to like books', 'error');
        openModal('auth-modal');
        return;
    }

    const isLiked = AppState.likedBooks.includes(bookId);

    try {
        const book = AppState.books.find(b => b.id === bookId);
        if (book) {
            let newLikes;
            if (isLiked) {
                // Unlike the book
                newLikes = Math.max(0, (book.likes || 0) - 1);
                AppState.likedBooks = AppState.likedBooks.filter(id => id !== bookId);
                showToast('Removed from favorites', 'success');
            } else {
                // Like the book
                newLikes = (book.likes || 0) + 1;
                AppState.likedBooks.push(bookId);
                showToast('Added to favorites!', 'success');
            }

            await fetch(`tables/books/${bookId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ likes: newLikes })
            });
            book.likes = newLikes;

            // Update UI to reflect liked state
            updateLikeButton(bookId, !isLiked);

            // Refresh current view
            const currentPage = document.querySelector('.page.active');
            if (currentPage.id === 'book-detail-page') {
                showBookDetail(bookId);
            }
        }
    } catch (error) {
        console.error('Error toggling book like:', error);
        showToast('Failed to update favorite status', 'error');
    }
}

// Update like button visual state
function updateLikeButton(bookId, isLiked) {
    const likeButton = document.querySelector(`button[onclick="toggleBookLike('${bookId}')"]`);
    if (likeButton) {
        const icon = likeButton.querySelector('i');
        if (icon) {
            if (isLiked) {
                icon.className = 'fas fa-heart liked';
                likeButton.title = 'Remove from Favorites';
            } else {
                icon.className = 'fas fa-heart';
                likeButton.title = 'Add to Favorites';
            }
        }
    }
}

// Update total books stat
function updateStatsDisplay() {
    const totalBooksElement = document.getElementById('total-books-stat');
    if (totalBooksElement && AppState.books.length > 0) {
        totalBooksElement.textContent = formatNumber(AppState.books.length) + '+';
    }
}

// ========================================
// Legal and Support Functions
// ========================================

function showPrivacyPolicy() {
    const modal = document.getElementById('privacy-modal');
    if (modal) {
        // Load privacy policy content
        const content = document.getElementById('privacy-content');
        if (content) {
            content.innerHTML = `
                <h3>Privacy Policy for MYB</h3>
                <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>

                <h4>Information We Collect</h4>
                <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>

                <h4>How We Use Your Information</h4>
                <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>

                <h4>Information Sharing</h4>
                <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>

                <h4>Data Security</h4>
                <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

                <h4>Contact Us</h4>
                <p>If you have any questions about this Privacy Policy, please contact us at privacy@myb.com.</p>
            `;
        }
        openModal('privacy-modal');
    }
}

function showTermsOfService() {
    const modal = document.getElementById('terms-modal');
    if (modal) {
        // Load terms of service content
        const content = document.getElementById('terms-content');
        if (content) {
            content.innerHTML = `
                <h3>Terms of Service for MYB</h3>
                <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>

                <h4>Acceptance of Terms</h4>
                <p>By accessing and using MYB, you accept and agree to be bound by the terms and provision of this agreement.</p>

                <h4>Use License</h4>
                <p>Permission is granted to temporarily access the materials on MYB for personal, non-commercial transitory viewing only.</p>

                <h4>User Accounts</h4>
                <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

                <h4>Content Guidelines</h4>
                <p>Users may not upload, post, or transmit any content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy.</p>

                <h4>Purchases and Payments</h4>
                <p>All purchases are final. We reserve the right to change prices and billing methods at any time with reasonable notice.</p>

                <h4>Termination</h4>
                <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion.</p>

                <h4>Contact Information</h4>
                <p>Questions about the Terms of Service should be sent to us at legal@myb.com.</p>
            `;
        }
        openModal('terms-modal');
    }
}

function showCommentsModal(bookId) {
    const book = AppState.books.find(b => b.id === bookId);
    if (!book) return;

    const modal = document.getElementById('comments-modal');
    if (!modal) {
        // Create comments modal if it doesn't exist
        const modalHTML = `
            <div id="comments-modal" class="modal">
                <div class="modal-overlay" onclick="closeModal('comments-modal')"></div>
                <div class="modal-content modal-medium">
                    <div class="modal-close" onclick="closeModal('comments-modal')">
                        <i class="fas fa-times"></i>
                    </div>
                    <div id="comments-container">
                        <h3><i class="fas fa-comments"></i> Comments for "${book.title}"</h3>
                        <div class="comments-list" id="comments-list">
                            <div class="empty-state">
                                <i class="fas fa-comment-slash"></i>
                                <h4>No comments yet</h4>
                                <p>Be the first to share your thoughts about this book!</p>
                            </div>
                        </div>
                        ${AppState.currentUser ? `
                            <div class="comment-form">
                                <h4>Add a Comment</h4>
                                <form id="add-comment-form">
                                    <textarea placeholder="Share your thoughts about this book..." required></textarea>
                                    <button type="submit" class="btn-primary">
                                        <i class="fas fa-paper-plane"></i> Post Comment
                                    </button>
                                </form>
                            </div>
                        ` : `
                            <div class="empty-state">
                                <i class="fas fa-user-lock"></i>
                                <h4>Sign in to comment</h4>
                                <button class="btn-primary" onclick="openModal('auth-modal'); closeModal('comments-modal');">
                                    <i class="fas fa-sign-in-alt"></i> Sign In
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add form submission handler
        setTimeout(() => {
            const form = document.getElementById('add-comment-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const textarea = form.querySelector('textarea');
                    const comment = textarea.value.trim();
                    if (comment) {
                        addComment(bookId, comment);
                        textarea.value = '';
                    }
                });
            }
        }, 100);
    }

    openModal('comments-modal');
}

function addComment(bookId, comment) {
    // In a real app, this would send to backend
    // For demo, just show success message
    showToast('Comment added successfully!', 'success');

    // Refresh comments (in demo, this won't add new comments since no backend)
    setTimeout(() => {
        showCommentsModal(bookId);
    }, 500);
}

// ========================================
// Global Error Handling
// ========================================

window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});
