// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDgGeILDIC11-Q6RC1pARLAAwIq59BlJqc",
    authDomain: "rock-paper-scissors-game-b7511.firebaseapp.com",
    projectId: "rock-paper-scissors-game-b7511",
    storageBucket: "rock-paper-scissors-game-b7511.firebasestorage.app",
    messagingSenderId: "21157019299",
    appId: "1:21157019299:web:f1725775e235a3cc5b0916",
    databaseURL: "https://rock-paper-scissors-game-b7511-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

const database = firebase.database();

// Game state
const gameState = {
    currentPlayer: 1,
    playerNames: {
        player1: '',
        player2: ''
    },
    choices: {
        player1: null,
        player2: null
    },
    scores: {
        player1: 0,
        player2: 0
    },
    gameCode: null,
    isHost: false
};

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const waitingScreen = document.getElementById('waiting-screen');
const gameArea = document.getElementById('game-area');
const player1NameInput = document.getElementById('player1-name');
const createGameBtn = document.getElementById('create-game');
const joinGameBtn = document.getElementById('join-game');
const gameCodeInput = document.getElementById('game-code');
const gameCodeDisplay = document.getElementById('game-code-display');
const player1Display = document.getElementById('player1-display');
const player2Display = document.getElementById('player2-display');
const player1Score = document.getElementById('player1-score');
const player2Score = document.getElementById('player2-score');
const player1Choice = document.getElementById('player1-choice');
const player2Choice = document.getElementById('player2-choice');
const gameResult = document.getElementById('game-result');
const resetBtn = document.getElementById('reset-btn');
const choices = document.querySelectorAll('.choice');

// Event Listeners
createGameBtn.addEventListener('click', createGame);
joinGameBtn.addEventListener('click', joinGame);
resetBtn.addEventListener('click', resetGame);
choices.forEach(choice => {
    choice.addEventListener('click', () => makeChoice(choice.textContent));
});

// Create a new game
function createGame() {
    const player1Name = player1NameInput.value.trim();

    if (!player1Name) {
        alert('Please enter your name');
        return;
    }

    // Generate a random game code
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Set up the game in Firebase
    const gameRef = database.ref(`games/${gameCode}`);
    gameRef.set({
        player1: {
            name: player1Name,
            choice: null,
            score: 0
        },
        player2: {
            name: null,
            choice: null,
            score: 0
        },
        currentPlayer: 1,
        status: 'waiting'
    });

    // Update local game state
    gameState.playerNames.player1 = player1Name;
    gameState.gameCode = gameCode;
    gameState.isHost = true;

    // Show waiting screen
    setupScreen.classList.add('hidden');
    waitingScreen.classList.remove('hidden');
    gameArea.classList.add('hidden');
    gameCodeDisplay.textContent = gameCode;

    // Listen for player 2 joining
    gameRef.on('value', (snapshot) => {
        const game = snapshot.val();
        if (game && game.player2.name) {
            // Hide waiting screen and show game area
            waitingScreen.classList.add('hidden');
            gameArea.classList.remove('hidden');
            
            // Update UI
            player1Display.textContent = game.player1.name;
            player2Display.textContent = game.player2.name;
            updateScores(0, 0);
            
            // Start listening for game updates
            updateGameState(game);
        }
    });
}

// Join an existing game
function joinGame() {
    console.log('Join game function called');
    const gameCode = gameCodeInput.value.trim().toUpperCase();
    const player2Name = player1NameInput.value.trim();

    console.log('Game code:', gameCode);
    console.log('Player name:', player2Name);

    if (!gameCode || !player2Name) {
        alert('Please enter a game code and your name');
        return;
    }

    // Check if game exists
    const gameRef = database.ref(`games/${gameCode}`);
    console.log('Checking game existence...');
    
    gameRef.once('value', (snapshot) => {
        console.log('Game data received:', snapshot.val());
        const game = snapshot.val();
        if (!game) {
            alert('Game not found');
            return;
        }

        if (game.status === 'playing') {
            alert('Game already in progress');
            return;
        }

        console.log('Updating game with player 2...');
        // Update game with player 2
        gameRef.update({
            'player2.name': player2Name,
            status: 'playing'
        }).then(() => {
            console.log('Game updated successfully');
            // Update local game state
            gameState.playerNames.player1 = game.player1.name;
            gameState.playerNames.player2 = player2Name;
            gameState.gameCode = gameCode;
            gameState.isHost = false;

            // Hide setup screen and show game area
            setupScreen.classList.add('hidden');
            waitingScreen.classList.add('hidden');
            gameArea.classList.remove('hidden');

            // Update UI
            player1Display.textContent = game.player1.name;
            player2Display.textContent = player2Name;
            updateScores(0, 0);

            // Listen for game updates
            gameRef.on('value', (snapshot) => {
                const game = snapshot.val();
                if (game) {
                    updateGameState(game);
                }
            });
        }).catch((error) => {
            console.error('Error updating game:', error);
            alert('Error joining game. Please try again.');
        });
    }).catch((error) => {
        console.error('Error checking game:', error);
        alert('Error checking game. Please try again.');
    });
}

// Make a choice
function makeChoice(choice) {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    const playerKey = gameState.isHost ? 'player1' : 'player2';
    
    gameRef.update({
        [`${playerKey}.choice`]: choice
    });
}

// Update game state
function updateGameState(game) {
    // Update choices
    if (game.player1.choice) {
        player1Choice.textContent = game.player1.choice;
    }
    if (game.player2.choice) {
        player2Choice.textContent = game.player2.choice;
    }

    // Update scores
    updateScores(game.player1.score, game.player2.score);

    // Check for winner
    if (game.player1.choice && game.player2.choice) {
        const winner = determineWinner(game.player1.choice, game.player2.choice);
        if (winner) {
            gameResult.textContent = `${winner === 'player1' ? game.player1.name : game.player2.name} wins!`;
            
            // Update scores in Firebase
            const gameRef = database.ref(`games/${gameState.gameCode}`);
            gameRef.update({
                [`${winner}.score`]: game[winner].score + 1,
                'player1.choice': null,
                'player2.choice': null
            });
        } else {
            gameResult.textContent = "It's a tie!";
            
            // Reset choices in Firebase
            const gameRef = database.ref(`games/${gameState.gameCode}`);
            gameRef.update({
                'player1.choice': null,
                'player2.choice': null
            });
        }
    }
}

// Update scores
function updateScores(score1, score2) {
    player1Score.textContent = score1;
    player2Score.textContent = score2;
}

// Determine winner
function determineWinner(choice1, choice2) {
    if (choice1 === choice2) return null;
    
    if (
        (choice1 === '✊' && choice2 === '✌️') ||
        (choice1 === '✋' && choice2 === '✊') ||
        (choice1 === '✌️' && choice2 === '✋')
    ) {
        return 'player1';
    }
    return 'player2';
}

// Reset game
function resetGame() {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    gameRef.update({
        'player1.score': 0,
        'player2.score': 0,
        'player1.choice': null,
        'player2.choice': null
    });
    
    gameResult.textContent = '';
    player1Choice.textContent = '';
    player2Choice.textContent = '';
}
