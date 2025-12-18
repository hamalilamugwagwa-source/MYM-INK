// ========================================
// MYB - Admin UI Rendering
// Handles admin dashboard UI components
// ========================================

// ========================================
// Dashboard Functions
// ========================================

async function loadDashboardData() {
    try {
        // Load dashboard statistics
        await loadDashboardStats();

        // Load recent activity
        await loadRecentActivity();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadDashboardStats() {
    try {
        // Get total users count
        const usersResponse = await fetch('/tables/users?limit=1000');
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            const totalUsers = usersData.data ? usersData.data.length : 0;
            document.getElementById('total-users-count').textContent = totalUsers;
        }

        // Get total books count
        const booksResponse = await fetch('/tables/books?limit=1000');
        if (booksResponse.ok) {
            const booksData = await booksResponse.json();
            const totalBooks = booksData.data ? booksData.data.length : 0;
            document.getElementById('total-books-count').textContent = totalBooks;
        }

        // Get pending PDFs count
        const pdfsResponse = await fetch('/tables/pdf_stories?limit=1000');
        if (pdfsResponse.ok) {
            const pdfsData = await pdfsResponse.json();
            const pendingPdfs = pdfsData.data ? pdfsData.data.filter(pdf => pdf.status === 'pending').length : 0;
            document.getElementById('pending-pdf-count').textContent = pendingPdfs;
        }

        // Get reports count (placeholder for now)
        document.getElementById('reports-count').textContent = '0';

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Set default values
        document.getElementById('total-users-count').textContent = '0';
        document.getElementById('total-books-count').textContent = '0';
        document.getElementById('pending-pdf-count').textContent = '0';
        document.getElementById('reports-count').textContent = '0';
    }
}

async function loadRecentActivity() {
    const activityList = document.getElementById('recent-activity-list');

    try {
        // Get recent users
        const usersResponse = await fetch('/tables/users?limit=5&sort=joined_date&order=desc');
        let recentUsers = [];
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            recentUsers = usersData.data || [];
        }

        // Get recent books
        const booksResponse = await fetch('/tables/books?limit=5&sort=published_date&order=desc');
        let recentBooks = [];
        if (booksResponse.ok) {
            const booksData = await booksResponse.json();
            recentBooks = booksData.data || [];
        }

        // Combine and sort activities
        const activities = [
            ...recentUsers.map(user => ({
                type: 'user',
                message: `New user "${user.username}" joined`,
                timestamp: new Date(user.joined_date || Date.now()),
                icon: 'fas fa-user-plus'
            })),
            ...recentBooks.map(book => ({
                type: 'book',
                message: `New book "${book.title}" published`,
                timestamp: new Date(book.published_date || Date.now()),
                icon: 'fas fa-book'
            }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

        if (activities.length > 0) {
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <i class="${activity.icon}"></i>
                    <span>${activity.message}</span>
                    <small>${formatTimeAgo(activity.timestamp)}</small>
                </div>
            `).join('');
        } else {
            activityList.innerHTML = `
                <div class="activity-item">
                    <i class="fas fa-info-circle"></i>
                    <span>No recent activity</span>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading recent activity:', error);
        activityList.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Failed to load recent activity</span>
            </div>
        `;
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function switchAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const targetContent = document.getElementById(`admin-${tabName}-tab`);
    if (targetContent) {
        targetContent.classList.add('active');

        // Load tab-specific data
        if (tabName === 'dashboard') {
            loadDashboardData();
        }
    }
}

// Render pending PDF stories for verification
async function renderPendingPDFStories() {
    const container = document.getElementById('pending-pdf-stories-list');
    if (!container) return;
    
    await loadPDFStories();
    
    if (AppState.pendingStories.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No pending stories to review</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = AppState.pendingStories.map(story => `
        <div class="verification-card">
            <div class="verification-header">
                <div class="verification-info">
                    <h3>${story.title}</h3>
                    <div class="verification-meta">
                        <span><i class="fas fa-user"></i> ${story.uploader_name}</span>
                        <span style="margin-left: 1rem;"><i class="fas fa-tag"></i> ${story.genre}</span>
                        <span style="margin-left: 1rem;"><i class="fas fa-clock"></i> ${new Date(story.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="verification-actions">
                    <button class="btn-approve" onclick="approvePDFStory('${story.id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-reject" onclick="rejectPDFStory('${story.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn-icon" onclick="openPDFReader('${story.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">${story.description}</p>
            ${story.tags && story.tags.length > 0 ? `
                <div style="margin-top: 0.75rem;">
                    ${story.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Render all PDF stories management
async function renderAdminPDFManagement() {
    const container = document.getElementById('all-pdf-stories-list');
    if (!container) return;
    
    await loadPDFStories();
    
    const allStories = AppState.pdfStories;
    
    if (allStories.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-file-pdf" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No PDF stories uploaded yet</p>
            </div>
        `;
        return;
    }
    
    // Group by status
    const approved = allStories.filter(s => s.status === 'approved');
    const pending = allStories.filter(s => s.status === 'pending');
    const rejected = allStories.filter(s => s.status === 'rejected');
    
    container.innerHTML = `
        <div class="admin-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
            <div class="stat-card" style="background: #10B981; color: white;">
                <i class="fas fa-check-circle"></i>
                <h3>${approved.length}</h3>
                <p>Approved</p>
            </div>
            <div class="stat-card" style="background: #F39C12; color: white;">
                <i class="fas fa-clock"></i>
                <h3>${pending.length}</h3>
                <p>Pending</p>
            </div>
            <div class="stat-card" style="background: #EF4444; color: white;">
                <i class="fas fa-times-circle"></i>
                <h3>${rejected.length}</h3>
                <p>Rejected</p>
            </div>
        </div>
        
        <div class="pdf-stories-table">
            ${allStories.map(story => `
                <div class="verification-card">
                    <div class="verification-header">
                        <div class="verification-info">
                            <h3>
                                ${story.title}
                                <span class="contest-badge ${story.status === 'approved' ? 'active' : story.status === 'pending' ? '' : 'ended'}" 
                                      style="margin-left: 0.5rem; font-size: 0.75rem;">
                                    ${story.status.toUpperCase()}
                                </span>
                            </h3>
                            <div class="verification-meta">
                                <span><i class="fas fa-user"></i> ${story.uploader_name}</span>
                                <span style="margin-left: 1rem;"><i class="fas fa-tag"></i> ${story.genre}</span>
                                <span style="margin-left: 1rem;"><i class="fas fa-eye"></i> ${story.views || 0} views</span>
                                <span style="margin-left: 1rem;"><i class="fas fa-heart"></i> ${story.likes || 0} likes</span>
                            </div>
                        </div>
                        <div class="verification-actions">
                            ${story.status !== 'approved' ? `
                                <button class="btn-approve" onclick="approvePDFStory('${story.id}')">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                            ` : ''}
                            ${story.status !== 'rejected' ? `
                                <button class="btn-reject" onclick="rejectPDFStory('${story.id}')">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            ` : ''}
                            <button class="btn-icon" onclick="openPDFReader('${story.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" style="color: #EF4444;" onclick="deletePDFStory('${story.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p style="color: var(--text-secondary); margin: 0.5rem 0;">${story.description}</p>
                    ${story.review_reason ? `
                        <div style="margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                            <strong>Review Note:</strong> ${story.review_reason}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

// Render contests management
async function renderContestsManagement() {
    const container = document.getElementById('contests-list');
    if (!container) return;
    
    await loadContests();
    
    if (AppState.contests.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-trophy" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No contests created yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = AppState.contests.map(contest => {
        const voteCount = Object.keys(contest.votes || {}).length;
        const voteBreakdown = {};
        
        if (contest.votes) {
            Object.values(contest.votes).forEach(storyId => {
                voteBreakdown[storyId] = (voteBreakdown[storyId] || 0) + 1;
            });
        }
        
        return `
            <div class="contest-card">
                <div class="contest-header">
                    <div>
                        <h3 class="contest-title">${contest.title}</h3>
                        <p style="color: var(--text-secondary); margin: 0;">${contest.description}</p>
                    </div>
                    <span class="contest-badge ${contest.status}">${contest.status.toUpperCase()}</span>
                </div>
                
                <div style="margin: 1rem 0;">
                    <strong>Total Votes:</strong> ${voteCount}
                </div>
                
                ${contest.stories && contest.stories.length > 0 ? `
                    <div style="margin-top: 1rem;">
                        <strong>Participating Stories:</strong>
                        <div style="margin-top: 0.5rem;">
                            ${contest.stories.map(storyId => {
                                const votes = voteBreakdown[storyId] || 0;
                                return `
                                    <div style="padding: 0.5rem; background: var(--bg-primary); margin: 0.5rem 0; border-radius: var(--radius-sm); display: flex; justify-content: space-between;">
                                        <span>Story ID: ${storyId}</span>
                                        <span><i class="fas fa-vote-yea"></i> ${votes} votes</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem;">
                    <button class="btn-primary" onclick="editContest('${contest.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${contest.status === 'active' ? `
                        <button class="btn-outline" onclick="endContest('${contest.id}')">
                            <i class="fas fa-stop"></i> End Contest
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Render reports management
async function renderReportsManagement() {
    const container = document.getElementById('reports-list');
    if (!container) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/tables/story_reports', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const reports = data.data || [];
        
        if (reports.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-flag" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No reports to review</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = reports.map(report => `
            <div class="verification-card">
                <div class="verification-header">
                    <div class="verification-info">
                        <h3>Report for Story ID: ${report.story_id}</h3>
                        <div class="verification-meta">
                            <span><i class="fas fa-user"></i> Reported by: ${report.reporter_name}</span>
                            <span style="margin-left: 1rem;"><i class="fas fa-clock"></i> ${new Date(report.created_at).toLocaleDateString()}</span>
                            <span style="margin-left: 1rem;" class="contest-badge ${report.status === 'pending' ? '' : 'ended'}">
                                ${report.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    ${report.status === 'pending' ? `
                        <div class="verification-actions">
                            <button class="btn-approve" onclick="resolveReport('${report.id}', 'resolved')">
                                <i class="fas fa-check"></i> Resolve
                            </button>
                            <button class="btn-reject" onclick="resolveReport('${report.id}', 'dismissed')">
                                <i class="fas fa-times"></i> Dismiss
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                    <strong>Reason:</strong>
                    <p style="margin: 0.5rem 0 0 0;">${report.reason}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading reports:', error);
        container.innerHTML = '<p style="color: var(--text-secondary);">Failed to load reports</p>';
    }
}

// Helper functions for admin actions
async function resolveReport(reportId, status) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/tables/story_reports/${reportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Failed to update report');
        
        showToast(`Report ${status}`, 'success');
        renderReportsManagement();
        
    } catch (error) {
        console.error('Error updating report:', error);
        showToast('Failed to update report', 'error');
    }
}

function showCreateContestForm() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'create-contest-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeModal('create-contest-modal')"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal('create-contest-modal')">
                <i class="fas fa-times"></i>
            </button>
            <h2><i class="fas fa-trophy"></i> Create New Contest</h2>
            <form id="create-contest-form" class="admin-form">
                <div class="form-group">
                    <label>Contest Title *</label>
                    <input type="text" name="title" required>
                </div>
                <div class="form-group">
                    <label>Description *</label>
                    <textarea name="description" rows="3" required></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Date *</label>
                        <input type="date" name="start_date" required>
                    </div>
                    <div class="form-group">
                        <label>End Date *</label>
                        <input type="date" name="end_date" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Participating Story IDs (comma separated) *</label>
                    <input type="text" name="stories" required placeholder="story-id-1, story-id-2, story-id-3">
                    <small>Enter the IDs of stories participating in this contest</small>
                </div>
                <button type="submit" class="btn-primary btn-block">
                    <i class="fas fa-plus"></i> Create Contest
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('create-contest-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const contestData = {
            title: formData.get('title'),
            description: formData.get('description'),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            stories: formData.get('stories').split(',').map(s => s.trim()),
            status: 'active'
        };
        
        await createContest(contestData);
        closeModal('create-contest-modal');
        renderContestsManagement();
    });
}

async function endContest(contestId) {
    if (!confirm('Are you sure you want to end this contest?')) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/tables/contests/${contestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'ended' })
        });
        
        if (!response.ok) throw new Error('Failed to end contest');
        
        showToast('Contest ended successfully', 'success');
        renderContestsManagement();
        
    } catch (error) {
        console.error('Error ending contest:', error);
        showToast('Failed to end contest', 'error');
    }
}

function editContest(contestId) {
    showToast('Edit contest feature coming soon', 'info');
}

// Initialize admin UI when tab changes
function handleAdminTabClick(e) {
    const tab = e.target.dataset.tab;

    // Remove active class from all tabs and contents
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab
    e.target.classList.add('active');

    // Show corresponding content
    const contentId = `admin-${tab}-tab`;
    const content = document.getElementById(contentId);
    if (content) {
        content.classList.add('active');

        // Load data for specific tabs
        if (tab === 'dashboard') {
            loadDashboardData();
        } else if (tab === 'pdf-verify') {
            renderPendingPDFStories();
        } else if (tab === 'pdf-manage') {
            renderAdminPDFManagement();
        } else if (tab === 'contests') {
            renderContestsManagement();
        } else if (tab === 'reports') {
            renderReportsManagement();
        }
    }
}

// Export functions for global use
window.renderPendingPDFStories = renderPendingPDFStories;
window.renderAdminPDFManagement = renderAdminPDFManagement;
window.renderContestsManagement = renderContestsManagement;
window.renderReportsManagement = renderReportsManagement;
window.resolveReport = resolveReport;
window.showCreateContestForm = showCreateContestForm;
window.endContest = endContest;
window.editContest = editContest;
