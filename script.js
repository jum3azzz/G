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
        player1: "",
        player2: ""
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
const setupScreen = document.getElementById("setup-screen");
const waitingScreen = document.getElementById("waiting-screen");
const gameArea = document.getElementById("game-area");
const player1NameInput = document.getElementById("player1-name");
const createGameBtn = document.getElementById("create-game");
const joinGameBtn = document.getElementById("join-game");
const gameCodeInput = document.getElementById("game-code");
const gameCodeDisplay = document.getElementById("game-code-display");
const player1Display = document.getElementById("player1-display");
const player2Display = document.getElementById("player2-display");
const player1Score = document.getElementById("player1-score");
const player2Score = document.getElementById("player2-score");
const player1Choice = document.getElementById("player1-choice");
const player2Choice = document.getElementById("player2-choice");
const gameResult = document.getElementById("game-result");
const resetBtn = document.getElementById("reset-btn");
const choices = document.querySelectorAll(".choice");
const currentTurn = document.getElementById("current-turn");

// Event Listeners
createGameBtn.addEventListener("click", createGame);
joinGameBtn.addEventListener("click", joinGame);
resetBtn.addEventListener("click", resetGame);
choices.forEach(choice => {
    choice.addEventListener("click", () => makeChoice(choice.textContent));
});

// Create a new game
function createGame() {
    const player1Name = player1NameInput.value.trim();

    if (!player1Name) {
        alert("Please enter your name");
        return;
    }

    // Generate a random game code (only letters and numbers)
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, "");
    
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
        status: "waiting"
    });

    // Update local game state
    gameState.playerNames.player1 = player1Name;
    gameState.gameCode = gameCode;
    gameState.isHost = true;

    // Show waiting screen
    setupScreen.classList.add("hidden");
    waitingScreen.classList.remove("hidden");
    gameArea.classList.add("hidden");
    gameCodeDisplay.textContent = gameCode;

    // Listen for game updates
    gameRef.on("value", (snapshot) => {
        const game = snapshot.val();
        if (game) {
            if (game.status === "playing") {
                // Game has started
                waitingScreen.classList.add("hidden");
                gameArea.classList.remove("hidden");
                
                // Update UI
                player1Display.textContent = game.player1.name;
                player2Display.textContent = game.player2.name;
                updateScores(game.player1.score, game.player2.score);
            }
            // Always update game state
            updateGameState(game);
        }
    });
}

// Join an existing game
function joinGame() {
    console.log("Join game function called");
    const gameCode = gameCodeInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const player2Name = player1NameInput.value.trim();

    console.log("Attempting to join game with:");
    console.log("- Game code:", gameCode);
    console.log("- Player name:", player2Name);

    if (!gameCode || !player2Name) {
        alert("Please enter a game code and your name");
        return;
    }

    // Check if game exists
    const gameRef = database.ref(`games/${gameCode}`);
    console.log("Checking game at path:", `games/${gameCode}`);
    
    gameRef.once("value", (snapshot) => {
        const gameData = snapshot.val();
        console.log("Received game data:", gameData);
        
        if (!gameData) {
            console.log("Game not found in database");
            alert("Game not found. Please check the game code and try again.");
            return;
        }

        if (gameData.status === "playing") {
            console.log("Game already in progress");
            alert("Game already in progress");
            return;
        }

        console.log("Game found, updating with player 2...");
        // Update game with player 2
        gameRef.update({
            player2: {
                name: player2Name,
                choice: null,
                score: 0
            },
            status: "playing"
        }).then(() => {
            console.log("Game updated successfully");
            // Update local game state
            gameState.playerNames.player1 = gameData.player1.name;
            gameState.playerNames.player2 = player2Name;
            gameState.gameCode = gameCode;
            gameState.isHost = false;

            // Hide setup screen and show game area
            setupScreen.classList.add("hidden");
            waitingScreen.classList.add("hidden");
            gameArea.classList.remove("hidden");

            // Update UI
            player1Display.textContent = gameData.player1.name;
            player2Display.textContent = player2Name;
            updateScores(0, 0);

            // Listen for game updates
            gameRef.on("value", (snapshot) => {
                const game = snapshot.val();
                if (game) {
                    updateGameState(game);
                }
            });
        }).catch((error) => {
            console.error("Error updating game:", error);
            alert("Error joining game. Please try again.");
        });
    }).catch((error) => {
        console.error("Error checking game:", error);
        alert("Error checking game. Please try again.");
    });
}

// Make a choice
function makeChoice(choice) {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    const playerKey = gameState.isHost ? "player1" : "player2";
    
    gameRef.update({
        [playerKey]: {
            ...gameState[playerKey],
            choice: choice
        }
    });
}

// Update game state
function updateGameState(game) {
    // Update choices based on whether it's the host or joining player
    if (gameState.isHost) {
        // Host's view
        player1Choice.textContent = game.player1.choice || "";
        player2Choice.textContent = game.player2.choice ? (game.player1.choice ? game.player2.choice : "?") : "";
    } else {
        // Joining player's view
        player1Choice.textContent = game.player1.choice ? (game.player2.choice ? game.player1.choice : "?") : "";
        player2Choice.textContent = game.player2.choice || "";
    }

    // Update scores
    updateScores(game.player1.score, game.player2.score);

    // Update turn indicator
    if (!game.player1.choice && !game.player2.choice) {
        currentTurn.textContent = `${game.player1.name}'s turn`;
    } else if (game.player1.choice && !game.player2.choice) {
        currentTurn.textContent = `${game.player2.name}'s turn`;
    } else if (!game.player1.choice && game.player2.choice) {
        currentTurn.textContent = `${game.player1.name}'s turn`;
    } else {
        currentTurn.textContent = "";
    }

    // Check for winner
    if (game.player1.choice && game.player2.choice) {
        const winner = determineWinner(game.player1.choice, game.player2.choice);
        if (winner === "player1") {
            gameResult.textContent = `${game.player1.name} wins!`;
            
            // Update scores in Firebase
            const gameRef = database.ref(`games/${gameState.gameCode}`);
            gameRef.update({
                player1: {
                    ...game.player1,
                    score: game.player1.score + 1,
                    choice: null
                },
                player2: {
                    ...game.player2,
                    choice: null
                }
            });
        } else if (winner === "player2") {
            gameResult.textContent = `${game.player2.name} wins!`;
            
            // Update scores in Firebase
            const gameRef = database.ref(`games/${gameState.gameCode}`);
            gameRef.update({
                player1: {
                    ...game.player1,
                    choice: null
                },
                player2: {
                    ...game.player2,
                    score: game.player2.score + 1,
                    choice: null
                }
            });
        } else {
            gameResult.textContent = "It's a tie!";
            
            // Reset choices in Firebase
            const gameRef = database.ref(`games/${gameState.gameCode}`);
            gameRef.update({
                player1: {
                    ...game.player1,
                    choice: null
                },
                player2: {
                    ...game.player2,
                    choice: null
                }
            });
        }
    } else {
        // Clear result if not both players have chosen
        gameResult.textContent = "";
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
        (choice1 === "✊" && choice2 === "✌️") ||
        (choice1 === "✋" && choice2 === "✊") ||
        (choice1 === "✌️" && choice2 === "✋")
    ) {
        return "player1";
    }
    return "player2";
}

// Reset game
function resetGame() {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    gameRef.update({
        player1: {
            ...gameState.player1,
            score: 0,
            choice: null
        },
        player2: {
            ...gameState.player2,
            score: 0,
            choice: null
        }
    });
    
    gameResult.textContent = "";
    player1Choice.textContent = "";
    player2Choice.textContent = "";
}
