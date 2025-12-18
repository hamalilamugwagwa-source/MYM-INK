// ========================================
// MYB - Enhanced Features Module
// Social, Admin, Payments, Comments, etc.
// ========================================

// Extended App State
AppState.isAdmin = false;
AppState.notifications = [];
AppState.messages = [];
AppState.bookOfWeek = null;
AppState.userPosts = [];
AppState.comments = {};
AppState.following = [];
AppState.followers = [];

// Admin user ID (you can change this)
const ADMIN_USER_ID = 'admin-001';

// Emojis list
const EMOJI_LIST = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '👁️', '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'];

// ========================================
// Initialize Enhanced Features
// ========================================

function initializeEnhancedFeatures() {
    // Check if user is admin
    if (AppState.currentUser && AppState.currentUser.role === 'admin') {
        AppState.isAdmin = true;
        showAdminFeatures();
    }
    
    // Initialize notifications and messages dropdowns
    if (AppState.currentUser) {
        document.getElementById('notifications-btn').style.display = 'block';
        document.getElementById('messages-btn').style.display = 'block';
        
        document.getElementById('notifications-btn').addEventListener('click', toggleNotifications);
        document.getElementById('messages-btn').addEventListener('click', toggleMessagesDropdown);
        
        loadNotifications();
        loadMessages();
    }
    
    // Initialize emoji picker
    initializeEmojiPicker();
    
    // Initialize admin form if on admin page
    const adminUploadForm = document.getElementById('admin-upload-form');
    if (adminUploadForm) {
        adminUploadForm.addEventListener('submit', handleAdminBookUpload);
    }
    
    // Initialize admin tabs
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', handleAdminTabClick);
    });
    
    // Initialize contact form
    const contactForm = document.getElementById('contact-admin-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactAdmin);
    }
    
    // Initialize post form
    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) {
        createPostForm.addEventListener('submit', handleCreatePost);
    }
    
    // Load Book of the Week
    loadBookOfWeek();
    
    // Load FAQ
    loadFAQ();
}

// ========================================
// Admin Functions
// ========================================

function showAdminFeatures() {
    // Add admin link to navigation if not present
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && !document.querySelector('[data-page="admin"]')) {
        const adminLink = document.createElement('a');
        adminLink.href = '#admin';
        adminLink.className = 'nav-link';
        adminLink.dataset.page = 'admin';
        adminLink.innerHTML = `<i class="fas fa-crown"></i><span>Admin</span>`;
        adminLink.addEventListener('click', handleNavClick);
        navMenu.appendChild(adminLink);
    }
}

async function handleAdminBookUpload(e) {
    e.preventDefault();
    
    if (!AppState.isAdmin) {
        showToast('Admin access required', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const pdfFile = formData.get('pdf_file');
    
    if (!pdfFile) {
        showToast('Please select a PDF file', 'error');
        return;
    }
    
    // In a real app, you'd upload the PDF to a server
    // For now, we'll simulate it
    showToast('Uploading book... Please wait', 'success');
    
    try {
        const bookData = {
            title: formData.get('title'),
            author: formData.get('author'),
            genre: formData.get('genre'),
            price: parseFloat(formData.get('price')),
            cover_url: formData.get('cover_url'),
            synopsis: formData.get('synopsis'),
            tags: formData.get('tags').split(',').map(t => t.trim()),
            status: formData.get('status'),
            featured: formData.has('featured'),
            rating: 0,
            reads: 0,
            likes: 0,
            chapters: 1, // For PDF, treat as single chapter
            published_date: new Date().toISOString(),
            pdf_url: URL.createObjectURL(pdfFile) // Simulated URL
        };
        
        const response = await fetch('tables/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        
        if (response.ok) {
            showToast('Book uploaded successfully!', 'success');
            e.target.reset();
            await loadBooks();
            renderHomePage();
        } else {
            showToast('Upload failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error uploading book:', error);
        showToast('Upload error. Please try again.', 'error');
    }
}

function handleAdminTabClick(e) {
    const tab = e.currentTarget.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Show corresponding content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetContent = document.getElementById(`admin-${tab}-tab`);
    if (targetContent) {
        targetContent.classList.add('active');
        
        // Load content based on tab
        switch(tab) {
            case 'manage':
                renderAdminManageBooks();
                break;
            case 'featured':
                renderAdminFeaturedBook();
                break;
            case 'users':
                renderAdminUsers();
                break;
            case 'messages':
                renderAdminMessages();
                break;
            case 'analytics':
                renderAdminAnalytics();
                break;
        }
    }
}

async function renderAdminManageBooks() {
    const container = document.getElementById('admin-manage-tab');
    const books = AppState.books;
    
    container.innerHTML = `
        <div class="admin-panel">
            <h2><i class="fas fa-tasks"></i> Manage Books</h2>
            <div class="books-table">
                ${books.map(book => `
                    <div class="book-row">
                        <img src="${book.cover_url}" alt="${book.title}" style="width: 50px; height: 75px; object-fit: cover; border-radius: 4px;">
                        <div style="flex: 1;">
                            <strong>${book.title}</strong>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">by ${book.author}</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-icon" onclick="editBook('${book.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="deleteBook('${book.id}')" title="Delete" style="color: #EF4444;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function renderAdminFeaturedBook() {
    const container = document.getElementById('admin-featured-tab');
    
    container.innerHTML = `
        <div class="admin-panel">
            <h2><i class="fas fa-star"></i> Set Book of the Week</h2>
            <form id="featured-book-form" onsubmit="handleSetFeaturedBook(event)">
                <div class="form-group">
                    <label>Select Book</label>
                    <select name="book_id" required>
                        <option value="">Choose a book...</option>
                        ${AppState.books.map(book => `
                            <option value="${book.id}">${book.title} by ${book.author}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Feature Description</label>
                    <textarea name="description" rows="3" required placeholder="Why this book is featured this week..."></textarea>
                </div>
                <button type="submit" class="btn-primary btn-large">
                    <i class="fas fa-star"></i>
                    Set as Book of the Week
                </button>
            </form>
        </div>
    `;
}

async function handleSetFeaturedBook(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const weekData = {
        book_id: formData.get('book_id'),
        week_start: new Date().toISOString(),
        week_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        featured_by: AppState.currentUser.id,
        description: formData.get('description')
    };
    
    try {
        const response = await fetch('tables/book_of_week', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(weekData)
        });
        
        if (response.ok) {
            showToast('Book of the Week set successfully!', 'success');
            e.target.reset();
            await loadBookOfWeek();
        }
    } catch (error) {
        console.error('Error setting featured book:', error);
        showToast('Error setting featured book', 'error');
    }
}

async function renderAdminUsers() {
    const container = document.getElementById('admin-users-tab');
    
    try {
        const response = await fetch('tables/users?limit=100');
        const data = await response.json();
        const users = data.data || [];
        
        container.innerHTML = `
            <div class="admin-panel">
                <h2><i class="fas fa-users"></i> Users Management</h2>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Total Users: ${users.length}</p>
                <div class="users-table">
                    ${users.map(user => `
                        <div class="user-row" style="display: flex; justify-content: space-between; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem;">
                            <div>
                                <strong>${user.username}</strong>
                                <p style="color: var(--text-secondary); font-size: 0.9rem;">${user.email}</p>
                            </div>
                            <div>
                                <span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">${user.role || 'user'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function renderAdminMessages() {
    const container = document.getElementById('admin-messages-tab');
    
    try {
        const response = await fetch('tables/messages?limit=100');
        const data = await response.json();
        const messages = (data.data || []).filter(m => m.to_user_id === ADMIN_USER_ID);
        
        container.innerHTML = `
            <div class="admin-panel">
                <h2><i class="fas fa-envelope"></i> User Messages</h2>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Unread: ${messages.filter(m => !m.is_read).length}</p>
                <div class="messages-list">
                    ${messages.length > 0 ? messages.map(msg => `
                        <div class="message-card" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <strong>${msg.subject}</strong>
                                <span style="font-size: 0.85rem; color: var(--text-tertiary);">${new Date(msg.sent_at).toLocaleDateString()}</span>
                            </div>
                            <p style="color: var(--text-secondary);">${msg.content}</p>
                            <button class="btn-primary" style="margin-top: 0.5rem;" onclick="replyToMessage('${msg.id}')">
                                <i class="fas fa-reply"></i> Reply
                            </button>
                        </div>
                    `).join('') : '<p>No messages yet</p>'}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function renderAdminAnalytics() {
    const container = document.getElementById('admin-analytics-tab');
    
    const totalBooks = AppState.books.length;
    const totalReads = AppState.books.reduce((sum, book) => sum + (book.reads || 0), 0);
    const totalLikes = AppState.books.reduce((sum, book) => sum + (book.likes || 0), 0);
    const avgRating = AppState.books.reduce((sum, book) => sum + (book.rating || 0), 0) / totalBooks;
    
    container.innerHTML = `
        <div class="admin-panel">
            <h2><i class="fas fa-chart-line"></i> Platform Analytics</h2>
            
            <div class="analytics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                <div class="analytics-card" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px;">
                    <i class="fas fa-book" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <h3 style="font-size: 2rem; margin-bottom: 0.25rem;">${totalBooks}</h3>
                    <p>Total Books</p>
                </div>
                
                <div class="analytics-card" style="background: linear-gradient(135deg, #FF6B35, #F093FB); color: white; padding: 1.5rem; border-radius: 12px;">
                    <i class="fas fa-eye" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <h3 style="font-size: 2rem; margin-bottom: 0.25rem;">${formatNumber(totalReads)}</h3>
                    <p>Total Reads</p>
                </div>
                
                <div class="analytics-card" style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5rem; border-radius: 12px;">
                    <i class="fas fa-heart" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <h3 style="font-size: 2rem; margin-bottom: 0.25rem;">${formatNumber(totalLikes)}</h3>
                    <p>Total Likes</p>
                </div>
                
                <div class="analytics-card" style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px;">
                    <i class="fas fa-star" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <h3 style="font-size: 2rem; margin-bottom: 0.25rem;">${avgRating.toFixed(1)}</h3>
                    <p>Avg Rating</p>
                </div>
            </div>
            
            <div style="margin-top: 2rem;">
                <h3 style="margin-bottom: 1rem;">Top Performing Books</h3>
                ${AppState.books
                    .sort((a, b) => (b.reads || 0) - (a.reads || 0))
                    .slice(0, 5)
                    .map((book, i) => `
                        <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 0.5rem;">
                            <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary-orange);">#${i + 1}</span>
                            <img src="${book.cover_url}" alt="${book.title}" style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;">
                            <div style="flex: 1;">
                                <strong>${book.title}</strong>
                                <p style="font-size: 0.9rem; color: var(--text-secondary);">${formatNumber(book.reads || 0)} reads</p>
                            </div>
                        </div>
                    `).join('')}
            </div>
        </div>
    `;
}

// ========================================
// Mobile Money Payment
// ========================================

function initiatePaymentEnhanced(bookId) {
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
            <div class="payment-method active" data-method="mtn" onclick="selectPaymentMethod('mtn')">
                <i class="fas fa-mobile-alt" style="color: #FFCC00;"></i>
                <div><strong>MTN Mobile Money</strong></div>
            </div>
            <div class="payment-method" data-method="airtel" onclick="selectPaymentMethod('airtel')">
                <i class="fas fa-mobile-alt" style="color: #FF0000;"></i>
                <div><strong>Airtel Money</strong></div>
            </div>
            <div class="payment-method" data-method="card" onclick="selectPaymentMethod('card')">
                <i class="fab fa-cc-stripe"></i>
                <div><strong>Credit Card</strong></div>
            </div>
        </div>
        
        <!-- MTN Form -->
        <form id="mtn-payment-form" class="payment-form active" style="margin-top: 2rem;">
            <h3 style="margin-bottom: 1rem;"><i class="fas fa-mobile-alt" style="color: #FFCC00;"></i> MTN Mobile Money</h3>
            <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="phone" placeholder="256XXXXXXXXX" pattern="[0-9]{12}" required>
                <small>Enter your MTN Mobile Money number (e.g., 256701234567)</small>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" required>
                    <span>I authorize MTN to deduct $${(book.price || 0).toFixed(2)} from my account</span>
                </label>
            </div>
            <button type="submit" class="btn-primary btn-block">
                <i class="fas fa-lock"></i>
                Pay with MTN Mobile Money
            </button>
        </form>
        
        <!-- Airtel Form -->
        <form id="airtel-payment-form" class="payment-form" style="margin-top: 2rem; display: none;">
            <h3 style="margin-bottom: 1rem;"><i class="fas fa-mobile-alt" style="color: #FF0000;"></i> Airtel Money</h3>
            <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="phone" placeholder="256XXXXXXXXX" pattern="[0-9]{12}" required>
                <small>Enter your Airtel Money number (e.g., 256751234567)</small>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" required>
                    <span>I authorize Airtel to deduct $${(book.price || 0).toFixed(2)} from my account</span>
                </label>
            </div>
            <button type="submit" class="btn-primary btn-block">
                <i class="fas fa-lock"></i>
                Pay with Airtel Money
            </button>
        </form>
        
        <!-- Card Form -->
        <form id="card-payment-form" class="payment-form" style="margin-top: 2rem; display: none;">
            <h3 style="margin-bottom: 1rem;"><i class="fab fa-cc-stripe"></i> Credit/Debit Card</h3>
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
        
        <p style="text-align: center; color: var(--text-tertiary); font-size: 0.85rem; margin-top: 1.5rem;">
            <i class="fas fa-shield-alt"></i> Secure payment • Your information is encrypted
        </p>
    `;
    
    // Attach form handlers
    document.getElementById('mtn-payment-form').addEventListener('submit', (e) => processMobilePayment(e, bookId, 'MTN'));
    document.getElementById('airtel-payment-form').addEventListener('submit', (e) => processMobilePayment(e, bookId, 'Airtel'));
    document.getElementById('card-payment-form').addEventListener('submit', (e) => processPayment(e, bookId, book.price));
    
    openModal('payment-modal');
}

function selectPaymentMethod(method) {
    // Update active payment method
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
    document.querySelector(`.payment-method[data-method="${method}"]`).classList.add('active');
    
    // Show corresponding form
    document.querySelectorAll('.payment-form').forEach(f => f.style.display = 'none');
    document.getElementById(`${method}-payment-form`).style.display = 'block';
}

async function processMobilePayment(e, bookId, provider) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const phoneNumber = formData.get('phone');
    const book = AppState.books.find(b => b.id === bookId);
    
    showToast(`Initiating ${provider} payment... Please check your phone`, 'success');
    
    try {
        // In a real app, this would call the mobile money API
        // For now, we simulate it
        const paymentData = {
            user_id: AppState.currentUser.id,
            book_id: bookId,
            amount: book.price,
            provider: provider,
            phone_number: phoneNumber,
            transaction_id: 'TXN-' + Date.now(),
            status: 'pending'
        };
        
        const response = await fetch('tables/mobile_payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        
        if (response.ok) {
            // Simulate payment approval after 3 seconds
            setTimeout(async () => {
                // Create purchase record
                await fetch('tables/purchases', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: AppState.currentUser.id,
                        book_id: bookId,
                        amount: book.price,
                        payment_method: provider,
                        purchase_date: new Date().toISOString()
                    })
                });
                
                AppState.purchasedBooks.push(bookId);
                closeModal('payment-modal');
                showToast(`Payment successful! You can now download "${book.title}"`, 'success');
                
                // Send notification
                await createNotification(
                    AppState.currentUser.id,
                    'payment',
                    `Your purchase of "${book.title}" was successful!`,
                    `#book/${bookId}`
                );
                
                // Refresh book detail page
                setTimeout(() => showBookDetail(bookId), 1000);
            }, 3000);
        } else {
            showToast('Payment failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showToast('Payment error. Please try again.', 'error');
    }
}

// ========================================
// Book of the Week
// ========================================

async function loadBookOfWeek() {
    try {
        const response = await fetch('tables/book_of_week?limit=1&sort=-created_at');
        if (response.ok) {
            const data = await response.json();
            const featured = (data.data || [])[0];

            if (featured) {
                const book = AppState.books.find(b => b.id === featured.book_id);
                if (book) {
                    AppState.bookOfWeek = { ...featured, book };
                    renderBookOfWeek();
                }
            }
        } else if (response.status === 404) {
            // API not available, use demo book of week
            console.log('Book of week API not available, using demo data');
            const demoBook = AppState.books.find(b => b.featured) || AppState.books[0];
            if (demoBook) {
                AppState.bookOfWeek = {
                    book: demoBook,
                    description: "This week's featured story - a captivating tale that will keep you turning pages!",
                    week_start: new Date().toISOString(),
                    week_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                };
                renderBookOfWeek();
            }
        }
    } catch (error) {
        console.error('Error loading book of week:', error);
        // Fallback to demo book of week
        const demoBook = AppState.books.find(b => b.featured) || AppState.books[0];
        if (demoBook) {
            AppState.bookOfWeek = {
                book: demoBook,
                description: "This week's featured story - a captivating tale that will keep you turning pages!",
                week_start: new Date().toISOString(),
                week_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };
            renderBookOfWeek();
        }
    }
}

function renderBookOfWeek() {
    const section = document.getElementById('book-of-week-section');
    const container = document.getElementById('book-of-week-card');
    
    if (!AppState.bookOfWeek) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    const { book, description } = AppState.bookOfWeek;
    
    container.innerHTML = `
        <div class="book-of-week-badge">
            <i class="fas fa-trophy"></i> BOOK OF THE WEEK
        </div>
        <div>
            <img src="${book.cover_url}" alt="${book.title}" style="width: 100%; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);">
        </div>
        <div>
            <h2 style="font-family: var(--font-display); font-size: 2rem; margin-bottom: 0.5rem; color: #1A1A1A;">${book.title}</h2>
            <p style="font-size: 1.2rem; color: #666; margin-bottom: 1rem;">by ${book.author}</p>
            <p style="line-height: 1.8; margin-bottom: 1.5rem; color: #444;">${description}</p>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button class="btn-primary btn-large" onclick="showBookDetail('${book.id}')">
                    <i class="fas fa-book-reader"></i>
                    Read Now
                </button>
                <button class="btn-outline btn-large" onclick="initiatePaymentEnhanced('${book.id}')">
                    <i class="fas fa-download"></i>
                    Download - $${(book.price || 0).toFixed(2)}
                </button>
            </div>
        </div>
    `;
}

// This file continues in the next part...
// Export functions to global scope
window.initializeEnhancedFeatures = initializeEnhancedFeatures;
window.selectPaymentMethod = selectPaymentMethod;
window.initiatePaymentEnhanced = initiatePaymentEnhanced;
window.handleAdminTabClick = handleAdminTabClick;
window.handleSetFeaturedBook = handleSetFeaturedBook;
