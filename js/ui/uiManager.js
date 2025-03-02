class UIManager {
    constructor(app) {
        this.app = app;
        this.game = null;
        this.mapRenderer = null;
        this.settingsPanel = null;
        this.statsPanel = null;
        this.agentsPanel = null;
        this.helpPanel = null;
        this.activePanel = null;
    }
    
    initialize(game) {
        this.game = game;
        
        // Initialize map renderer
        const mapContainer = document.getElementById('map-container');
        this.mapRenderer = new MapRenderer(mapContainer, game);
        this.mapRenderer.onTileSelected = this.handleTileSelection.bind(this);
        this.mapRenderer.onUnitSelected = this.handleUnitSelection.bind(this);
        this.mapRenderer.onCitySelected = this.handleCitySelection.bind(this);
        this.mapRenderer.initialize();
        
        // Initialize panels
        this.settingsPanel = new SettingsPanel(this, game);
        this.statsPanel = new StatsPanel(this, game);
        this.agentsPanel = new AgentsPanel(this, game);
        this.helpPanel = new HelpPanel(this, game);
        
        // Initialize panels
        this.settingsPanel.initialize();
        this.statsPanel.initialize();
        this.agentsPanel.initialize();
        this.helpPanel.initialize();
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Update turn counter
        this.updateTurnCounter(0);
        
        // Setup game event listeners
        game.on('turnChanged', this.handleTurnChanged.bind(this));
        game.on('gameStarted', this.handleGameStarted.bind(this));
        game.on('gamePaused', this.handleGamePaused.bind(this));
        game.on('gameOver', this.handleGameOver.bind(this));
        game.on('gameEvent', this.handleGameEvent.bind(this));
    }
    
    setupEventListeners() {
        // Panel toggle buttons
        document.getElementById('toggle-settings').addEventListener('click', () => {
            this.togglePanel('settings-panel');
        });
        
        document.getElementById('toggle-stats').addEventListener('click', () => {
            this.togglePanel('stats-panel');
        });
        
        document.getElementById('toggle-agents').addEventListener('click', () => {
            this.togglePanel('agents-panel');
        });
        
        document.getElementById('toggle-help').addEventListener('click', () => {
            this.togglePanel('help-panel');
        });
        
        // Game control buttons
        document.getElementById('start-game').addEventListener('click', () => {
            if (this.game) {
                if (this.game.isRunning) {
                    this.game.pause();
                } else {
                    this.game.start();
                }
            }
        });
        
        document.getElementById('pause-game').addEventListener('click', () => {
            if (this.game && this.game.isRunning) {
                this.game.pause();
            }
        });
        
        document.getElementById('next-turn').addEventListener('click', () => {
            if (this.game) {
                this.game.nextTurn();
            }
        });
    }
    
    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        // Close currently open panel if it's not the same one
        if (this.activePanel && this.activePanel.id !== panelId) {
            this.activePanel.classList.remove('active');
        }
        
        // Toggle the requested panel
        if (panel.classList.contains('active')) {
            panel.classList.remove('active');
            this.activePanel = null;
        } else {
            panel.classList.add('active');
            this.activePanel = panel;
            
            // Update panel content if needed
            if (panelId === 'stats-panel') {
                this.statsPanel.update();
            } else if (panelId === 'agents-panel') {
                this.agentsPanel.update();
            }
        }
    }
    
    handleTileSelection(tile) {
        console.log('Tile selected:', tile);
        // Handle tile selection logic
    }
    
    handleUnitSelection(unit) {
        console.log('Unit selected:', unit);
        // Highlight the unit's tile
        this.mapRenderer.highlightTile(unit.location.x, unit.location.y);
        
        // Update UI for unit actions
        this.showUnitActions(unit);
    }
    
    handleCitySelection(city) {
        console.log('City selected:', city);
        // Highlight the city's tile
        this.mapRenderer.highlightTile(city.location.x, city.location.y);
        
        // Update UI for city actions
        this.showCityInfo(city);
    }
    
    showUnitActions(unit) {
        // Create a modal or panel with unit actions
        // This is a placeholder for actual implementation
    }
    
    showCityInfo(city) {
        // Create a modal or panel with city information
        // This is a placeholder for actual implementation
    }
    
    handleTurnChanged(data) {
        this.updateTurnCounter(data.turn);
        document.getElementById('turn-counter').textContent = data.turn;
        document.getElementById('year-counter').textContent = data.year;
        document.getElementById('start-game').textContent = this.game.isRunning ? 'Pause Game' : 'Start Game';
        
        // Update map units and cities
        if (this.mapRenderer) {
            this.mapRenderer.updateUnits();
            this.mapRenderer.updateCities();
        }
    }
    
    handleGameStarted() {
        document.getElementById('start-game').textContent = 'Pause Game';
    }
    
    handleGamePaused() {
        document.getElementById('start-game').textContent = 'Start Game';
    }
    
    handleGameOver(data) {
        // Create a game over modal
        this.showGameOverModal(data);
    }
    
    updateTurnCounter(turn) {
        const counter = document.getElementById('turn-counter');
        if (counter) {
            counter.textContent = turn;
        }
    }
    
    showGameOverModal(data) {
        // Create a modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modalOverlay.style.display = 'flex';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.alignItems = 'center';
        modalOverlay.style.zIndex = '1000';
        
        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'game-over-modal';
        modal.style.backgroundColor = 'var(--panel-bg)';
        modal.style.border = 'var(--panel-border)';
        modal.style.borderRadius = '8px';
        modal.style.padding = '1.5rem';
        modal.style.maxWidth = '90%';
        modal.style.width = '400px';
        
        // Modal header
        const header = document.createElement('h2');
        header.textContent = 'Game Over';
        header.style.marginBottom = '1rem';
        modal.appendChild(header);
        
        // Victory info
        const victoryInfo = document.createElement('p');
        victoryInfo.textContent = `${data.winner.name} won with a ${data.victoryType} victory in year ${data.year}!`;
        victoryInfo.style.marginBottom = '1rem';
        modal.appendChild(victoryInfo);
        
        // Game stats
        const stats = document.createElement('div');
        stats.innerHTML = `
            <p>Turns played: ${data.turns}</p>
            <p>Total cities: ${this.game.map.totalCities}</p>
            <p>AI decisions: ${this.game.stats.aiDecisions}</p>
        `;
        stats.style.marginBottom = '1rem';
        modal.appendChild(stats);
        
        // Player scores
        const scoresList = document.createElement('div');
        scoresList.style.marginBottom = '1.5rem';
        
        let scoreHeader = document.createElement('h3');
        scoreHeader.textContent = 'Final Scores';
        scoreHeader.style.marginBottom = '0.5rem';
        scoresList.appendChild(scoreHeader);
        
        // Sort players by score
        const players = [...this.game.players].sort((a, b) => b.getScore() - a.getScore());
        
        for (const player of players) {
            const playerScore = document.createElement('div');
            playerScore.style.display = 'flex';
            playerScore.style.justifyContent = 'space-between';
            playerScore.style.alignItems = 'center';
            playerScore.style.padding = '0.25rem 0';
            
            const playerName = document.createElement('span');
            playerName.textContent = player.name;
            
            const colorIndicator = document.createElement('span');
            colorIndicator.style.display = 'inline-block';
            colorIndicator.style.width = '12px';
            colorIndicator.style.height = '12px';
            colorIndicator.style.backgroundColor = player.color;
            colorIndicator.style.borderRadius = '50%';
            colorIndicator.style.marginRight = '6px';
            
            playerName.prepend(colorIndicator);
            
            const score = document.createElement('span');
            score.textContent = player.getScore();
            
            playerScore.appendChild(playerName);
            playerScore.appendChild(score);
            
            scoresList.appendChild(playerScore);
        }
        modal.appendChild(scoresList);
        
        // Action buttons
        const buttons = document.createElement('div');
        buttons.style.display = 'flex';
        buttons.style.justifyContent = 'space-between';
        
        const newGameBtn = document.createElement('button');
        newGameBtn.textContent = 'New Game';
        newGameBtn.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
            this.app.startNewGame();
        });
        
        const viewStatsBtn = document.createElement('button');
        viewStatsBtn.textContent = 'View Stats';
        viewStatsBtn.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
            this.togglePanel('stats-panel');
        });
        
        buttons.appendChild(newGameBtn);
        buttons.appendChild(viewStatsBtn);
        
        modal.appendChild(buttons);
        
        // Add to DOM
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
    }
    
    handleGameEvent(event) {
        // Display game event in the UI
        const eventsContainer = document.getElementById('game-events');
        if (!eventsContainer) return;
        
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        
        // Determine icon and message based on event type
        let icon = '';
        let message = '';
        
        switch (event.type) {
            case 'move':
                icon = '';
                message = `${event.data.playerName} moves ${event.data.unitType} to (${event.data.destination.x}, ${event.data.destination.y})`;
                break;
            case 'build':
                icon = '';
                message = `${event.data.playerName} is building ${event.data.structure} in ${event.data.cityName}`;
                break;
            case 'research':
                icon = '';
                message = `${event.data.playerName} is researching ${event.data.technology}`;
                break;
            case 'attack':
                icon = '';
                message = `${event.data.playerName}'s ${event.data.attackerType} attacks ${event.data.targetPlayerName}'s ${event.data.targetType}`;
                if (event.data.destroyed) {
                    message += ' and destroys it!';
                }
                break;
            case 'settle':
                icon = '';
                message = `${event.data.playerName} founds ${event.data.cityName} at (${event.data.location.x}, ${event.data.location.y})`;
                break;
            default:
                icon = '';
                message = `Game event: ${event.type}`;
        }
        
        const iconElement = document.createElement('span');
        iconElement.className = 'event-item-icon';
        iconElement.textContent = icon;
        
        const messageElement = document.createElement('span');
        messageElement.textContent = message;
        
        // Apply player color
        if (event.data.playerColor) {
            messageElement.style.color = event.data.playerColor;
        }
        
        eventItem.appendChild(iconElement);
        eventItem.appendChild(messageElement);
        
        // Add to container
        eventsContainer.prepend(eventItem);
        
        // Remove old events
        if (eventsContainer.children.length > 10) {
            eventsContainer.removeChild(eventsContainer.lastChild);
        }
        
        // Update map if needed
        if (event.type === 'move' || event.type === 'attack') {
            this.updateUnitsOnMap();
        } else if (event.type === 'settle') {
            this.mapRenderer.render();
        }
    }
    
    updateUnitsOnMap() {
        if (this.mapRenderer) {
            this.mapRenderer.updateUnits();
            this.mapRenderer.updateCities();
        }
    }
}