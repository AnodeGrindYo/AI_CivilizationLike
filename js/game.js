class Game {
    constructor(config = {}) {
        this.config = {
            mapWidth: 32,
            mapHeight: 24,
            startingYear: -4000,
            yearIncrement: 50,
            autoStartNewGame: false,
            ...config
        };
        
        this.turn = 0;
        this.year = this.config.startingYear;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.map = null;
        this.isRunning = false;
        this.speed = 1; // Speed of auto-play (1-5)
        this.eventListeners = {};
        this.events = []; // Store for game events
        
        // Game statistics
        this.stats = {
            startTime: null,
            totalTurns: 0,
            aiDecisions: 0,
            victories: {},
            gameHistory: []
        };
    }

    initialize() {
        // Create map
        this.map = new GameMap(this.config.mapWidth, this.config.mapHeight);
        this.map.generate();
        
        // Reset stats
        this.stats.startTime = Date.now();
        this.stats.totalTurns = 0;
        this.stats.aiDecisions = 0;
        this.stats.gameHistory = [];
        
        // Trigger initialization event
        this.emit('gameInitialized', this);
    }
    
    addPlayer(player) {
        this.players.push(player);
        player.game = this;
        
        // Find starting position
        const startPos = this.map.findStartingPosition();
        if (startPos) {
            const city = new City({
                name: `${player.name} Capital`,
                owner: player,
                location: startPos
            });
            player.addCity(city);
            this.map.placeCity(city);
        }
        
        this.emit('playerAdded', player);
        return player;
    }
    
    start() {
        if (this.players.length === 0) {
            console.error("Cannot start game without players");
            return;
        }
        
        this.isRunning = true;
        this.emit('gameStarted', this);
        
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
        
        this.autoPlayInterval = setInterval(() => {
            if (this.isRunning) {
                this.nextTurn();
            }
        }, 6000 / this.speed);
    }
    
    pause() {
        this.isRunning = false;
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        this.emit('gamePaused', this);
    }
    
    nextTurn() {
        // Current player's turn
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Execute AI turn if this is an AI player
        if (currentPlayer.agent) {
            const decisions = currentPlayer.agent.makeDecisions();
            this.stats.aiDecisions += decisions.length;
            
            // Execute each decision
            decisions.forEach(decision => {
                this.executeDecision(currentPlayer, decision);
            });
        }
        
        // Process end of turn for current player
        currentPlayer.endTurn();
        
        // Update player index
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // If we've cycled through all players, increase game turn
        if (this.currentPlayerIndex === 0) {
            this.turn++;
            this.year += this.config.yearIncrement;
            this.stats.totalTurns++;
            
            // Update map resources, growth, etc.
            this.map.update();
            
            // Record game state for history
            this.recordGameState();
            
            // Check victory conditions
            this.checkVictoryConditions();
        }
        
        // Trigger turn changed event
        this.emit('turnChanged', {
            turn: this.turn,
            year: this.year,
            currentPlayer: this.players[this.currentPlayerIndex]
        });
    }
    
    executeDecision(player, decision) {
        // Handle different types of decisions
        switch (decision.type) {
            case 'move':
                const moveResult = this.moveUnit(player, decision.unitId, decision.destination);
                // Add event for movement
                if (moveResult) {
                    const unit = player.getUnitById(decision.unitId);
                    if (unit) {
                        // Trigger animation for unit movement
                        const unitElement = document.querySelector(`.unit[data-id="${decision.unitId}"]`);
                        if (unitElement) {
                            unitElement.classList.add('unit-moving');
                            setTimeout(() => {
                                unitElement.classList.remove('unit-moving');
                            }, 1000);
                        }
                    }
                    
                    this.addGameEvent('move', {
                        playerName: player.name,
                        playerColor: player.color,
                        unitType: player.getUnitById(decision.unitId).type,
                        destination: decision.destination
                    });
                }
                break;
            case 'build':
                const buildResult = this.buildStructure(player, decision.cityId, decision.structure);
                // Add event for building
                if (buildResult) {
                    this.addGameEvent('build', {
                        playerName: player.name,
                        playerColor: player.color,
                        cityName: player.getCityById(decision.cityId).name,
                        structure: decision.structure
                    });
                }
                break;
            case 'research':
                const researchResult = player.setResearch(decision.technology);
                // Add event for research
                if (researchResult) {
                    this.addGameEvent('research', {
                        playerName: player.name,
                        playerColor: player.color,
                        technology: decision.technology
                    });
                }
                break;
            case 'attack':
                // Handle attack decision
                if (decision.targetType === 'unit') {
                    const targetPlayer = this.findPlayerByUnitId(decision.targetId);
                    if (targetPlayer) {
                        const attackingUnit = player.getUnitById(decision.unitId);
                        const targetUnit = targetPlayer.getUnitById(decision.targetId);
                        if (attackingUnit && targetUnit) {
                            const attackResult = attackingUnit.attack(targetUnit, this);
                            if (attackResult) {
                                this.addGameEvent('attack', {
                                    playerName: player.name,
                                    playerColor: player.color,
                                    attackerType: attackingUnit.type,
                                    targetPlayerName: targetPlayer.name,
                                    targetType: targetUnit.type,
                                    destroyed: targetUnit.health <= 0
                                });
                            }
                        }
                    }
                }
                break;
            case 'settle':
                // Handle city founding
                const settlerUnit = player.getUnitById(decision.unitId);
                if (settlerUnit && settlerUnit.canSettleCity()) {
                    const cityName = `${player.name} City ${player.cities.length + 1}`;
                    const city = settlerUnit.settleCity(cityName);
                    if (city) {
                        this.addGameEvent('settle', {
                            playerName: player.name,
                            playerColor: player.color,
                            cityName: cityName,
                            location: settlerUnit.location
                        });
                        this.map.removeUnit(settlerUnit);
                        const index = player.units.findIndex(u => u.id === settlerUnit.id);
                        if (index !== -1) {
                            player.units.splice(index, 1);
                        }
                    }
                }
                break;
        }
    }
    
    findPlayerByUnitId(unitId) {
        for (const player of this.players) {
            if (player.getUnitById(unitId)) {
                return player;
            }
        }
        return null;
    }
    
    addGameEvent(type, data) {
        // Create event object
        const event = {
            type,
            data,
            turn: this.turn,
            timestamp: Date.now()
        };
        
        // Store in game history
        if (!this.events) this.events = [];
        this.events.push(event);
        
        // Keep only last 30 events
        if (this.events.length > 30) {
            this.events.shift();
        }
        
        // Emit event for UI
        this.emit('gameEvent', event);
    }
    
    moveUnit(player, unitId, destination) {
        const unit = player.getUnitById(unitId);
        if (!unit) return false;
        
        // Check if move is valid
        if (this.map.isValidMove(unit, destination)) {
            this.map.moveUnit(unit, destination);
            return true;
        }
        return false;
    }
    
    buildStructure(player, cityId, structure) {
        const city = player.getCityById(cityId);
        if (!city) return false;
        
        return city.buildStructure(structure);
    }
    
    recordGameState() {
        // Create a snapshot of the current game state for history
        const snapshot = {
            turn: this.turn,
            year: this.year,
            players: this.players.map(player => ({
                id: player.id,
                name: player.name,
                score: player.getScore(),
                cities: player.cities.length,
                technology: player.technology.researched.length,
                units: player.units.length
            }))
        };
        
        this.stats.gameHistory.push(snapshot);
    }
    
    checkVictoryConditions() {
        // Check various victory conditions
        for (const player of this.players) {
            // Example: Domination victory
            if (player.cities.length >= this.map.totalCities * 0.7) {
                this.endGame(player, 'domination');
                return;
            }
            
            // Other victory conditions...
        }
        
        // Check if we've reached max turns
        if (this.turn >= this.config.maxTurns) {
            // Find player with highest score
            let highestScore = -1;
            let winner = null;
            
            for (const player of this.players) {
                const score = player.getScore();
                if (score > highestScore) {
                    highestScore = score;
                    winner = player;
                }
            }
            
            if (winner) {
                this.endGame(winner, 'score');
            }
        }
    }
    
    endGame(winner, victoryType) {
        this.isRunning = false;
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        
        // Record victory in stats
        if (!this.stats.victories[victoryType]) {
            this.stats.victories[victoryType] = 0;
        }
        this.stats.victories[victoryType]++;
        
        // Emit game over event
        this.emit('gameOver', {
            winner: winner,
            victoryType: victoryType,
            turns: this.turn,
            year: this.year
        });
        
        // Train AI agents based on game results
        this.players.forEach(player => {
            if (player.agent) {
                const isWinner = player === winner;
                player.agent.learnFromGameResult(isWinner, this.stats);
            }
        });
        
        // Auto-start new game if configured
        if (this.config.autoStartNewGame) {
            setTimeout(() => {
                // Create and initialize a new game with the same configuration
                const newGame = new Game(this.config);
                newGame.initialize();
                
                // Add AI players similar to the previous game
                const aiCount = parseInt(document.getElementById('ai-count')?.value || 4);
                
                for (let i = 0; i < aiCount; i++) {
                    const newPlayer = new Player(`AI Player ${i+1}`, { 
                        color: this.getRandomColor ? this.getRandomColor() : '#' + Math.floor(Math.random()*16777215).toString(16)
                    });
                    
                    // Create an agent for the player
                    const agentType = document.getElementById('default-ai-type')?.value || 'qlearn';
                    
                    let newAgent;
                    if (agentType === 'qlearn') {
                        newAgent = new QLearningAgent();
                    } else if (agentType === 'deepq') {
                        newAgent = new DeepQAgent();
                    } else {
                        // Default to basic agent
                        newAgent = new AIAgent();
                    }
                    
                    newPlayer.setAgent(newAgent);
                    newGame.addPlayer(newPlayer);
                }
                
                // Start the new game
                newGame.start();
                
                // Replace the current game globally
                if (window.app) {
                    window.app.game = newGame;
                    window.app.uiManager.initialize(newGame);
                }
            }, 2000); // Short delay to see results
        }
    }
    
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    emit(event, data) {
        const callbacks = this.eventListeners[event] || [];
        callbacks.forEach(callback => callback(data));
    }
    
    save() {
        // Create a serializable game state
        const saveData = {
            config: this.config,
            turn: this.turn,
            year: this.year,
            currentPlayerIndex: this.currentPlayerIndex,
            map: this.map.serialize(),
            players: this.players.map(player => player.serialize()),
            stats: this.stats
        };
        
        return saveData;
    }
    
    load(saveData) {
        this.config = saveData.config;
        this.turn = saveData.turn;
        this.year = saveData.year;
        this.currentPlayerIndex = saveData.currentPlayerIndex;
        
        // Load map
        this.map = new GameMap();
        this.map.deserialize(saveData.map);
        
        // Load players
        this.players = saveData.players.map(playerData => {
            const player = new Player(playerData.name);
            player.deserialize(playerData, this);
            return player;
        });
        
        // Load stats
        this.stats = saveData.stats;
        
        this.emit('gameLoaded', this);
    }
}