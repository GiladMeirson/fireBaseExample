$(document).ready(function() {
    // Firebase References
    const usersRef = firebase.database().ref('users');
    const messagesRef = firebase.database().ref('messages');
    const presenceRef = firebase.database().ref('.info/connected');
    
    // State variables
    let currentUser = '';
    
    // DOM Elements
    const $loginSection = $('#login-section');
    const $chatSection = $('#chat-section');
    const $username = $('#username');
    const $loginBtn = $('#login-btn');
    const $messageText = $('#message-text');
    const $sendBtn = $('#send-btn');
    const $chatMessages = $('#chat-messages');
    const $onlineUsersList = $('#online-users-list');

    // Login functionality
    $loginBtn.click(handleLogin);
    $username.keypress(function(e) {
        if (e.which === 13) handleLogin();
    });

    function handleLogin() {
        const username = $username.val().trim();
        if (username) {
            currentUser = username;
            
            // Set user's presence in Firebase
            const userRef = usersRef.child(username);
            
            // When user connects/disconnects
            presenceRef.on('value', (snap) => {
                if (snap.val()) {
                    // User is connected
                    userRef.onDisconnect().remove(); // Remove user when disconnected
                    userRef.set(true); // Set user as online
                    
                    // Switch to chat view
                    $loginSection.addClass('hidden');
                    $chatSection.removeClass('hidden');
                    
                    // Add system message
                    addSystemMessage(`Welcome ${username}! You've joined the chat.`);
                    
                    // Focus on message input
                    $messageText.focus();
                }
            });
        }
    }

    // Listen for online users changes
    usersRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        updateOnlineUsers(Object.keys(users));
    });

    // Listen for new users joining
    usersRef.on('child_added', (snapshot) => {
        const username = snapshot.key;
        if (username !== currentUser) {
            addSystemMessage(`${username} has joined the chat.`);
        }
    });

    // Listen for users leaving
    usersRef.on('child_removed', (snapshot) => {
        const username = snapshot.key;
        addSystemMessage(`${username} has left the chat.`);
    });

    // Message sending functionality
    $sendBtn.click(sendMessage);
    $messageText.keypress(function(e) {
        if (e.which === 13) sendMessage();
    });

    function sendMessage() {
        const messageText = $messageText.val().trim();
        if (messageText) {
            const messageObj = {
                sender: currentUser,
                text: messageText,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Push message to Firebase
            messagesRef.push(messageObj);
            
            $messageText.val('').focus();
        }
    }

    // Listen for new messages
    messagesRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        addMessage(message);
    });

    function addMessage(message) {
        const $message = $('<div>')
            .addClass('message')
            .addClass(message.sender === currentUser ? 'self' : 'other');

        const $sender = $('<div>')
            .addClass('message-sender')
            .text(message.sender);

        const $text = $('<div>')
            .addClass('message-text')
            .text(message.text);

        $message.append($sender, $text);
        $chatMessages.append($message);
        
        // Scroll to bottom
        $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    }

    function addSystemMessage(text) {
        const $message = $('<div>')
            .addClass('message')
            .addClass('system')
            .css({
                'background-color': '#f0f0f0',
                'color': '#666',
                'text-align': 'center',
                'font-style': 'italic'
            });

        const $text = $('<div>')
            .addClass('message-text')
            .text(text);

        $message.append($text);
        $chatMessages.append($message);
        $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    }

    function updateOnlineUsers(users) {
        $onlineUsersList.empty();
        users.forEach(user => {
            const $userItem = $('<div>')
                .addClass('user-item')
                .text(user);
            if (user === currentUser) {
                $userItem.append(' (You)');
            }
            $onlineUsersList.append($userItem);
        });
    }
});