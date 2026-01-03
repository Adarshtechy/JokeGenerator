// DOM Elements
const jokeArea = document.querySelector("#joke-area");
const jokeButton = document.querySelector("#joke-button");
const categorySelect = document.querySelector("#category-select");
const copyButton = document.querySelector("#copy-button");
const tweetButton = document.querySelector("#tweet-button");
const favButton = document.querySelector("#fav-button");
const historyButton = document.querySelector("#history-button");
const clearHistoryButton = document.querySelector("#clear-history");
const jokeCount = document.querySelector("#joke-count");
const categoryDisplay = document.querySelector("#category");
const typeDisplay = document.querySelector("#type");
const ratingDisplay = document.querySelector("#rating");
const historyPanel = document.querySelector("#history-panel");
const historyList = document.querySelector("#history-list");
const notification = document.querySelector("#notification");

// State
let jokesHistory = JSON.parse(localStorage.getItem('jokesHistory')) || [];
let jokeCountValue = parseInt(localStorage.getItem('jokeCount')) || 0;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Initialize
updateJokeCount();
renderHistory();

// Base URL
const baseUrl = "https://v2.jokeapi.dev/joke/";

// Event Listeners
jokeButton.addEventListener("click", generateJoke);
categorySelect.addEventListener("change", generateJoke);
copyButton.addEventListener("click", copyJoke);
tweetButton.addEventListener("click", tweetJoke);
favButton.addEventListener("click", toggleFavorite);
historyButton.addEventListener("click", toggleHistoryPanel);
clearHistoryButton.addEventListener("click", clearHistory);

// Generate Joke
async function generateJoke() {
    // Show loading state
    jokeArea.classList.add("loading");
    jokeButton.disabled = true;
    jokeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span class="btn-text">Loading...</span>';
    
    try {
        const category = categorySelect.value;
        const url = `${baseUrl}${category}?blacklistFlags=nsfw,religious,racist,sexist,explicit&type=twopart,single`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch joke');
        }
        
        const data = await response.json();
        
        // Display joke
        let jokeText = "";
        if (data.type === "twopart") {
            jokeText = `${data.setup} <br><br> <strong>${data.delivery}</strong>`;
            typeDisplay.textContent = "Two-part";
        } else {
            jokeText = data.joke;
            typeDisplay.textContent = "Single";
        }
        
        jokeArea.innerHTML = jokeText;
        categoryDisplay.textContent = data.category || category;
        ratingDisplay.textContent = data.flags?.explicit ? "Explicit" : "Safe";
        
        // Update history
        addToHistory({
            id: Date.now(),
            text: jokeText.replace(/<br>/g, '\n').replace(/<[^>]*>/g, ''),
            category: data.category || category,
            type: data.type,
            date: new Date().toLocaleDateString()
        });
        
        // Update counter
        updateJokeCount();
        
        // Show notification
        showNotification("New joke loaded!", "success");
        
    } catch (error) {
        console.error("Error fetching joke:", error);
        jokeArea.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Oops! Failed to fetch a joke. Please try again.</p>
            </div>
        `;
        showNotification("Failed to fetch joke. Please try again.", "error");
    } finally {
        // Remove loading state
        jokeArea.classList.remove("loading");
        jokeButton.disabled = false;
        jokeButton.innerHTML = '<i class="fas fa-magic"></i><span class="btn-text">Generate Joke</span>';
    }
}

// Add joke to history
function addToHistory(joke) {
    jokesHistory.unshift(joke);
    if (jokesHistory.length > 10) {
        jokesHistory = jokesHistory.slice(0, 10);
    }
    localStorage.setItem('jokesHistory', JSON.stringify(jokesHistory));
    renderHistory();
    jokeCountValue++;
    localStorage.setItem('jokeCount', jokeCountValue.toString());
}

// Render history list
function renderHistory() {
    historyList.innerHTML = "";
    jokesHistory.forEach(joke => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${joke.category}</strong> - 
            ${joke.text.substring(0, 50)}...
            <br>
            <small>${joke.date} • ${joke.type}</small>
        `;
        li.addEventListener("click", () => {
            jokeArea.innerHTML = joke.text.replace(/\n/g, '<br>');
            categoryDisplay.textContent = joke.category;
            typeDisplay.textContent = joke.type;
            showNotification("Previous joke loaded!", "info");
        });
        historyList.appendChild(li);
    });
}

// Toggle favorite
function toggleFavorite() {
    const currentJoke = jokeArea.textContent;
    if (!currentJoke || currentJoke.includes("Click the button")) return;
    
    const jokeId = hashString(currentJoke);
    const isFavorited = favorites.includes(jokeId);
    
    if (isFavorited) {
        favorites = favorites.filter(id => id !== jokeId);
        favButton.classList.remove("favorite");
        showNotification("Removed from favorites", "info");
    } else {
        favorites.push(jokeId);
        favButton.classList.add("favorite");
        showNotification("Added to favorites!", "success");
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Hash string for ID
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString();
}

// Copy joke to clipboard
async function copyJoke() {
    const jokeText = jokeArea.textContent;
    if (!jokeText || jokeText.includes("Click the button")) return;
    
    try {
        await navigator.clipboard.writeText(jokeText);
        showNotification("Joke copied to clipboard!", "success");
    } catch (error) {
        showNotification("Failed to copy joke", "error");
    }
}

// Tweet joke
function tweetJoke() {
    const jokeText = jokeArea.textContent;
    if (!jokeText || jokeText.includes("Click the button")) return;
    
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(jokeText + " #Jokes #Funny")}`;
    window.open(tweetUrl, "_blank");
}

// Toggle history panel
function toggleHistoryPanel() {
    historyPanel.classList.toggle("hidden");
}

// Clear history
function clearHistory() {
    if (confirm("Are you sure you want to clear all history?")) {
        jokesHistory = [];
        localStorage.removeItem('jokesHistory');
        renderHistory();
        showNotification("History cleared!", "info");
    }
}

// Update joke counter
function updateJokeCount() {
    jokeCount.textContent = jokeCountValue;
}

// Show notification
function showNotification(message, type = "info") {
    notification.textContent = message;
    notification.className = "notification";
    
    switch(type) {
        case "success":
            notification.style.background = "var(--primary)";
            break;
        case "error":
            notification.style.background = "var(--danger)";
            break;
        case "info":
            notification.style.background = "var(--gray)";
            break;
    }
    
    notification.classList.add("show");
    
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

// Auto-generate first joke on load
window.addEventListener('load', () => {
    setTimeout(generateJoke, 500);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        generateJoke();
    }
    if (e.ctrlKey && e.code === 'KeyC') {
        e.preventDefault();
        copyJoke();
    }
});