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

// Dare list
const dares = [
    "Do your best seductive dance move",
    "Tell me about your most embarrassing dating story",
    "Do your best runway walk",
    "Tell me about your biggest crush",
    "Show me your best 'flirty' face",
    "Do your best romantic movie scene",
    "Tell me about your worst date",
    "Show me your best 'come here' gesture",
    "Do your best romantic serenade",
    "Do 10 jumping jacks",
    "Sing your favorite song for 30 seconds",
    "Do your best dance move",
    "Tell a joke",
    "Make a funny face",
    "Do your best animal impression",
    "Give yourself a compliment",
    "Do 5 push-ups",
    "Tell me your most embarrassing moment",
    "Do your best superhero pose",
    "Share a fun fact about yourself",
    "Do your best robot dance",
    "Tell me your dream vacation",
    "Do your best celebrity impression",
    "Share your favorite meme",
    "yapp for 30 mins davs only "
];

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
    isHost: false,
    currentRound: 0,
    roundScores: {
        player1: [],
        player2: []
    },
    gameEnded: false
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

    // Show loading state
    createGameBtn.disabled = true;
    createGameBtn.textContent = "Creating Game...";

    // Generate a random game code (only letters and numbers)
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, "");
    
    // Set up the game in Firebase
    const gameRef = database.ref(`games/${gameCode}`);
    gameRef.set({
        player1: {
            name: player1Name,
            choice: null,
            score: 0,
            totalWins: 0
        },
        player2: {
            name: null,
            choice: null,
            score: 0,
            totalWins: 0
        },
        currentPlayer: 1,
        status: "waiting",
        currentResult: "",
        lastResult: "",
        scores: {
            player1: 0,
            player2: 0
        },
        lastUpdate: Date.now()
    }).then(() => {
        // Update local game state
        gameState.playerNames.player1 = player1Name;
        gameState.gameCode = gameCode;
        gameState.isHost = true;

        // Show waiting screen
        setupScreen.classList.add("hidden");
        waitingScreen.classList.remove("hidden");
        gameArea.classList.add("hidden");
        gameCodeDisplay.textContent = gameCode;

        // Reset button state
        createGameBtn.disabled = false;
        createGameBtn.textContent = "Create Game";

        // Listen for game updates with priority
        gameRef.on("value", (snapshot) => {
            const game = snapshot.val();
            if (game) {
                console.log("Host received update:", {
                    currentResult: game.currentResult,
                    lastResult: game.lastResult,
                    lastUpdate: game.lastUpdate
                });

                if (game.status === "playing") {
                    waitingScreen.classList.add("hidden");
                    gameArea.classList.remove("hidden");
                    player1Display.textContent = game.player1.name;
                    player2Display.textContent = game.player2.name;
                    updateScores(game.scores.player1, game.scores.player2);
                }

                // Always update game state and show results
                if (game.currentResult) {
                    gameResult.textContent = game.currentResult;
                }
                if (game.lastResult) {
                    gameResult.textContent = game.lastResult;
                }
                updateGameState(game);
            }
        });
    }).catch((error) => {
        console.error("Error creating game:", error);
        alert("Error creating game. Please check your internet connection and try again.");
        createGameBtn.disabled = false;
        createGameBtn.textContent = "Create Game";
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

    // Show loading state
    joinGameBtn.disabled = true;
    joinGameBtn.textContent = "Joining Game...";

    // Check if game exists
    const gameRef = database.ref(`games/${gameCode}`);
    console.log("Checking game at path:", `games/${gameCode}`);
    
    gameRef.once("value", (snapshot) => {
        const gameData = snapshot.val();
        console.log("Received game data:", gameData);
        
        if (!gameData) {
            console.log("Game not found in database");
            alert("Game not found. Please check the game code and try again.");
            joinGameBtn.disabled = false;
            joinGameBtn.textContent = "Join Game";
            return;
        }

        if (gameData.status === "playing") {
            console.log("Game already in progress");
            alert("Game already in progress");
            joinGameBtn.disabled = false;
            joinGameBtn.textContent = "Join Game";
            return;
        }

        console.log("Game found, updating with player 2...");
        // Update game with player 2
        gameRef.update({
            player2: {
                name: player2Name,
                choice: null,
                score: 0,
                totalWins: 0
            },
            status: "playing",
            currentResult: "",
            lastResult: "",
            scores: {
                player1: gameData.scores?.player1 || 0,
                player2: 0
            },
            lastUpdate: Date.now()
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
            updateScores(gameData.scores?.player1 || 0, 0);

            // Reset button state
            joinGameBtn.disabled = false;
            joinGameBtn.textContent = "Join Game";

            // Listen for game updates with a more specific listener
            gameRef.on("value", (snapshot) => {
                const game = snapshot.val();
                if (game) {
                    console.log("Joiner received update:", {
                        currentResult: game.currentResult,
                        lastResult: game.lastResult,
                        status: game.status
                    });

                    // Update UI first
                    player1Display.textContent = game.player1?.name || "Player 1";
                    player2Display.textContent = game.player2?.name || "Player 2";
                    updateScores(game.scores?.player1 || 0, game.scores?.player2 || 0);

                    // Show results immediately
                    if (game.currentResult) {
                        console.log("Joiner showing current result:", game.currentResult);
                        gameResult.textContent = game.currentResult;
                    }
                    if (game.lastResult) {
                        console.log("Joiner showing last result:", game.lastResult);
                        gameResult.textContent = game.lastResult;
                    }

                    // Update game state
                    updateGameState(game);

                    // Update choices
                    if (game.player1?.choice) {
                        player1Choice.textContent = game.player1.choice;
                    }
                    if (game.player2?.choice) {
                        player2Choice.textContent = game.player2.choice;
                    }

                    // Update turn message
                    if (!game.player1?.choice && !game.player2?.choice) {
                        currentTurn.textContent = `${game.player1?.name || "Player 1"}'s turn`;
                    } else if (game.player1?.choice && !game.player2?.choice) {
                        currentTurn.textContent = `${game.player2?.name || "Player 2"}'s turn`;
                    } else if (!game.player1?.choice && game.player2?.choice) {
                        currentTurn.textContent = `${game.player1?.name || "Player 1"}'s turn`;
                    } else {
                        currentTurn.textContent = "";
                    }
                }
            }, (error) => {
                console.error("Joiner listener error:", error);
            });
        }).catch((error) => {
            console.error("Error updating game:", error);
            alert("Error joining game. Please check your internet connection and try again.");
            joinGameBtn.disabled = false;
            joinGameBtn.textContent = "Join Game";
        });
    }).catch((error) => {
        console.error("Error checking game:", error);
        alert("Error checking game. Please check your internet connection and try again.");
        joinGameBtn.disabled = false;
        joinGameBtn.textContent = "Join Game";
    });
}

// Make a choice
function makeChoice(choice) {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    const playerKey = gameState.isHost ? "player1" : "player2";
    
    gameRef.once("value", (snapshot) => {
        const game = snapshot.val();
        if (game) {
            const update = {
                [playerKey]: {
                    name: game[playerKey].name,
                    choice: choice,
                    score: game[playerKey].score
                }
            };

            // If this is the host making a choice, ensure the joiner sees it
            if (gameState.isHost) {
                update.currentResult = game.currentResult;
                update.lastResult = game.lastResult;
            }

            gameRef.update(update).then(() => {
                console.log(`${playerKey} made choice:`, choice);
            }).catch(error => {
                console.error("Error updating choice:", error);
            });
        }
    });
}

// Get random dare
function getRandomDare() {
    const randomIndex = Math.floor(Math.random() * dares.length);
    return dares[randomIndex];
}

// Update game state
function updateGameState(game) {
    if (!game) {
        console.log("No game data received");
        return;
    }

    console.log("=== Update Game State ===");
    console.log("Current game state:", {
        currentResult: game.currentResult,
        lastResult: game.lastResult,
        gameEnded: gameState.gameEnded,
        isHost: gameState.isHost
    });

    // Force immediate UI updates
    requestAnimationFrame(() => {
        // Update scores immediately
        updateScores(game.scores?.player1 || 0, game.scores?.player2 || 0);

        // If game has ended, only show the final results
        if (gameState.gameEnded) {
            console.log("Game has ended, showing lastResult:", game.lastResult);
            gameResult.textContent = game.lastResult || "";
            return;
        }

        // Update choices - hide until both players have chosen
        if (game.player1?.choice && game.player2?.choice) {
            // Both players have chosen, show both choices
            player1Choice.textContent = game.player1.choice || "";
            player2Choice.textContent = game.player2.choice || "";
            // Disable choice buttons after both have chosen
            choices.forEach(choice => choice.disabled = true);

            // Check for winner
            const winner = determineWinner(game.player1.choice, game.player2.choice);
            const gameRef = database.ref(`games/${gameState.gameCode}`);
            
            // Increment round counter
            gameState.currentRound++;
            
            let roundResult = "";
            let newScore1 = game.player1?.score || 0;
            let newScore2 = game.player2?.score || 0;

            if (winner === "player1") {
                const dare = getRandomDare();
                roundResult = `${game.player1?.name || "Player 1"} wins! ${game.player2?.name || "Player 2"} must: ${dare}`;
                console.log("Player 1 wins round:", roundResult);
                newScore1 = (game.player1?.score || 0) + 1;
                
                // Store round score
                gameState.roundScores.player1.push(1);
                gameState.roundScores.player2.push(0);
                
                // Calculate new scores immediately
                const newScores = {
                    player1: (game.scores?.player1 || 0) + 1,
                    player2: game.scores?.player2 || 0
                };
                
                // Update scores in Firebase - only update currentResult for round results
                console.log("Updating Firebase with round result:", roundResult);
                gameRef.update({
                    player1: {
                        name: game.player1?.name || "Player 1",
                        score: newScore1,
                        choice: null,
                        totalWins: (game.player1?.totalWins || 0) + 1
                    },
                    player2: {
                        name: game.player2?.name || "Player 2",
                        choice: null,
                        score: game.player2?.score || 0,
                        totalWins: game.player2?.totalWins || 0
                    },
                    currentResult: roundResult,
                    scores: newScores
                }).then(() => {
                    console.log("Firebase updated successfully with round result");
                    // Force immediate UI update
                    requestAnimationFrame(() => {
                        gameResult.textContent = roundResult;
                    });
                }).catch(error => {
                    console.error("Error updating Firebase:", error);
                });

                // Update local scores immediately
                updateScores(newScores.player1, newScores.player2);
            } else if (winner === "player2") {
                const dare = getRandomDare();
                roundResult = `${game.player2?.name || "Player 2"} wins! ${game.player1?.name || "Player 1"} must: ${dare}`;
                console.log("Player 2 wins round:", roundResult);
                newScore2 = (game.player2?.score || 0) + 1;
                
                // Store round score
                gameState.roundScores.player1.push(0);
                gameState.roundScores.player2.push(1);
                
                // Calculate new scores immediately
                const newScores = {
                    player1: game.scores?.player1 || 0,
                    player2: (game.scores?.player2 || 0) + 1
                };
                
                // Update scores in Firebase - only update currentResult for round results
                console.log("Updating Firebase with round result:", roundResult);
                gameRef.update({
                    player1: {
                        name: game.player1?.name || "Player 1",
                        choice: null,
                        score: game.player1?.score || 0,
                        totalWins: game.player1?.totalWins || 0
                    },
                    player2: {
                        name: game.player2?.name || "Player 2",
                        score: newScore2,
                        choice: null,
                        totalWins: (game.player2?.totalWins || 0) + 1
                    },
                    currentResult: roundResult,
                    scores: newScores
                }).then(() => {
                    console.log("Firebase updated successfully with round result");
                    // Force immediate UI update
                    requestAnimationFrame(() => {
                        gameResult.textContent = roundResult;
                    });
                }).catch(error => {
                    console.error("Error updating Firebase:", error);
                });

                // Update local scores immediately
                updateScores(newScores.player1, newScores.player2);
            } else {
                roundResult = "It's a tie! No dare this time!";
                console.log("Round is a tie");
                
                // Store round score
                gameState.roundScores.player1.push(0);
                gameState.roundScores.player2.push(0);
                
                // Reset choices in Firebase - only update currentResult for round results
                console.log("Updating Firebase with tie result");
                gameRef.update({
                    player1: {
                        name: game.player1?.name || "Player 1",
                        choice: null,
                        score: game.player1?.score || 0,
                        totalWins: game.player1?.totalWins || 0
                    },
                    player2: {
                        name: game.player2?.name || "Player 2",
                        choice: null,
                        score: game.player2?.score || 0,
                        totalWins: game.player2?.totalWins || 0
                    },
                    currentResult: roundResult,
                    scores: {
                        player1: game.scores?.player1 || 0,
                        player2: game.scores?.player2 || 0
                    }
                }).then(() => {
                    console.log("Firebase updated successfully with tie result");
                    // Force immediate UI update
                    requestAnimationFrame(() => {
                        gameResult.textContent = roundResult;
                    });
                }).catch(error => {
                    console.error("Error updating Firebase:", error);
                });

                // Enable buttons after tie to continue playing
                setTimeout(() => {
                    choices.forEach(choice => choice.disabled = false);
                }, 2000);
            }

            // Check if either player has reached 3 points
            if (newScore1 >= 3 || newScore2 >= 3) {
                console.log("Game over condition met");
                setTimeout(() => {
                    const winner = newScore1 >= 3 ? (game.player1?.name || "Player 1") : (game.player2?.name || "Player 2");
                    const finalMessage = `✨ Game Over! ✨\n\n\n\n🏆 Game Won\n\n${winner} won 1 game\n\n\n\n🎮 Current Game\n\nBest of 3\n\n${game.player1?.name || "Player 1"}\n${newScore1} rounds\n\n${game.player2?.name || "Player 2"}\n${newScore2} rounds\n\n\n\n🎯 Winner\n\n${winner}\n🎉`;
                    console.log("Setting final message:", finalMessage);
                    
                    // Update only lastResult for final game result
                    gameRef.update({
                        lastResult: finalMessage,
                        gameEnded: true,
                        player1: {
                            ...game.player1,
                            choice: null
                        },
                        player2: {
                            ...game.player2,
                            choice: null
                        }
                    }).then(() => {
                        console.log("Firebase updated successfully with final result");
                        // Force immediate UI update
                        requestAnimationFrame(() => {
                            gameResult.textContent = finalMessage;
                        });
                    }).catch(error => {
                        console.error("Error updating Firebase with final result:", error);
                    });
                    
                    // Set game as ended
                    gameState.gameEnded = true;
                    
                    // Disable choice buttons
                    choices.forEach(choice => choice.disabled = true);
                }, 2000);
            } else if (winner !== null) {
                // If not game over and not a tie, enable buttons after showing result
                setTimeout(() => {
                    choices.forEach(choice => choice.disabled = false);
                }, 2000);
            }
        } else {
            // Hide choices if either player hasn't chosen yet
            player1Choice.textContent = game.player1?.choice ? "?" : "";
            player2Choice.textContent = game.player2?.choice ? "?" : "";
            // Enable choice buttons if it's the player's turn
            const isPlayer1Turn = !game.player1?.choice;
            const isPlayer2Turn = !game.player2?.choice;
            choices.forEach(choice => {
                if (gameState.isHost) {
                    choice.disabled = !isPlayer1Turn;
                } else {
                    choice.disabled = !isPlayer2Turn;
                }
            });

            // Only show turn message if there's no current result
            if (!game.currentResult) {
                if (!game.player1?.choice && !game.player2?.choice) {
                    currentTurn.textContent = `${game.player1?.name || "Player 1"}'s turn`;
                } else if (game.player1?.choice && !game.player2?.choice) {
                    currentTurn.textContent = `${game.player2?.name || "Player 2"}'s turn`;
                } else if (!game.player1?.choice && game.player2?.choice) {
                    currentTurn.textContent = `${game.player1?.name || "Player 1"}'s turn`;
                } else {
                    currentTurn.textContent = "";
                }
            }
        }
    });
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
    gameRef.once("value", (snapshot) => {
        const game = snapshot.val();
        if (game) {
            // Reset the game state completely for both players
            gameRef.update({
                player1: {
                    name: game.player1.name,
                    score: 0,
                    choice: null,
                    totalWins: 0
                },
                player2: {
                    name: game.player2.name,
                    score: 0,
                    choice: null,
                    totalWins: 0
                },
                lastResult: "",
                currentResult: "",
                gameEnded: false,
                scores: {
                    player1: 0,
                    player2: 0
                }
            }).then(() => {
                // Force immediate UI update of scores
                updateScores(0, 0);
            });
        }
    });
    
    // Reset local game state
    gameResult.textContent = "";
    player1Choice.textContent = "";
    player2Choice.textContent = "";
    gameState.gameEnded = false;
    gameState.currentRound = 0;
    gameState.roundScores = { player1: [], player2: [] };
    
    // Enable choice buttons for the first player's turn
    choices.forEach(choice => {
        choice.disabled = false;
    });
}
