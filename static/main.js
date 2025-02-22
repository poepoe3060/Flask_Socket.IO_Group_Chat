const socket = io();
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const currentUsernameSpan = document.getElementById("current-username");
const usernameInput = document.getElementById("username-input");
const updateUsernameButton = document.getElementById("update-username-button");

let currentUsername = "";

document.addEventListener("DOMContentLoaded", () => {
    const savedMessages = JSON.parse(localStorage.getItem("chatMessages")) || [];
    savedMessages.forEach((msg) => {
        addMessage(msg.message, msg.type, msg.username, msg.avatar);
    });
});

socket.on("set_username", (data) => {
    currentUsername = data.username;
    currentUsernameSpan.textContent = `Your username: ${currentUsername}`;
});

socket.on("user_joined", (data) => {
    addMessage(`${data.username} joined the chat`, "system");
});

socket.on("user_left", (data) => {
    addMessage(`${data.username} left the chat`, "system");
});

socket.on("new_message", (data) => {
    addMessage(data.message, "user", data.username, data.avatar);
    saveMessageToLocalStorage(data.message, "user", data.username, data.avatar);
});

socket.on("username_updated", (data) => {
    addMessage(`${data.old_username} changed their name to ${data.new_username}`, "system");
    if (data.old_username === currentUsername) {
        currentUsername = data.new_username;
        currentUsernameSpan.textContent = `Your username: ${currentUsername}`;
    }
});

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

updateUsernameButton.addEventListener("click", updateUsername);

/**
 * Sends a message to the server.
 * - Retrieves the message from the input field.
 * - Emits the message to the server using the "send_message" event.
 * - Clears the input field after sending the message.
 */
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit("send_message", { message });
        messageInput.value = "";
    }
}

/**
 * Updates the username.
 * - Retrieves the new username from the input field.
 * - Emits the new username to the server using the "update_username" event.
 * - Clears the input field after updating the username.
 */
function updateUsername() {
    const newUsername = usernameInput.value.trim();
    if (newUsername && newUsername !== currentUsername) {
        socket.emit("update_username", { username: newUsername });
        usernameInput.value = "";
    }
}

/**
 * Saves a message to local storage.
 * - Retrieves the existing messages from local storage.
 * - Adds the new message to the list of saved messages.
 * - Stores the updated list of messages back to local storage.
 * 
 * @param {string} message - The message content.
 * @param {string} type - The type of message (e.g., "user", "system").
 * @param {string} username - The username of the message sender.
 * @param {string} avatar - The avatar URL of the message sender.
 */
function saveMessageToLocalStorage(message, type, username, avatar) {
    const savedMessages = JSON.parse(localStorage.getItem("chatMessages")) || [];
    savedMessages.push({ message, type, username, avatar });
    localStorage.setItem("chatMessages", JSON.stringify(savedMessages));
}

/**
 * Adds a message to the chat UI.
 * - Creates a new message element.
 * - Sets the appropriate classes and content based on the message type and sender.
 * - Appends the message element to the chat messages container.
 * 
 * @param {string} message - The message content.
 * @param {string} type - The type of message (e.g., "user", "system").
 * @param {string} username - The username of the message sender.
 * @param {string} avatar - The avatar URL of the message sender.
 */
function addMessage(message, type, username = "", avatar = "") {
    const messageElement = document.createElement("div");
    messageElement.className = "message";

    if (type === "user") {
        const isSentMessage = username === currentUsername;
        if (isSentMessage) {
            messageElement.classList.add("sent");
        }

        const avatarImg = document.createElement("img");
        avatarImg.src = avatar;
        messageElement.appendChild(avatarImg);

        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";

        const usernameDiv = document.createElement("div");
        usernameDiv.className = "message-username";
        usernameDiv.textContent = username;
        contentDiv.appendChild(usernameDiv);

        const messageText = document.createElement("div");
        messageText.textContent = message;
        contentDiv.appendChild(messageText);

        messageElement.appendChild(contentDiv);
    } else {
        messageElement.className = "system-message";
        messageElement.textContent = message;
    }
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}