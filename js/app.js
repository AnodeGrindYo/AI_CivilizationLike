class App {
    constructor() {
        this.game = null;
        this.uiManager = null;
        this.agentStore = new AgentStore();
    }
    
    initialize() {
        // Create new game
        this.game = new Game();
        this.game.initialize();
        
        // Create UI manager
        this.uiManager = new UIManager(this);
        this.uiManager.initialize(this.game);
        
        // Add event listeners for app-level actions
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('next-turn').addEventListener('click', () => {
            if (this.game) {
                this.game.nextTurn();
            }
        });
    }
    
    startGame() {
        if (!this.game) return;
        
        // Get AI count from settings
        const aiCount = parseInt(document.getElementById('ai-count')?.value || 3);
        
        // Clear the current game state
        this.startNewGame();
        
        // Civilization options with their leaders
        const civilizations = [
            { name: 'American', leader: 'Abraham Lincoln', color: '#0E4CA1' },
            { name: 'Aztec', leader: 'Montezuma', color: '#C13936' },
            { name: 'Babylonian', leader: 'Hammurabi', color: '#D6A32E' },
            { name: 'Chinese', leader: 'Mao Zedong', color: '#E71324' },
            { name: 'Egyptian', leader: 'Ramses II', color: '#EBCB55' },
            { name: 'English', leader: 'Elizabeth I', color: '#CE1124' },
            { name: 'French', leader: 'Napoleon', color: '#0055A4' },
            { name: 'German', leader: 'Frederick II', color: '#000000' },
            { name: 'Greek', leader: 'Alexander the Great', color: '#00AAE4' },
            { name: 'Indian', leader: 'Mahatma Gandhi', color: '#FF9933' },
            { name: 'Russian', leader: 'Joseph Stalin', color: '#D52B1E' },
            { name: 'Roman', leader: 'Julius Caesar', color: '#8B2323' },
            { name: 'Mongolian', leader: 'Genghis Khan', color: '#0066CC' },
            { name: 'Zulu', leader: 'Shaka', color: '#007749' }
        ];
        
        // Create AI players
        for (let i = 0; i < aiCount; i++) {
            // Select a random civilization that hasn't been used yet
            const civIndex = i % civilizations.length;
            const civ = civilizations[civIndex];
            
            const aiPlayer = new Player(`${civ.name}`, { 
                color: civ.color,
                civilization: civ.name,
                leader: civ.leader
            });
            
            // Create an agent for the player
            const agentType = document.getElementById('default-ai-type')?.value || 'qlearn';
            const agent = this.agentStore.createAgentFromType(agentType, {
                name: `${civ.leader}'s Agent`,
                description: 'Auto-generated agent'
            });
            
            // Instantiate the agent
            const instantiatedAgent = this.agentStore.instantiateAgent(agent);
            aiPlayer.setAgent(instantiatedAgent);
            
            this.game.addPlayer(aiPlayer);
        }
        
        // Start the game automatically
        this.game.start();
    }
    
    startNewGame() {
        // Clean up old game if exists
        if (this.game) {
            this.game.pause();
        }
        
        // Create and initialize new game
        this.game = new Game();
        this.game.initialize();
        
        // Update UI
        this.uiManager.initialize(this.game);
    }
    
    getRandomColor() {
        const colors = [
            '#e74c3c', '#9b59b6', '#2ecc71', '#f1c40f', 
            '#1abc9c', '#e67e22', '#34495e', '#7f8c8d'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
    
    // Make app accessible globally for debugging
    window.app = app;
});