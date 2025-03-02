class HelpPanel {
    constructor(uiManager, game) {
        this.uiManager = uiManager;
        this.game = game;
        this.container = document.getElementById('help-content');
    }
    
    initialize() {
        this.render();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="help-section">
                <h3>Getting Started</h3>
                <p>AI Civilization is a game where you configure AI agents to play the game of civilization. Click "Start Game" to begin a new game.</p>
                <p>You can adjust all aspects of the AI agents in the Agents panel and watch them learn over time.</p>
            </div>
            
            <div class="help-section">
                <h3>Game Controls</h3>
                <ul>
                    <li><strong>Start Game</strong>: Begin a new game with the configured settings</li>
                    <li><strong>Pause</strong>: Pause the current game</li>
                    <li><strong>Next Turn</strong>: Manually advance to the next turn</li>
                </ul>
            </div>
            
            <div class="help-section">
                <h3>AI Agents</h3>
                <p>There are several types of AI agents you can configure:</p>
                <ul>
                    <li><strong>Basic AI</strong>: Simple rule-based agent</li>
                    <li><strong>Q-Learning</strong>: Learns from experience using Q-tables</li>
                    <li><strong>Deep Q-Learning</strong>: Uses neural networks to learn complex strategies</li>
                </ul>
                <p>You can adjust their learning parameters and reward systems in the Agents panel.</p>
            </div>
        `;
    }
}

