class StatisticsManager {
    constructor() {
        this.gameStats = [];
        this.agentStats = {};
        this.storagePrefix = 'ai-civilization-stats-';
        this.loadStats();
    }
    
    recordGameResult(game) {
        const gameData = {
            timestamp: Date.now(),
            turns: game.turn,
            year: game.year,
            players: game.players.map(player => ({
                id: player.id,
                name: player.name,
                agentType: player.agent ? player.agent.type : null,
                agentId: player.agent ? player.agent.id : null,
                score: player.getScore(),
                isWinner: player === game.winner
            })),
            mapSize: { width: game.map.width, height: game.map.height },
            aiDecisions: game.stats.aiDecisions
        };
        
        this.gameStats.push(gameData);
        
        // Update agent stats
        for (const player of game.players) {
            if (player.agent) {
                const agentId = player.agent.id;
                
                if (!this.agentStats[agentId]) {
                    this.agentStats[agentId] = {
                        id: agentId,
                        name: player.agent.name,
                        type: player.agent.type,
                        gamesPlayed: 0,
                        wins: 0,
                        highScore: 0,
                        totalScore: 0,
                        history: []
                    };
                }
                
                const stats = this.agentStats[agentId];
                stats.gamesPlayed++;
                stats.name = player.agent.name; // Update in case name changed
                
                if (player === game.winner) {
                    stats.wins++;
                }
                
                const score = player.getScore();
                stats.totalScore += score;
                stats.highScore = Math.max(stats.highScore, score);
                
                // Add to history
                stats.history.push({
                    timestamp: Date.now(),
                    score: score,
                    isWinner: player === game.winner,
                    turns: game.turn
                });
            }
        }
        
        this.saveStats();
    }
    
    getAgentStats(agentId) {
        return this.agentStats[agentId] || null;
    }
    
    getAllAgentStats() {
        return Object.values(this.agentStats);
    }
    
    getGameHistory(limit = 10) {
        return this.gameStats.slice(-limit);
    }
    
    saveStats() {
        try {
            localStorage.setItem(`${this.storagePrefix}games`, JSON.stringify(this.gameStats));
            localStorage.setItem(`${this.storagePrefix}agents`, JSON.stringify(this.agentStats));
        } catch (err) {
            console.error('Error saving statistics:', err);
        }
    }
    
    loadStats() {
        try {
            const gameStats = localStorage.getItem(`${this.storagePrefix}games`);
            if (gameStats) {
                this.gameStats = JSON.parse(gameStats);
            }
            
            const agentStats = localStorage.getItem(`${this.storagePrefix}agents`);
            if (agentStats) {
                this.agentStats = JSON.parse(agentStats);
            }
        } catch (err) {
            console.error('Error loading statistics:', err);
            this.gameStats = [];
            this.agentStats = {};
        }
    }
    
    clearStats() {
        this.gameStats = [];
        this.agentStats = {};
        this.saveStats();
    }
}