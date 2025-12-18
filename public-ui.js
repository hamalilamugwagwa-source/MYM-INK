// ========================================
// MYB - Public UI Rendering
// Handles public-facing UI for PDF stories, forum, contests
// ========================================

// Render PDF Stories Library
async function renderPDFStoriesLibrary() {
    const container = document.getElementById('pdf-stories-grid');
    if (!container) return;
    
    await loadPDFStories();
    
    // Filter only approved stories
    const approvedStories = AppState.pdfStories.filter(s => s.status === 'approved');
    
    if (approvedStories.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-file-pdf" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No PDF stories available yet</p>
                ${AppState.currentUser ? `
                    <button class="btn-primary" onclick="navigateTo('upload-story')" style="margin-top: 1rem;">
                        <i class="fas fa-upload"></i> Upload Your Story
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    container.innerHTML = approvedStories.map(story => `
        <div class="book-card pdf-story-card">
            <div class="pdf-story-badge">
                <i class="fas fa-file-pdf"></i> PDF
            </div>
            <img src="${story.cover_url}" alt="${story.title}" class="book-cover">
            <div class="book-info">
                <h3 class="book-title">${story.title}</h3>
                <p class="book-author">by ${story.author}</p>
                <div class="rating-stars" id="rating-${story.id}">
                    <!-- Ratings will be loaded dynamically -->
                </div>
                <div class="book-meta">
                    <span><i class="fas fa-eye"></i> ${story.views || 0}</span>
                    <span><i class="fas fa-heart"></i> ${story.likes || 0}</span>
                </div>
                <div class="book-tags">
                    <span class="tag">${story.genre}</span>
                </div>
                <button class="btn-primary btn-block" onclick="openPDFReader('${story.id}')">
                    <i class="fas fa-book-reader"></i> Read PDF
                </button>
            </div>
        </div>
    `).join('');
    
    // Load ratings for each story
    approvedStories.forEach(async (story) => {
        const ratings = await loadStoryRatings(story.id);
        const ratingContainer = document.getElementById(`rating-${story.id}`);
        if (ratingContainer) {
            const fullStars = Math.floor(ratings.average);
            const hasHalfStar = ratings.average % 1 >= 0.5;
            
            let starsHTML = '';
            for (let i = 0; i < 5; i++) {
                if (i < fullStars) {
                    starsHTML += '<i class="fas fa-star"></i>';
                } else if (i === fullStars && hasHalfStar) {
                    starsHTML += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    starsHTML += '<i class="far fa-star"></i>';
                }
            }
            
            ratingContainer.innerHTML = `
                ${starsHTML}
                <span style="margin-left: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">
                    ${ratings.average} (${ratings.count})
                </span>
            `;
        }
    });
}

// Render Forum Threads
async function renderForumThreads(category = null) {
    const container = document.getElementById('forum-threads-list');
    if (!container) return;
    
    const posts = await loadForumPosts(category);
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No threads in this category yet</p>
                ${AppState.currentUser ? `
                    <button class="btn-primary" onclick="showCreateThreadForm()" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Start a Discussion
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="forum-thread">
            <div class="forum-thread-header">
                <div>
                    <h3 class="forum-thread-title">${post.title}</h3>
                    <div class="forum-thread-meta">
                        <span><i class="fas fa-user"></i> ${post.author_name}</span>
                        <span><i class="fas fa-clock"></i> ${getTimeAgo(new Date(post.created_at))}</span>
                        <span><i class="fas fa-tag"></i> ${post.category || 'General'}</span>
                        ${post.pinned ? '<span class="contest-badge active"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="forum-thread-content">
                ${post.content}
            </div>
            <div class="forum-thread-footer">
                <span class="forum-action" onclick="likeForumPost('${post.id}')">
                    <i class="far fa-heart"></i> ${post.likes || 0}
                </span>
                <span class="forum-action">
                    <i class="fas fa-comment"></i> ${post.replies || 0} replies
                </span>
                ${AppState.currentUser ? `
                    <span class="forum-action" onclick="replyToThread('${post.id}')">
                        <i class="fas fa-reply"></i> Reply
                    </span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function showCreateThreadForm() {
    if (!AppState.currentUser) {
        showToast('Please sign in to create threads', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'create-thread-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeModal('create-thread-modal')"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal('create-thread-modal')">
                <i class="fas fa-times"></i>
            </button>
            <h2><i class="fas fa-plus"></i> Create New Thread</h2>
            <form id="create-thread-form" class="admin-form">
                <div class="form-group">
                    <label>Thread Title *</label>
                    <input type="text" name="title" required>
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select name="category" required>
                        <option value="general">General Discussion</option>
                        <option value="writing">Writing Tips</option>
                        <option value="romance">Romance</option>
                        <option value="fantasy">Fantasy</option>
                        <option value="scifi">Sci-Fi</option>
                        <option value="feedback">Feedback</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Content *</label>
                    <textarea name="content" rows="6" required></textarea>
                </div>
                <button type="submit" class="btn-primary btn-block">
                    <i class="fas fa-paper-plane"></i> Post Thread
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('create-thread-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const postData = {
            title: formData.get('title'),
            category: formData.get('category'),
            content: formData.get('content')
        };
        
        await createForumPost(postData);
        closeModal('create-thread-modal');
        renderForumThreads();
    });
}

async function likeForumPost(postId) {
    if (!AppState.currentUser) {
        showToast('Please sign in to like posts', 'error');
        return;
    }
    
    // TODO: Implement like functionality
    showToast('Like functionality coming soon', 'info');
}

function replyToThread(postId) {
    if (!AppState.currentUser) {
        showToast('Please sign in to reply', 'error');
        return;
    }
    
    showToast('Reply functionality coming soon', 'info');
}

// Render Active Contests
async function renderActiveContests() {
    const container = document.getElementById('active-contests-list');
    if (!container) return;
    
    await loadContests();
    
    const activeContests = AppState.contests.filter(c => c.status === 'active');
    
    if (activeContests.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-trophy" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No active contests at the moment</p>
                <p style="margin-top: 0.5rem;">Check back soon for new contests!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activeContests.map(contest => {
        const voteCount = Object.keys(contest.votes || {}).length;
        const userVoted = AppState.currentUser && contest.votes && contest.votes[AppState.currentUser.id];
        
        return `
            <div class="contest-card">
                <div class="contest-header">
                    <div>
                        <h3 class="contest-title">${contest.title}</h3>
                        <p class="contest-description">${contest.description}</p>
                    </div>
                    <span class="contest-badge active">ACTIVE</span>
                </div>
                
                <div style="display: flex; gap: 2rem; margin: 1rem 0; color: var(--text-secondary);">
                    <span><i class="fas fa-calendar"></i> Ends: ${new Date(contest.end_date).toLocaleDateString()}</span>
                    <span><i class="fas fa-vote-yea"></i> ${voteCount} votes</span>
                </div>
                
                ${userVoted ? `
                    <div style="padding: 1rem; background: var(--accent-pink); border-radius: var(--radius-md); margin: 1rem 0;">
                        <i class="fas fa-check-circle"></i> You have voted in this contest
                    </div>
                ` : ''}
                
                ${contest.stories && contest.stories.length > 0 ? `
                    <div class="contest-stories">
                        ${contest.stories.map(storyId => {
                            const story = AppState.pdfStories.find(s => s.id === storyId);
                            const voteBreakdown = {};
                            if (contest.votes) {
                                Object.values(contest.votes).forEach(sid => {
                                    voteBreakdown[sid] = (voteBreakdown[sid] || 0) + 1;
                                });
                            }
                            const votes = voteBreakdown[storyId] || 0;
                            const isVoted = userVoted === storyId;
                            
                            return `
                                <div class="contest-story-card ${isVoted ? 'voted' : ''}" 
                                     onclick="${AppState.currentUser && !userVoted ? `voteInContest('${contest.id}', '${storyId}')` : ''}">
                                    <h4>${story ? story.title : 'Story ' + storyId}</h4>
                                    <p style="font-size: 0.85rem; color: var(--text-secondary);">
                                        ${story ? story.author : 'Unknown Author'}
                                    </p>
                                    <div class="contest-votes">
                                        <i class="fas fa-vote-yea"></i> ${votes} votes
                                    </div>
                                    ${!userVoted && AppState.currentUser ? `
                                        <button class="btn-primary btn-block" style="margin-top: 0.5rem;">
                                            Vote
                                        </button>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : '<p style="color: var(--text-secondary);">No stories in this contest yet</p>'}
                
                ${!AppState.currentUser ? `
                    <div style="text-align: center; margin-top: 1.5rem;">
                        <button class="btn-primary" onclick="openModal('auth-modal')">
                            <i class="fas fa-sign-in-alt"></i> Sign In to Vote
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Initialize forum category buttons
function initializeForumCategories() {
    const categoryButtons = document.querySelectorAll('.forum-category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.dataset.category;
            renderForumThreads(category || null);
        });
    });
}

// Helper function for time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
}

// Initialize public UI
function initializePublicUI() {
    // Initialize forum if on forum page
    if (window.location.hash.includes('forum')) {
        initializeForumCategories();
        renderForumThreads();
    }
    
    // Initialize contests if on contests page
    if (window.location.hash.includes('contests')) {
        renderActiveContests();
    }
    
    // Initialize PDF library if on pdf-library page
    if (window.location.hash.includes('pdf-library')) {
        renderPDFStoriesLibrary();
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePublicUI);
} else {
    initializePublicUI();
}

// Export functions for global use
window.renderPDFStoriesLibrary = renderPDFStoriesLibrary;
window.renderForumThreads = renderForumThreads;
window.renderActiveContests = renderActiveContests;
window.showCreateThreadForm = showCreateThreadForm;
window.likeForumPost = likeForumPost;
window.replyToThread = replyToThread;
window.getTimeAgo = getTimeAgo;
