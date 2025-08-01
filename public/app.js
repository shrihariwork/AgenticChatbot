// Global variables
let socket;
let sessionId;
let isTyping = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Generate session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize Socket.IO
    initializeSocket();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadFeaturedProperties();
}

function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
    });
    
    socket.on('chat_response', (data) => {
        handleChatResponse(data);
    });
    
    socket.on('typing_start', () => {
        showTypingIndicator();
    });
    
    socket.on('typing_stop', () => {
        hideTypingIndicator();
    });
    
    socket.on('search_results', (data) => {
        displayPropertyResults(data);
    });
    
    socket.on('error', (data) => {
        showError(data.message);
    });
}

function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Property search form
    const propertySearchForm = document.getElementById('propertySearchForm');
    propertySearchForm.addEventListener('submit', handlePropertySearch);
    
    // Contact form
    const contactForm = document.getElementById('contactForm');
    contactForm.addEventListener('submit', handleContactForm);
    
    // Input focus effects
    messageInput.addEventListener('focus', () => {
        messageInput.parentElement.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
    });
    
    messageInput.addEventListener('blur', () => {
        messageInput.parentElement.style.boxShadow = 'none';
    });
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    messageInput.value = '';
    
    // Send message via Socket.IO
    socket.emit('chat_message', {
        message: message,
        sessionId: sessionId,
        userId: null,
        context: {}
    });
    
    // Show loading state
    showLoading(true);
}

function sendQuickMessage(message) {
    document.getElementById('messageInput').value = message;
    sendMessage();
}

function handleChatResponse(data) {
    hideLoading();
    
    // Add assistant response to chat
    addMessageToChat('assistant', data.response);
    
    // Update suggested actions
    updateSuggestedActions(data.suggestedActions);
    
    // Handle property search if mentioned
    if (data.response.toLowerCase().includes('property') || data.response.toLowerCase().includes('apartment') || data.response.toLowerCase().includes('house')) {
        // Trigger property search
        setTimeout(() => {
            searchPropertiesFromResponse(data.response);
        }, 1000);
    }
}

function addMessageToChat(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (role === 'assistant') {
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
    } else {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.innerHTML = formatMessage(content);
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = getCurrentTime();
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatMessage(content) {
    // Convert markdown-like formatting to HTML
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateSuggestedActions(actions) {
    const suggestedActions = document.getElementById('suggestedActions');
    suggestedActions.innerHTML = '';
    
    if (actions && actions.length > 0) {
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'action-btn';
            button.innerHTML = `<i class="fas fa-${getActionIcon(action.type)}"></i> ${action.label}`;
            button.onclick = () => handleSuggestedAction(action);
            suggestedActions.appendChild(button);
        });
    }
}

function getActionIcon(type) {
    const icons = {
        'property_search': 'search',
        'contact': 'phone',
        'market_info': 'chart-line',
        'property_details': 'info-circle',
        'schedule_visit': 'calendar',
        'similar_properties': 'copy'
    };
    return icons[type] || 'arrow-right';
}

function handleSuggestedAction(action) {
    switch (action.type) {
        case 'property_search':
            showPropertySearch();
            break;
        case 'contact':
            contactAgent();
            break;
        case 'market_info':
            sendQuickMessage('Tell me about current market trends in Bangalore');
            break;
        default:
            sendQuickMessage(action.label);
    }
}

function searchPropertiesFromResponse(response) {
    // Extract location and property type from response
    const locations = ['indiranagar', 'koramangala', 'whitefield', 'electronic city', 'sarjapur'];
    const propertyTypes = ['apartment', 'villa', 'house', 'commercial', 'office'];
    
    let searchQuery = '';
    let location = '';
    let propertyType = '';
    
    // Extract location
    for (const loc of locations) {
        if (response.toLowerCase().includes(loc)) {
            location = loc;
            break;
        }
    }
    
    // Extract property type
    for (const type of propertyTypes) {
        if (response.toLowerCase().includes(type)) {
            propertyType = type;
            break;
        }
    }
    
    if (location || propertyType) {
        searchQuery = `${propertyType} ${location}`.trim();
        performPropertySearch(searchQuery);
    }
}

function performPropertySearch(query) {
    socket.emit('property_search', {
        query: query,
        filters: {}
    });
}

function displayPropertyResults(data) {
    const propertyShowcase = document.getElementById('propertyShowcase');
    const propertyGrid = document.getElementById('propertyGrid');
    
    if (data.properties && data.properties.length > 0) {
        propertyGrid.innerHTML = '';
        
        data.properties.forEach(property => {
            const propertyCard = createPropertyCard(property);
            propertyGrid.appendChild(propertyCard);
        });
        
        propertyShowcase.style.display = 'block';
        propertyShowcase.scrollIntoView({ behavior: 'smooth' });
    }
}

function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    card.innerHTML = `
        <div class="property-image">
            <i class="fas fa-building"></i>
        </div>
        <div class="property-content">
            <div class="property-title">${property.title}</div>
            <div class="property-location">
                <i class="fas fa-map-marker-alt"></i>
                ${property.location.area}, ${property.location.city}
            </div>
            <div class="property-price">₹${formatPrice(property.price.amount)}</div>
            <div class="property-features">
                ${property.specifications.bedrooms ? `<span class="property-feature"><i class="fas fa-bed"></i> ${property.specifications.bedrooms} Beds</span>` : ''}
                ${property.specifications.bathrooms ? `<span class="property-feature"><i class="fas fa-bath"></i> ${property.specifications.bathrooms} Baths</span>` : ''}
                ${property.specifications.area.builtUp ? `<span class="property-feature"><i class="fas fa-ruler-combined"></i> ${property.specifications.area.builtUp} sqft</span>` : ''}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        showPropertyDetails(property);
    });
    
    return card;
}

function formatPrice(price) {
    if (price >= 10000000) {
        return (price / 10000000).toFixed(1) + ' Cr';
    } else if (price >= 100000) {
        return (price / 100000).toFixed(1) + ' Lakh';
    } else {
        return price.toLocaleString();
    }
}

function showPropertyDetails(property) {
    // Create modal for property details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${property.title}</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="property-details">
                    <div class="detail-item">
                        <strong>Location:</strong> ${property.location.address}
                    </div>
                    <div class="detail-item">
                        <strong>Price:</strong> ₹${formatPrice(property.price.amount)}
                    </div>
                    <div class="detail-item">
                        <strong>Type:</strong> ${property.type}
                    </div>
                    <div class="detail-item">
                        <strong>Description:</strong> ${property.description}
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="contactAgent()">
                        <i class="fas fa-phone"></i>
                        Contact Agent
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function loadFeaturedProperties() {
    fetch('/api/properties/featured/list')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.length > 0) {
                displayPropertyResults({ properties: data.data });
            }
        })
        .catch(error => {
            console.error('Error loading featured properties:', error);
        });
}

function handlePropertySearch(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const filters = {
        type: formData.get('propertyType'),
        location: formData.get('location'),
        minPrice: formData.get('minPrice'),
        maxPrice: formData.get('maxPrice'),
        bedrooms: formData.get('bedrooms')
    };
    
    // Remove empty values
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    socket.emit('property_search', {
        query: '',
        filters: filters
    });
    
    closeModal('propertySearchModal');
}

function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        name: formData.get('contactName'),
        email: formData.get('contactEmail'),
        phone: formData.get('contactPhone'),
        message: formData.get('contactMessage')
    };
    
    // Simulate form submission
    showLoading(true);
    
    setTimeout(() => {
        hideLoading();
        showSuccess('Thank you! We will contact you soon.');
        closeModal('contactModal');
        e.target.reset();
    }, 2000);
}

// Modal functions
function showPropertySearch() {
    document.getElementById('propertySearchModal').style.display = 'block';
}

function contactAgent() {
    document.getElementById('contactModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Utility functions
function showLoading(show = true) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = show ? 'block' : 'none';
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="message-text">
                <span class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.chat-status span:last-child');
    
    if (connected) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'Online';
    } else {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Offline';
    }
}

function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease;
    }
    
    .notification.success {
        background: #10b981;
    }
    
    .notification.error {
        background: #ef4444;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .typing-dots {
        display: inline-flex;
        gap: 4px;
    }
    
    .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #cbd5e1;
        animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typing {
        0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .status-dot.offline {
        background: #ef4444;
    }
    
    .property-details {
        margin-bottom: 2rem;
    }
    
    .detail-item {
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 8px;
    }
    
    .detail-item strong {
        color: #2d3748;
        display: inline-block;
        width: 100px;
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet); 