// BlueSky API endpoints
const API_URL = 'https://bsky.social/xrpc';

// Store credentials in localStorage
let session = JSON.parse(localStorage.getItem('bsky_session')) || null;

// DOM Elements
const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const searchSection = document.getElementById('search-section');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const loading = document.getElementById('loading');
const postResult = document.getElementById('post-result');
const postContent = document.getElementById('post-content');
const postLink = document.getElementById('post-link');
const errorMessage = document.getElementById('error-message');

// Check if user is already logged in
if (session) {
    showSearchSection();
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/com.atproto.server.createSession`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed. Please check your credentials.');
        }

        session = await response.json();
        localStorage.setItem('bsky_session', JSON.stringify(session));
        showSearchSection();
    } catch (error) {
        showError(error.message);
    }
});

// Handle search button click
searchBtn.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    showLoading();
    try {
        const posts = await searchPosts(query);
        if (posts.length === 0) {
            throw new Error('No posts found with that keyword/hashtag.');
        }

        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        displayPost(randomPost);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// Search posts using BlueSky API
async function searchPosts(query) {
    if (!session) throw new Error('Not logged in');

    const response = await fetch(`${API_URL}/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=50`, {
        headers: {
            'Authorization': `Bearer ${session.accessJwt}`,
        },
        method: 'GET'
    });

    if (!response.ok) {
        throw new Error('Failed to search posts');
    }

    const data = await response.json();
    const postsWithImages = (data.posts || []).filter(post => {
        return post.embed?.images?.length > 0;
    });

    if (postsWithImages.length === 0) {
        throw new Error('No posts with images found with that keyword/hashtag.');
    }

    return postsWithImages;
}

function displayPost(post) {
    postContent.textContent = post.text;
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    post.embed.images.forEach(image => {
        const img = document.createElement('img');
        img.src = image.fullsize;
        img.alt = image.alt;
        img.className = 'post-image';
        imageContainer.appendChild(img);
    });

    postContent.textContent = '';
    if (post.text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'post-text';
        textDiv.textContent = post.text;
        postContent.appendChild(textDiv);
    }
    postContent.appendChild(imageContainer);

    postLink.href = `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`;
    postResult.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

// UI Helper functions
function showSearchSection() {
    loginSection.classList.add('hidden');
    searchSection.classList.remove('hidden');
}

function showLoading() {
    loading.classList.remove('hidden');
    postResult.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    postResult.classList.add('hidden');
}