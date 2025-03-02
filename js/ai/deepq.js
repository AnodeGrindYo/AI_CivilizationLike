class DeepQAgent extends AIAgent {
    constructor(config = {}) {
        super(config);
        this.type = 'deepq';
        this.name = config.name || 'Deep Q-Learning Agent';
        this.description = config.description || 'Uses neural networks to learn optimal decision making';
        
        // Deep Q-learning parameters
        this.alpha = config.alpha !== undefined ? config.alpha : 0.001; // Learning rate
        this.gamma = config.gamma !== undefined ? config.gamma : 0.95;  // Discount factor
        this.epsilon = config.epsilon !== undefined ? config.epsilon : 0.1; // Exploration rate
        this.batchSize = config.batchSize || 32;
        
        // Neural network models
        this.models = {
            research: null,
            production: null,
            unitAction: null
        };
        
        // Experience replay buffer
        this.experienceBuffer = [];
        this.bufferSize = config.bufferSize || 1000;
        
        // Reward system
        this.rewardSystem = new RewardSystem(config.rewards);
        
        // Additional stats
        this.stats.explorations = 0;
        this.stats.exploitations = 0;
        this.stats.rewards = [];
        this.stats.trainingEpisodes = 0;
    }
    
    setHyperParameters(params = {}) {
        if (params.alpha !== undefined) this.alpha = params.alpha;
        if (params.gamma !== undefined) this.gamma = params.gamma;
        if (params.epsilon !== undefined) this.epsilon = params.epsilon;
        if (params.batchSize !== undefined) this.batchSize = params.batchSize;
        if (params.bufferSize !== undefined) this.bufferSize = params.bufferSize;
        
        // Re-initialize models if needed
        if (params.networkArchitecture) {
            this.initModels();
        }
    }
    
    initModels() {
        // Initialize separate models for different decision types
        try {
            // Research model
            this.models.research = tf.sequential();
            this.models.research.add(tf.layers.dense({
                units: 32, 
                activation: 'relu', 
                inputShape: [10]
            }));
            this.models.research.add(tf.layers.dense({
                units: 16, 
                activation: 'relu'
            }));
            this.models.research.add(tf.layers.dense({
                units: 5  // Arbitrary output size, will adapt at runtime
            }));
            
            this.models.research.compile({
                optimizer: tf.train.adam(this.alpha),
                loss: 'meanSquaredError'
            });
            
            // Production model
            this.models.production = tf.sequential();
            this.models.production.add(tf.layers.dense({
                units: 32, 
                activation: 'relu', 
                inputShape: [15]
            }));
            this.models.production.add(tf.layers.dense({
                units: 16, 
                activation: 'relu'
            }));
            this.models.production.add(tf.layers.dense({
                units: 12  // Arbitrary output size, will adapt at runtime
            }));
            
            this.models.production.compile({
                optimizer: tf.train.adam(this.alpha),
                loss: 'meanSquaredError'
            });
            
            // Unit action model
            this.models.unitAction = tf.sequential();
            this.models.unitAction.add(tf.layers.dense({
                units: 64, 
                activation: 'relu', 
                inputShape: [20]
            }));
            this.models.unitAction.add(tf.layers.dense({
                units: 32, 
                activation: 'relu'
            }));
            this.models.unitAction.add(tf.layers.dense({
                units: 10  // Arbitrary output size, will adapt at runtime
            }));
            
            this.models.unitAction.compile({
                optimizer: tf.train.adam(this.alpha),
                loss: 'meanSquaredError'
            });
            
        } catch (err) {
            console.error("Error initializing DeepQ models", err);
            
            // Fallback: use null models which will result in random actions
            this.models.research = null;
            this.models.production = null;
            this.models.unitAction = null;
        }
    }
    
    encodeState(state, context = {}) {
        // Convert game state into a numeric feature vector for neural network input
        if (!this.player) return null;
        
        // Base features
        const baseFeatures = [
            this.player.cities.length / 10, // Normalize city count
            this.player.units.length / 20,  // Normalize unit count
            this.player.technology.researched.length / 20, // Normalize tech count
            this.player.gold / 500, // Normalize gold
            this.player.stats.turnsPlayed / 100, // Normalize turn count
            this.player.science / 50, // Normalize science
            this.player.culture / 100 // Normalize culture
        ];
        
        // Context-specific features
        const contextFeatures = [];
        
        if (context.type === 'research') {
            // Add research-specific features
            contextFeatures.push(
                this.player.technology.researched.length / 20,
                (this.player.researchProgress || 0) / 100,
                this.player.science / 50
            );
        } else if (context.type === 'production' && context.city) {
            // Add city-specific features
            const city = context.city;
            contextFeatures.push(
                city.population / 10,
                city.yields.food / 10,
                city.yields.production / 10,
                city.yields.gold / 10,
                city.yields.science / 5,
                city.buildings.length / 10,
                (city.productionProgress || 0) / 100,
                city.health / 100
            );
        } else if (context.type === 'unitAction' && context.unit) {
            // Add unit-specific features
            const unit = context.unit;
            contextFeatures.push(
                unit.health / 100,
                unit.movementPoints / 4,
                unit.experience / 20,
                unit.attackStrength / 20,
                unit.defenseStrength / 20,
                unit.location.x / this.player.game.map.width,
                unit.location.y / this.player.game.map.height,
                unit.canAttack() ? 1 : 0,
                unit.canMove ? 1 : 0,
                unit.canSettleCity() ? 1 : 0,
                unit.canBuildImprovement() ? 1 : 0,
                this.getNearbyEnemyCount(unit) / 5,
                this.getNearbyFriendlyCount(unit) / 5
            );
        }
        
        // Pad or truncate context features to match model input shape
        let padLength = 0;
        if (context.type === 'research') {
            padLength = 3;
        } else if (context.type === 'production') {
            padLength = 8;
        } else if (context.type === 'unitAction') {
            padLength = 13;
        }
        
        while (contextFeatures.length < padLength) {
            contextFeatures.push(0);
        }
        
        // Combine base and context features
        return baseFeatures.concat(contextFeatures.slice(0, padLength));
    }
    
    getNearbyEnemyCount(unit) {
        if (!this.player || !this.player.game) return 0;
        
        let count = 0;
        const range = 3; // Consider units within 3 tiles
        
        for (const player of this.player.game.players) {
            if (player !== this.player) {
                for (const enemyUnit of player.units) {
                    const dx = Math.abs(enemyUnit.location.x - unit.location.x);
                    const dy = Math.abs(enemyUnit.location.y - unit.location.y);
                    if (Math.max(dx, dy) <= range) {
                        count++;
                    }
                }
            }
        }
        
        return count;
    }
    
    getNearbyFriendlyCount(unit) {
        if (!this.player) return 0;
        
        let count = 0;
        const range = 3; // Consider units within 3 tiles
        
        for (const friendlyUnit of this.player.units) {
            if (friendlyUnit.id !== unit.id) {
                const dx = Math.abs(friendlyUnit.location.x - unit.location.x);
                const dy = Math.abs(friendlyUnit.location.y - unit.location.y);
                if (Math.max(dx, dy) <= range) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    encodeAction(action, actionSpace) {
        // Create a one-hot encoded vector for the action
        const actionVector = new Array(actionSpace.length).fill(0);
        const actionIndex = actionSpace.findIndex(a => 
            JSON.stringify(a) === JSON.stringify(action)
        );
        
        if (actionIndex !== -1) {
            actionVector[actionIndex] = 1;
        }
        
        return actionVector;
    }
    
    async predictQValues(state, actionSpace, modelType) {
        if (!this.models[modelType]) {
            // Initialize models if they don't exist
            this.initModels();
            
            // If still not available, return random values
            if (!this.models[modelType]) {
                return actionSpace.map(() => Math.random());
            }
        }
        
        try {
            // Prepare input tensor
            const inputTensor = tf.tensor2d([state]);
            
            // Predict Q-values
            const outputTensor = this.models[modelType].predict(inputTensor);
            const qValues = await outputTensor.data();
            
            // Cleanup tensors
            inputTensor.dispose();
            outputTensor.dispose();
            
            // If action space is larger than model output, pad with random values
            if (actionSpace.length > qValues.length) {
                const padded = Array.from(qValues);
                while (padded.length < actionSpace.length) {
                    padded.push(Math.random());
                }
                return padded;
            }
            
            // Return only values for valid actions
            return Array.from(qValues).slice(0, actionSpace.length);
            
        } catch (err) {
            console.error(`Error predicting Q-values for ${modelType}`, err);
            // Fallback to random values
            return actionSpace.map(() => Math.random());
        }
    }
    
    async chooseActionWithModel(state, actionSpace, modelType, context) {
        // Epsilon-greedy policy
        if (Math.random() < this.epsilon) {
            // Exploration: choose random action
            this.stats.explorations++;
            return actionSpace[Math.floor(Math.random() * actionSpace.length)];
        } else {
            // Exploitation: choose best action according to model
            this.stats.exploitations++;
            
            // Encode state with context
            const encodedState = this.encodeState(state, context);
            
            // Get Q-values for all actions
            const qValues = await this.predictQValues(encodedState, actionSpace, modelType);
            
            // Find action with highest Q-value
            let bestActionIndex = 0;
            let bestValue = qValues[0];
            
            for (let i = 1; i < qValues.length; i++) {
                if (qValues[i] > bestValue) {
                    bestValue = qValues[i];
                    bestActionIndex = i;
                }
            }
            
            return actionSpace[bestActionIndex];
        }
    }
    
    async makeDecisions() {
        if (!this.player) return [];
        
        const decisions = [];
        const state = this.getStateRepresentation();
        
        // Research decision
        if (!this.player.currentResearch) {
            const options = this.player.technology.getResearchOptions();
            if (options.length > 0) {
                const possibleActions = options.map(tech => ({
                    type: 'research',
                    technology: tech
                }));
                
                const action = await this.chooseActionWithModel(
                    state, 
                    possibleActions, 
                    'research',
                    { type: 'research' }
                );
                
                decisions.push(action);
                
                // Store experience for this decision
                this.storeExperience({
                    state: this.encodeState(state, { type: 'research' }),
                    action: this.encodeAction(action, possibleActions),
                    actionType: 'research',
                    reward: 0, // Will be updated later
                    nextState: null // Will be updated later
                });
            }
        }
        
        // City production
        for (const city of this.player.cities) {
            if (!city.currentProduction) {
                const possibleActions = this.getProductionOptions(city).map(item => ({
                    type: 'production',
                    cityId: city.id,
                    item: item
                }));
                
                if (possibleActions.length > 0) {
                    const action = await this.chooseActionWithModel(
                        state, 
                        possibleActions, 
                        'production',
                        { type: 'production', city: city }
                    );
                    
                    decisions.push(action);
                    
                    // Store experience for this decision
                    this.storeExperience({
                        state: this.encodeState(state, { type: 'production', city: city }),
                        action: this.encodeAction(action, possibleActions),
                        actionType: 'production',
                        reward: 0, // Will be updated later
                        nextState: null // Will be updated later
                    });
                }
            }
        }
        
        // Unit movement
        for (const unit of this.player.units) {
            if (unit.canMove) {
                const possibleActions = this.getUnitActions(unit);
                
                if (possibleActions.length > 0) {
                    const action = await this.chooseActionWithModel(
                        state, 
                        possibleActions, 
                        'unitAction',
                        { type: 'unitAction', unit: unit }
                    );
                    
                    decisions.push(action);
                    
                    // Store experience for this decision
                    this.storeExperience({
                        state: this.encodeState(state, { type: 'unitAction', unit: unit }),
                        action: this.encodeAction(action, possibleActions),
                        actionType: 'unitAction',
                        reward: 0, // Will be updated later
                        nextState: null // Will be updated later
                        // No nextState yet as we don't know future state
                    });
                }
            }
        }
        
        this.stats.decisions += decisions.length;
        this.stats.turnsPlayed++;
        
        return decisions;
    }
    
    storeExperience(experience) {
        this.experienceBuffer.push(experience);
        
        // Keep buffer size limited
        if (this.experienceBuffer.length > this.bufferSize) {
            this.experienceBuffer.shift();
        }
    }
    
    getStateRepresentation() {
        if (!this.player) return null;
        
        // Create a representation of game state
        const state = {
            cities: this.player.cities.length,
            units: this.player.units.length,
            tech: this.player.technology.researched.length,
            gold: this.player.gold,
            science: this.player.science,
            culture: this.player.culture,
            turn: this.player.stats.turnsPlayed
        };
        
        return state;
    }
    
    async onTurnEnd() {
        super.onTurnEnd();
        
        // Calculate rewards for the turn
        const rewards = this.rewardSystem.calculateRewards(this.player);
        const totalReward = rewards.reduce((sum, r) => sum + r.value, 0);
        
        // Update experiences with rewards
        for (const exp of this.experienceBuffer) {
            if (exp.reward === 0) { // Only update if not already set
                exp.reward = totalReward;
                
                // Update next state
                const nextState = this.encodeState(
                    this.getStateRepresentation(), 
                    { type: exp.actionType }
                );
                exp.nextState = nextState;
            }
        }
        
        // Store rewards for stats
        this.stats.rewards.push({
            turn: this.stats.turnsPlayed,
            total: totalReward,
            breakdown: rewards.map(r => ({ 
                type: r.type, 
                value: r.value 
            }))
        });
        
        // Learn from experiences
        await this.learn();
    }
    
    async learn() {
        if (this.experienceBuffer.length < this.batchSize) return;
        
        // Group experiences by action type
        const experiencesByType = {
            research: [],
            production: [],
            unitAction: []
        };
        
        for (const exp of this.experienceBuffer) {
            if (exp.actionType && exp.nextState) {
                experiencesByType[exp.actionType].push(exp);
            }
        }
        
        // Train each model separately
        for (const [actionType, experiences] of Object.entries(experiencesByType)) {
            if (experiences.length < 5) continue; // Need enough examples
            
            // Sample batch
            const batchSize = Math.min(this.batchSize, experiences.length);
            const batch = [];
            
            for (let i = 0; i < batchSize; i++) {
                const randomIndex = Math.floor(Math.random() * experiences.length);
                batch.push(experiences[randomIndex]);
            }
            
            await this.trainModel(actionType, batch);
        }
        
        this.stats.trainingEpisodes++;
    }
    
    async trainModel(modelType, batch) {
        if (!this.models[modelType]) return;
        
        try {
            // Prepare input data
            const states = batch.map(exp => exp.state);
            const actions = batch.map(exp => exp.action);
            const rewards = batch.map(exp => exp.reward);
            const nextStates = batch.map(exp => exp.nextState);
            
            // Create input tensor
            const inputTensor = tf.tensor2d(states);
            
            // Get current Q-values for all states
            const currentQTensor = this.models[modelType].predict(inputTensor);
            const currentQ = await currentQTensor.array();
            
            // Get next Q-values for all next states
            const nextInputTensor = tf.tensor2d(nextStates);
            const nextQTensor = this.models[modelType].predict(nextInputTensor);
            const nextQ = await nextQTensor.array();
            
            // Calculate target Q-values using Bellman equation
            const targetQ = currentQ.map((qValues, i) => {
                const actionIndex = actions[i].indexOf(1);
                if (actionIndex === -1) return qValues;
                
                // Find max Q-value for next state
                const maxNextQ = Math.max(...nextQ[i]);
                
                // Target = reward + gamma * max(Q(s',a'))
                const target = rewards[i] + this.gamma * maxNextQ;
                
                // Update only the Q-value for the chosen action
                const newQValues = [...qValues];
                newQValues[actionIndex] = target;
                
                return newQValues;
            });
            
            // Train model
            const targetTensor = tf.tensor2d(targetQ);
            await this.models[modelType].fit(inputTensor, targetTensor, {
                epochs: 1,
                batchSize: batch.length
            });
            
            // Cleanup tensors
            inputTensor.dispose();
            currentQTensor.dispose();
            nextInputTensor.dispose();
            nextQTensor.dispose();
            targetTensor.dispose();
            
        } catch (err) {
            console.error(`Error training ${modelType} model`, err);
        }
    }
    
    async learnFromGameResult(isWinner, gameStats) {
        // Apply large final reward/penalty based on game outcome
        const finalReward = isWinner ? 100 : -50;
        
        // Update all experiences in buffer with this reward
        for (const exp of this.experienceBuffer) {
            exp.reward += finalReward;
        }
        
        // Learn from experiences
        await this.learn();
        
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
        
        // We don't serialize the neural network models directly as they're complex
        // Instead, we'll save the hyperparameters and re-initialize the models when loading
        
        return {
            ...baseData,
            alpha: this.alpha,
            gamma: this.gamma,
            epsilon: this.epsilon,
            batchSize: this.batchSize,
            bufferSize: this.bufferSize,
            rewardSystem: this.rewardSystem.serialize()
        };
    }
    
    deserialize(data) {
        super.deserialize(data);
        
        this.alpha = data.alpha;
        this.gamma = data.gamma;
        this.epsilon = data.epsilon;
        this.batchSize = data.batchSize;
        this.bufferSize = data.bufferSize;
        
        // Initialize models
        this.initModels();
        
        // Restore reward system
        this.rewardSystem = new RewardSystem();
        if (data.rewardSystem) {
            this.rewardSystem.deserialize(data.rewardSystem);
        }
    }
}

