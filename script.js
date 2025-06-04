// Join an existing game
function joinGame() {
    console.log('Join game function called');
    const gameCode = gameCodeInput.value.trim().toUpperCase();
    const player2Name = player1NameInput.value.trim();

    console.log('Attempting to join game with:');
    console.log('- Game code:', gameCode);
    console.log('- Player name:', player2Name);

    if (!gameCode || !player2Name) {
        alert('Please enter a game code and your name');
        return;
    }

    // Check if game exists
    const gameRef = database.ref(`games/${gameCode}`);
    console.log('Checking game at path:', `games/${gameCode}`);
    
    gameRef.once('value', (snapshot) => {
        const gameData = snapshot.val();
        console.log('Received game data:', gameData);
        
        if (!gameData) {
            console.log('Game not found in database');
            alert('Game not found. Please check the game code and try again.');
            return;
        }

        if (gameData.status === 'playing') {
            console.log('Game already in progress');
            alert('Game already in progress');
            return;
        }

        console.log('Game found, updating with player 2...');
        // Update game with player 2
        gameRef.update({
            'player2.name': player2Name,
            status: 'playing'
        }).then(() => {
            console.log('Game updated successfully');
            // Update local game state
            gameState.playerNames.player1 = gameData.player1.name;
            gameState.playerNames.player2 = player2Name;
            gameState.gameCode = gameCode;
            gameState.isHost = false;

            // Hide setup screen and show game area
            setupScreen.classList.add('hidden');
            waitingScreen.classList.add('hidden');
            gameArea.classList.remove('hidden');

            // Update UI
            player1Display.textContent = gameData.player1.name;
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
