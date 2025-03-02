class StatsPanel {
    constructor(uiManager, game) {
        this.uiManager = uiManager;
        this.game = game;
        this.container = document.getElementById('stats-container');
    }
    
    initialize() {
        this.render();
    }
    
    render() {
        // Clear container
        this.container.innerHTML = '';
        
        // Game stats section
        const gameSection = document.createElement('div');
        gameSection.className = 'stats-section';
        
        const gameHeading = document.createElement('h3');
        gameHeading.textContent = 'Game Statistics';
        gameSection.appendChild(gameHeading);
        
        const gameStatsGrid = document.createElement('div');
        gameStatsGrid.className = 'stats-grid';
        
        // Add stats
        const gameStats = [
            { label: 'Turn', value: this.game ? this.game.turn : 0 },
            { label: 'Year', value: this.game ? `${Math.abs(this.game.year)} ${this.game.year < 0 ? 'BC' : 'AD'}` : '-4000 BC' },
            { label: 'Players', value: this.game ? this.game.players.length : 0 },
            { label: 'Total Cities', value: this.game && this.game.map ? this.game.map.cities.length : 0 },
            { label: 'Total Decisions', value: this.game ? this.game.stats.aiDecisions : 0 }
        ];
        
        for (const stat of gameStats) {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            const label = document.createElement('div');
            label.className = 'stat-label';
            label.textContent = stat.label;
            
            const value = document.createElement('div');
            value.className = 'stat-value';
            value.textContent = stat.value;
            
            statItem.appendChild(label);
            statItem.appendChild(value);
            gameStatsGrid.appendChild(statItem);
        }
        
        gameSection.appendChild(gameStatsGrid);
        this.container.appendChild(gameSection);
        
        // Player stats section if game has players
        if (this.game && this.game.players.length > 0) {
            const playerSection = document.createElement('div');
            playerSection.className = 'stats-section';
            
            const playerHeading = document.createElement('h3');
            playerHeading.textContent = 'Player Statistics';
            playerSection.appendChild(playerHeading);
            
            const playerComparison = document.createElement('div');
            playerComparison.className = 'agent-comparison';
            
            for (const player of this.game.players) {
                const playerItem = document.createElement('div');
                playerItem.className = 'agent-stat-item';
                
                const playerName = document.createElement('div');
                playerName.className = 'agent-name';
                playerName.innerHTML = `${player.leader} <br><small>(${player.civilization})</small>`;
                playerName.style.color = player.color;
                
                playerItem.appendChild(playerName);
                
                // Add player stats
                const stats = [
                    { label: 'Score', value: player.getScore() },
                    { label: 'Cities', value: player.cities.length },
                    { label: 'Units', value: player.units.length },
                    { label: 'Technologies', value: player.technology.researched.length },
                    { label: 'Gold', value: player.gold }
                ];
                
                for (const stat of stats) {
                    const row = document.createElement('div');
                    row.className = 'agent-stat-row';
                    
                    const label = document.createElement('span');
                    label.textContent = stat.label;
                    
                    const value = document.createElement('span');
                    value.textContent = stat.value;
                    
                    row.appendChild(label);
                    row.appendChild(value);
                    playerItem.appendChild(row);
                }
                
                playerComparison.appendChild(playerItem);
            }
            
            playerSection.appendChild(playerComparison);
            this.container.appendChild(playerSection);
        }
    }
    
    update() {
        this.render();
    }
}