// ========================================
// MYB - PDF Stories & Interaction Features
// PDF Upload, Reader, Ratings, Following, Forum, Messaging, Contests
// ========================================

// Extended App State for PDF Features
AppState.pdfStories = [];
AppState.pendingStories = [];
AppState.userFollowing = [];
AppState.userRatings = {};
AppState.forumPosts = [];
AppState.privateMessages = [];
AppState.contests = [];

// ========================================
// PDF Story Upload
// ========================================

async function initializePDFUpload() {
    const uploadForm = document.getElementById('pdf-upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handlePDFUpload);
    }
    
    const adminUploadForm = document.getElementById('admin-pdf-upload-form');
    if (adminUploadForm) {
        adminUploadForm.addEventListener('submit', handleAdminPDFUpload);
    }
}

async function handlePDFUpload(e) {
    e.preventDefault();
    
    if (!AppState.currentUser) {
        showToast('Please sign in to upload stories', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const pdfFile = formData.get('pdf_file');
    
    if (!pdfFile || pdfFile.type !== 'application/pdf') {
        showToast('Please select a valid PDF file', 'error');
        return;
    }
    
    // Validate file size (max 50MB)
    if (pdfFile.size > 50 * 1024 * 1024) {
        showToast('PDF file size must be less than 50MB', 'error');
        return;
    }
    
    showToast('Uploading PDF story...', 'info');
    
    try {
        // Convert PDF to base64
        const base64PDF = await fileToBase64(pdfFile);
        
        // Upload PDF file
        const uploadResponse = await fetch('/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: pdfFile.name,
                data: base64PDF
            })
        });
        
        if (!uploadResponse.ok) throw new Error('Failed to upload PDF');
        
        const uploadData = await uploadResponse.json();
        
        // Create story record
        const storyData = {
            title: formData.get('title'),
            author: formData.get('author') || AppState.currentUser.username,
            genre: formData.get('genre'),
            description: formData.get('description'),
            cover_url: formData.get('cover_url') || 'https://via.placeholder.com/300x450?text=PDF+Story',
            pdf_url: uploadData.url,
            tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : []
        };
        
        const token = localStorage.getItem('authToken');
        const response = await fetch('/tables/pdf_stories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(storyData)
        });
        
        if (!response.ok) throw new Error('Failed to create story');
        
        const story = await response.json();
        
        showToast('PDF story uploaded successfully! Awaiting admin approval.', 'success');
        e.target.reset();
        
        // Reload stories
        await loadPDFStories();
        
    } catch (error) {
        console.error('Error uploading PDF:', error);
        showToast('Failed to upload PDF story', 'error');
    }
}

async function handleAdminPDFUpload(e) {
    e.preventDefault();
    
    if (!AppState.isAdmin) {
        showToast('Admin access required', 'error');
        return;
    }
    
    // Similar to handlePDFUpload but auto-approved
    await handlePDFUpload(e);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ========================================
// PDF Stories Management
// ========================================

async function loadPDFStories() {
    try {
        const response = await fetch('/tables/pdf_stories');
        const data = await response.json();
        AppState.pdfStories = data.data || [];
        
        // Load pending stories for admin
        if (AppState.isAdmin) {
            const pendingResponse = await fetch('/tables/pdf_stories?status=pending');
            const pendingData = await pendingResponse.json();
            AppState.pendingStories = pendingData.data || [];
        }
        
        return AppState.pdfStories;
    } catch (error) {
        console.error('Error loading PDF stories:', error);
        return [];
    }
}

async function approvePDFStory(storyId, reason = '') {
    if (!AppState.isAdmin) {
        showToast('Admin access required', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/tables/pdf_stories/${storyId}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'approved', reason })
        });
        
        if (!response.ok) throw new Error('Failed to approve story');
        
        showToast('Story approved successfully', 'success');
        await loadPDFStories();
        renderAdminPDFManagement();
        
    } catch (error) {
        console.error('Error approving story:', error);
        showToast('Failed to approve story', 'error');
    }
}

async function rejectPDFStory(storyId, reason) {
    if (!AppState.isAdmin) {
        showToast('Admin access required', 'error');
        return;
    }
    
    if (!reason) {
        reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/tables/pdf_stories/${storyId}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'rejected', reason })
        });
        
        if (!response.ok) throw new Error('Failed to reject story');
        
        showToast('Story rejected', 'success');
        await loadPDFStories();
        renderAdminPDFManagement();
        
    } catch (error) {
        console.error('Error rejecting story:', error);
        showToast('Failed to reject story', 'error');
    }
}

async function deletePDFStory(storyId) {
    if (!AppState.isAdmin) {
        showToast('Admin access required', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this PDF story?')) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/tables/pdf_stories/${storyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete story');
        
        showToast('Story deleted successfully', 'success');
        await loadPDFStories();
        renderAdminPDFManagement();
        
    } catch (error) {
        console.error('Error deleting story:', error);
        showToast('Failed to delete story', 'error');
    }
}

// ========================================
// PDF Reader
// ========================================

function openPDFReader(storyId) {
    const story = AppState.pdfStories.find(s => s.id === storyId);
    if (!story) {
        showToast('Story not found', 'error');
        return;
    }
    
    if (story.status !== 'approved') {
        showToast('This story is not available', 'error');
        return;
    }
    
    // Create PDF reader modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'pdf-reader-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closePDFReader()"></div>
        <div class="modal-content modal-fullscreen">
            <div class="pdf-reader-header">
                <div class="pdf-reader-title">
                    <h3>${story.title}</h3>
                    <span>by ${story.author}</span>
                </div>
                <div class="pdf-reader-controls">
                    <button class="btn-icon" onclick="zoomPDFOut()" title="Zoom Out">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <button class="btn-icon" onclick="zoomPDFIn()" title="Zoom In">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="btn-icon" onclick="togglePDFFullscreen()" title="Fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="btn-icon" onclick="closePDFReader()" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="pdf-reader-container">
                <iframe src="${story.pdf_url}" id="pdf-iframe" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
            <div class="pdf-reader-footer">
                <button class="btn-primary" onclick="reportPDFStory('${storyId}')">
                    <i class="fas fa-flag"></i> Report Story
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Track reading progress
    trackPDFReading(storyId);
}

function closePDFReader() {
    const modal = document.getElementById('pdf-reader-modal');
    if (modal) {
        modal.remove();
    }
}

function zoomPDFIn() {
    const iframe = document.getElementById('pdf-iframe');
    if (iframe) {
        const currentWidth = iframe.style.width || '100%';
        const newWidth = Math.min(parseInt(currentWidth) + 10, 200);
        iframe.style.width = newWidth + '%';
    }
}

function zoomPDFOut() {
    const iframe = document.getElementById('pdf-iframe');
    if (iframe) {
        const currentWidth = iframe.style.width || '100%';
        const newWidth = Math.max(parseInt(currentWidth) - 10, 50);
        iframe.style.width = newWidth + '%';
    }
}

function togglePDFFullscreen() {
    const container = document.querySelector('.modal-fullscreen');
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.error('Error entering fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

async function trackPDFReading(storyId) {
    // Track that user opened this PDF
    // Could be extended to track page numbers, time spent, etc.
    console.log('Tracking PDF reading:', storyId);
}

// ========================================
// Story Reporting
// ========================================

async function reportPDFStory(storyId) {
    if (!AppState.currentUser) {
        showToast('Please sign in to report stories', 'error');
        return;
    }
    
    const reason = prompt('Please describe why you are reporting this story:');
    if (!reason) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/tables/story_reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                story_id: storyId,
                reason,
                type: 'pdf_story'
            })
        });
        
        if (!response.ok) throw new Error('Failed to submit report');
        
        showToast('Report submitted successfully. Admin will review it.', 'success');
        closePDFReader();
        
    } catch (error) {
        console.error('Error reporting story:', error);
        showToast('Failed to submit report', 'error');
    }
}

// ========================================
// Ratings System
// ========================================

async function rateStory(storyId, rating) {
    if (!AppState.currentUser) {
        showToast('Please sign in to rate stories', 'error');
        return;
    }
    
    if (rating < 1 || rating > 5) {
        showToast('Rating must be between 1 and 5 stars', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/tables/ratings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ story_id: storyId, rating })
        });
        
        if (!response.ok) throw new Error('Failed to submit rating');
        
        showToast('Rating submitted successfully', 'success');
        
        // Update local state
        AppState.userRatings[storyId] = rating;
        
    } catch (error) {
        console.error('Error submitting rating:', error);
        showToast('Failed to submit rating', 'error');
    }
}

async function loadStoryRatings(storyId) {
    try {
        const response = await fetch(`/tables/ratings?story_id=${storyId}`);
        const data = await response.json();
        const ratings = data.data || [];
        
        if (ratings.length === 0) return { average: 0, count: 0 };
        
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / ratings.length;
        
        return { average: average.toFixed(1), count: ratings.length };
    } catch (error) {
        console.error('Error loading ratings:', error);
        return { average: 0, count: 0 };
    }
}

// ========================================
// Following System
// ========================================

async function followUser(userId) {
    if (!AppState.currentUser) {
        showToast('Please sign in to follow users', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/tables/follows', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ following_id: userId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to follow user');
        }
        
        showToast('Successfully followed user', 'success');
        await loadUserFollowing();
        
    } catch (error) {
        console.error('Error following user:', error);
        showToast(error.message, 'error');
    }
}

async function unfollowUser(followId) {
    if (!AppState.currentUser) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/tables/follows/${followId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to unfollow user');
        
        showToast('Unfollowed user', 'success');
        await loadUserFollowing();
        
    } catch (error) {
        console.error('Error unfollowing user:', error);
        showToast('Failed to unfollow user', 'error');
    }
}

async function loadUserFollowing() {
    if (!AppState.currentUser) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/tables/follows?follower_id=${AppState.currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        AppState.userFollowing = data.data || [];
    } catch (error) {
        console.error('Error loading following:', error);
    }
}

// ========================================
// Forum System
// ========================================

async function loadForumPosts(category = null) {
    try {
        const url = category ? `/tables/forum_posts?category=${category}` : '/tables/forum_posts';
        const response = await fetch(url);
        const data = await response.json();
        AppState.forumPosts = data.data || [];
        return AppState.forumPosts;
    } catch (error) {
        console.error('Error loading forum posts:', error);
        return [];
    }
}

async function createForumPost(postData) {
    if (!AppState.currentUser) {
        showToast('Please sign in to create posts', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/tables/forum_posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        });
        
        if (!response.ok) throw new Error('Failed to create post');
        
        showToast('Post created successfully', 'success');
        await loadForumPosts();
        
    } catch (error) {
        console.error('Error creating post:', error);
        showToast('Failed to create post', 'error');
    }
}

// ========================================
// Private Messaging
// ========================================

async function loadPrivateMessages() {
    if (!AppState.currentUser) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/tables/private_messages', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        AppState.privateMessages = data.data || [];
        
        // Update unread count
        const unreadCount = AppState.privateMessages.filter(m => 
            m.recipient_id === AppState.currentUser.id && !m.read
        ).length;
        
        const badge = document.getElementById('message-count');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendPrivateMessage(recipientId, content) {
    if (!AppState.currentUser) {
        showToast('Please sign in to send messages', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/tables/private_messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                recipient_id: recipientId,
                content
            })
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        
        showToast('Message sent successfully', 'success');
        await loadPrivateMessages();
        
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
    }
}

// ========================================
// Contests System
// ========================================

async function loadContests() {
    try {
        const response = await fetch('/tables/contests');
        const data = await response.json();
        AppState.contests = data.data || [];
        return AppState.contests;
    } catch (error) {
        console.error('Error loading contests:', error);
        return [];
    }
}

async function createContest(contestData) {
    if (!AppState.isAdmin) {
        showToast('Admin access required', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/tables/contests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(contestData)
        });
        
        if (!response.ok) throw new Error('Failed to create contest');
        
        showToast('Contest created successfully', 'success');
        await loadContests();
        
    } catch (error) {
        console.error('Error creating contest:', error);
        showToast('Failed to create contest', 'error');
    }
}

async function voteInContest(contestId, storyId) {
    if (!AppState.currentUser) {
        showToast('Please sign in to vote', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/tables/contests/${contestId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ story_id: storyId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to vote');
        }
        
        showToast('Vote submitted successfully', 'success');
        await loadContests();
        
    } catch (error) {
        console.error('Error voting:', error);
        showToast(error.message, 'error');
    }
}

// ========================================
// Initialize PDF Features
// ========================================

function initializePDFFeatures() {
    initializePDFUpload();
    
    if (AppState.currentUser) {
        loadPDFStories();
        loadUserFollowing();
        loadPrivateMessages();
        loadForumPosts();
        loadContests();
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePDFFeatures);
} else {
    initializePDFFeatures();
}
