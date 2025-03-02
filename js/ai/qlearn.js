class QLearningAgent extends AIAgent {
    constructor(config = {}) {
        super(config);
        this.type = 'qlearn';
        this.name = config.name || 'Q-Learning Agent';
        this.description = config.description || 'Uses Q-Learning algorithm to improve decision making';
        
        // Q-learning parameters
        this.alpha = config.alpha !== undefined ? config.alpha : 0.1;  // Learning rate
        this.gamma = config.gamma !== undefined ? config.gamma : 0.9;  // Discount factor
        this.epsilon = config.epsilon !== undefined ? config.epsilon : 0.2; // Exploration rate
        
        // Q-table: maps state-action pairs to values
        this.qTable = new Map();
        
        // Reward system
        this.rewardSystem = new RewardSystem(config.rewards);
        
        // Memory of recent states, actions, and rewards
        this.memory = [];
        this.memorySize = config.memorySize || 1000;
        
        // Additional stats
        this.stats.explorations = 0;
        this.stats.exploitations = 0;
        this.stats.rewards = [];
        this.stats.qValueUpdates = 0;
    }
    
    setHyperParameters(params = {}) {
        if (params.alpha !== undefined) this.alpha = params.alpha;
        if (params.gamma !== undefined) this.gamma = params.gamma;
        if (params.epsilon !== undefined) this.epsilon = params.epsilon;
        if (params.memorySize !== undefined) this.memorySize = params.memorySize;
    }
    
    getStateRepresentation() {
        if (!this.player) return null;
        
        // Create a simplified representation of game state
        const state = {
            cities: this.player.cities.length,
            units: this.player.units.length,
            tech: this.player.technology.researched.length,
            gold: Math.floor(this.player.gold / 50) * 50, // Bucket gold values
            turn: Math.floor(this.player.stats.turnsPlayed / 10) * 10 // Bucket turn numbers
        };
        
        // Convert to string for use as a key
        return JSON.stringify(state);
    }
    
    getQValue(state, action) {
        const key = `${state}|${JSON.stringify(action)}`;
        return this.qTable.get(key) || 0;
    }
    
    setQValue(state, action, value) {
        const key = `${state}|${JSON.stringify(action)}`;
        this.qTable.set(key, value);
        this.stats.qValueUpdates++;
    }
    
    chooseAction(state, possibleActions) {
        // Epsilon-greedy policy
        if (Math.random() < this.epsilon) {
            // Exploration: choose random action
            this.stats.explorations++;
            return possibleActions[Math.floor(Math.random() * possibleActions.length)];
        } else {
            // Exploitation: choose best action according to Q-table
            this.stats.exploitations++;
            
            // Find action with highest Q-value
            let bestAction = null;
            let bestValue = -Infinity;
            
            for (const action of possibleActions) {
                const value = this.getQValue(state, action);
                if (value > bestValue) {
                    bestValue = value;
                    bestAction = action;
                }
            }
            
            if (bestAction === null) {
                // If no best action found, choose randomly
                return possibleActions[Math.floor(Math.random() * possibleActions.length)];
            }
            
            return bestAction;
        }
    }
    
    makeDecisions() {
        if (!this.player) return [];
        
        const state = this.getStateRepresentation();
        const decisions = [];
        
        // Research decision
        if (!this.player.currentResearch) {
            const options = this.player.technology.getResearchOptions();
            if (options.length > 0) {
                const possibleActions = options.map(tech => ({
                    type: 'research',
                    technology: tech
                }));
                
                const action = this.chooseAction(state + '|research', possibleActions);
                decisions.push(action);
            }
        }
        
        // City production
        for (const city of this.player.cities) {
            if (!city.currentProduction) {
                const cityState = state + `|city${city.id}`;
                const possibleActions = this.getProductionOptions(city).map(item => ({
                    type: 'production',
                    cityId: city.id,
                    item: item
                }));
                
                if (possibleActions.length > 0) {
                    const action = this.chooseAction(cityState, possibleActions);
                    decisions.push(action);
                }
            }
        }
        
        // Unit movement
        for (const unit of this.player.units) {
            if (unit.canMove) {
                const unitState = state + `|unit${unit.id}`;
                const possibleActions = this.getUnitActions(unit);
                
                if (possibleActions.length > 0) {
                    const action = this.chooseAction(unitState, possibleActions);
                    decisions.push(action);
                }
            }
        }
        
        // Save state and actions for learning
        this.memory.push({
            state: state,
            actions: decisions,
            rewards: []
        });
        
        // Keep memory size limited
        if (this.memory.length > this.memorySize) {
            this.memory.shift();
        }
        
        this.stats.decisions += decisions.length;
        this.stats.turnsPlayed++;
        
        return decisions;
    }
    
    getProductionOptions(city) {
        const options = [];
        
        // Buildings that can be built
        const buildings = ['granary', 'workshop', 'market', 'library', 'temple', 'barracks', 'walls'];
        for (const building of buildings) {
            if (city.canBuildBuilding(building)) {
                options.push({
                    type: 'building',
                    id: building
                });
            }
        }
        
        // Units that can be built
        const units = ['settler', 'warrior', 'archer', 'spearman', 'horseman', 'swordsman'];
        for (const unit of units) {
            if (city.canBuildUnit(unit)) {
                options.push({
                    type: 'unit',
                    id: unit
                });
            }
        }
        
        return options;
    }
    
    getUnitActions(unit) {
        if (!this.player.game) return [];
        
        const actions = [];
        const game = this.player.game;
        const map = game.map;
        
        // Settler actions
        if (unit.type === 'settler') {
            const tile = map.getTileAt(unit.location.x, unit.location.y);
            if (tile && tile.type !== 'ocean' && tile.type !== 'mountains' && !tile.city) {
                actions.push({
                    type: 'settle',
                    unitId: unit.id
                });
            }
        }
        
        // Worker actions
        if (unit.type === 'worker') {
            const tile = map.getTileAt(unit.location.x, unit.location.y);
            if (tile && !tile.improvement) {
                const possibleImprovements = [];
                if (tile.type === 'grassland' || tile.type === 'plains') {
                    possibleImprovements.push('farm');
                }
                if (tile.type === 'hills' || tile.type === 'plains' || tile.type === 'desert') {
                    possibleImprovements.push('mine');
                }
                
                for (const improvement of possibleImprovements) {
                    actions.push({
                        type: 'build',
                        unitId: unit.id,
                        improvement: improvement
                    });
                }
            }
        }
        
        // Attack actions
        if (unit.canAttack()) {
            // Find enemy units in attack range
            for (const player of game.players) {
                if (player !== this.player) {
                    for (const enemyUnit of player.units) {
                        const dx = Math.abs(enemyUnit.location.x - unit.location.x);
                        const dy = Math.abs(enemyUnit.location.y - unit.location.y);
                        const distance = Math.max(dx, dy);
                        
                        let attackRange = 1;
                        if (unit.type === 'archer' || unit.type === 'catapult') {
                            attackRange = 2;
                        }
                        
                        if (distance <= attackRange) {
                            actions.push({
                                type: 'attack',
                                unitId: unit.id,
                                targetId: enemyUnit.id,
                                targetType: 'unit'
                            });
                        }
                    }
                    
                    // Check for enemy cities to attack
                    for (const enemyCity of player.cities) {
                        const dx = Math.abs(enemyCity.location.x - unit.location.x);
                        const dy = Math.abs(enemyCity.location.y - unit.location.y);
                        const distance = Math.max(dx, dy);
                        
                        if (distance <= 1) { // Can only attack adjacent cities
                            actions.push({
                                type: 'attack',
                                unitId: unit.id,
                                targetId: enemyCity.id,
                                targetType: 'city'
                            });
                        }
                    }
                }
            }
        }
        
        // Movement actions
        const possibleMoves = this.getPossibleMoves(unit);
        for (const destination of possibleMoves) {
            actions.push({
                type: 'move',
                unitId: unit.id,
                destination: destination
            });
        }
        
        return actions;
    }
    
    onTurnEnd() {
        super.onTurnEnd();
        
        // Calculate rewards for the turn
        const rewards = this.rewardSystem.calculateRewards(this.player);
        
        // Add rewards to the latest memory entry
        if (this.memory.length > 0) {
            this.memory[this.memory.length - 1].rewards = rewards;
        }
        
        // Store rewards for stats
        this.stats.rewards.push({
            turn: this.stats.turnsPlayed,
            total: rewards.reduce((sum, r) => sum + r.value, 0),
            breakdown: rewards.map(r => ({ 
                type: r.type, 
                value: r.value 
            }))
        });
        
        // Learn from recent experience
        this.learn();
    }
    
    learn() {
        // Skip if not enough memory
        if (this.memory.length < 2) return;
        
        const latest = this.memory[this.memory.length - 1];
        const previous = this.memory[this.memory.length - 2];
        
        const totalReward = latest.rewards.reduce((sum, r) => sum + r.value, 0);
        
        // Update Q-values for actions taken in the previous state
        for (const action of previous.actions) {
            const oldValue = this.getQValue(previous.state, action);
            
            // Estimate maximum future value
            let maxFutureValue = 0;
            if (latest.actions.length > 0) {
                maxFutureValue = Math.max(
                    ...latest.actions.map(a => this.getQValue(latest.state, a))
                );
            }
            
            // Q-learning update formula: Q(s,a) = Q(s,a) + alpha * (reward + gamma * max_a' Q(s',a') - Q(s,a))
            const newValue = oldValue + this.alpha * (totalReward + this.gamma * maxFutureValue - oldValue);
            
            this.setQValue(previous.state, action, newValue);
        }
    }
    
    learnFromGameResult(isWinner, gameStats) {
        // Apply large final reward/penalty based on game outcome
        const finalReward = isWinner ? 100 : -50;
        
        // Apply to most recent actions in memory
        const learningDepth = Math.min(this.memory.length, 10); // Learn from last 10 turns
        
        for (let i = 1; i <= learningDepth; i++) {
            if (this.memory.length >= i) {
                const memoryIndex = this.memory.length - i;
                const entry = this.memory[memoryIndex];
                
                // Decay the final reward based on how far back we go
                const decayedReward = finalReward * Math.pow(this.gamma, i - 1);
                
                for (const action of entry.actions) {
                    const oldValue = this.getQValue(entry.state, action);
                    const newValue = oldValue + this.alpha * (decayedReward - oldValue);
                    this.setQValue(entry.state, action, newValue);
                }
            }
        }
        
        // Record win/loss in stats
        if (isWinner) {
            this.stats.gamesWon = (this.stats.gamesWon || 0) + 1;
        } else {
            this.stats.gamesLost = (this.stats.gamesLost || 0) + 1;
        }
        
        // Adjust epsilon (exploration rate) based on experience
        const totalGames = (this.stats.gamesWon || 0) + (this.stats.gamesLost || 0);
        if (totalGames > 0) {
            // Gradually decrease exploration as agent plays more games
            this.epsilon = Math.max(0.05, 0.3 - (totalGames / 100) * 0.25);
        }
    }
    
    serialize() {
        const baseData = super.serialize();
        
        // Convert qTable to Array for JSON serialization
        const qTableArray = Array.from(this.qTable.entries());
        
        return {
            ...baseData,
            alpha: this.alpha,
            gamma: this.gamma,
            epsilon: this.epsilon,
            qTable: qTableArray,
            rewardSystem: this.rewardSystem.serialize(),
            memorySize: this.memorySize
        };
    }
    
    deserialize(data) {
        super.deserialize(data);
        
        this.alpha = data.alpha;
        this.gamma = data.gamma;
        this.epsilon = data.epsilon;
        this.memorySize = data.memorySize;
        
        // Restore qTable from array
        this.qTable = new Map(data.qTable);
        
        // Restore reward system
        this.rewardSystem = new RewardSystem();
        if (data.rewardSystem) {
            this.rewardSystem.deserialize(data.rewardSystem);
        }
    }
}

