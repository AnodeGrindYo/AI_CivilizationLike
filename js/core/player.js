class Player {
    constructor(name, config = {}) {
        this.id = config.id || uuid.v4();
        this.name = name || 'Player';
        this.color = config.color || '#3498db';
        this.civilization = config.civilization || 'American';
        this.leader = config.leader || 'Abraham Lincoln';
        this.game = null;
        this.agent = null;
        this.cities = [];
        this.units = [];
        this.resources = new Map();
        this.gold = config.gold || 0;
        this.science = config.science || 0;
        this.culture = config.culture || 0;
        this.technology = new TechnologyTree();
        this.currentResearch = null;
        this.researchProgress = 0;
        this.policies = [];
        this.policyProgress = 0;
        this.policyPoints = 0;
        this.government = 'despotism';
        this.visibility = []; // Tiles visible to this player
        this.stats = {
            turnsPlayed: 0,
            citiesBuilt: 0,
            unitsLost: 0,
            unitsTrained: 0,
            technologiesResearched: 0,
            battlesWon: 0,
            battlesLost: 0,
            goldEarned: 0,
            scoreHistory: []
        };
    }
    
    setAgent(agent) {
        this.agent = agent;
        agent.player = this;
    }
    
    addCity(city) {
        city.owner = this;
        this.cities.push(city);
        this.stats.citiesBuilt++;
        return city;
    }
    
    getCityById(cityId) {
        return this.cities.find(city => city.id === cityId);
    }
    
    createUnit(unitType, location) {
        const unit = new Unit({
            type: unitType,
            owner: this,
            location: { ...location }
        });
        
        this.units.push(unit);
        this.stats.unitsTrained++;
        
        return unit;
    }
    
    getUnitById(unitId) {
        return this.units.find(unit => unit.id === unitId);
    }
    
    addResource(resourceType, amount = 1) {
        const current = this.resources.get(resourceType) || 0;
        this.resources.set(resourceType, current + amount);
    }
    
    hasResource(resourceType) {
        return (this.resources.get(resourceType) || 0) > 0;
    }
    
    useResource(resourceType, amount = 1) {
        const current = this.resources.get(resourceType) || 0;
        if (current >= amount) {
            this.resources.set(resourceType, current - amount);
            return true;
        }
        return false;
    }
    
    startResearch(technology) {
        if (!this.technology.canResearch(technology)) {
            return false;
        }
        
        this.currentResearch = technology;
        this.researchProgress = 0;
        return true;
    }
    
    updateResearch() {
        if (!this.currentResearch) return;
        
        const cost = this.technology.getResearchCost(this.currentResearch);
        this.researchProgress += this.getScience();
        
        if (this.researchProgress >= cost) {
            // Complete research
            this.technology.completeResearch(this.currentResearch);
            this.stats.technologiesResearched++;
            
            // Emit event
            if (this.onResearchComplete) {
                this.onResearchComplete(this.currentResearch);
            }
            
            // Find next technology
            this.currentResearch = null;
            this.researchProgress = 0;
            
            // Auto-select next tech if we have an agent
            if (this.agent) {
                const availableTechs = this.technology.getResearchOptions();
                if (availableTechs.length > 0) {
                    // Let agent choose
                    const nextTech = this.agent.chooseTechnology(availableTechs);
                    if (nextTech) {
                        this.startResearch(nextTech);
                    }
                }
            }
        }
    }
    
    setResearch(technology) {
        return this.startResearch(technology);
    }
    
    getScience() {
        let science = 0;
        
        // Science from cities
        for (const city of this.cities) {
            science += city.yields.science;
        }
        
        return Math.floor(science);
    }
    
    updateCulture() {
        let culture = 0;
        
        // Culture from cities
        for (const city of this.cities) {
            culture += city.yields.culture;
        }
        
        this.culture += culture;
        
        // Check for new policies
        const policyRequirement = 25 * Math.pow(1.5, this.policies.length);
        
        if (this.culture >= policyRequirement) {
            this.culture -= policyRequirement;
            this.policyPoints++;
            
            // Notify of new policy point
            if (this.onNewPolicyPoint) {
                this.onNewPolicyPoint(this.policyPoints);
            }
        }
    }
    
    adoptPolicy(policy) {
        if (this.policyPoints <= 0 || this.policies.includes(policy)) {
            return false;
        }
        
        this.policies.push(policy);
        this.policyPoints--;
        
        // Apply policy effects
        this.applyPolicyEffects(policy);
        
        return true;
    }
    
    applyPolicyEffects(policy) {
        // Apply policy specific bonuses
        const policyEffects = {
            'tradition': { cultureBonus: 1.1 },
            'liberty': { cityGrowthBonus: 1.1 },
            'honor': { militaryBonus: 1.1 },
            'piety': { happinessBonus: 1.1 },
            'patronage': { cityStateBonus: 1.2 },
            'commerce': { goldBonus: 1.1 },
            'rationalism': { scienceBonus: 1.1 }
        };
        
        // Store any policy effects for later calculations
        this.policyEffects = { ...this.policyEffects, ...policyEffects[policy] };
    }
    
    calculateIncome() {
        let income = 0;
        
        // Base income
        income += 3;
        
        // Income from cities
        for (const city of this.cities) {
            income += city.yields.gold;
        }
        
        // Maintenance costs - units and cities
        const unitMaintenance = this.units.length * 1;
        const cityMaintenance = this.cities.length * 2;
        
        income -= (unitMaintenance + cityMaintenance);
        
        // Apply commerce policy effect if present
        if (this.policyEffects && this.policyEffects.goldBonus) {
            income = Math.floor(income * this.policyEffects.goldBonus);
        }
        
        return income;
    }
    
    updateGold() {
        const income = this.calculateIncome();
        this.gold += income;
        
        if (income > 0) {
            this.stats.goldEarned += income;
        }
        
        return income;
    }
    
    getScore() {
        let score = 0;
        
        // Cities
        score += this.cities.length * 50;
        
        // Population
        for (const city of this.cities) {
            score += city.population * 10;
        }
        
        // Technologies
        score += this.technology.researched.length * 30;
        
        // Wonders (not implemented here)
        
        // Policies
        score += this.policies.length * 25;
        
        // Military might
        score += this.units.length * 5;
        
        // Gold
        score += Math.floor(this.gold / 10);
        
        return score;
    }
    
    updateStats() {
        this.stats.turnsPlayed++;
        
        // Record score in history
        this.stats.scoreHistory.push({
            turn: this.stats.turnsPlayed,
            score: this.getScore(),
            cities: this.cities.length,
            units: this.units.length,
            technologies: this.technology.researched.length
        });
    }
    
    startTurn() {
        // Reset units for new turn
        for (const unit of this.units) {
            unit.resetForNewTurn();
        }
        
        // Trigger start of turn for agent
        if (this.agent) {
            this.agent.onTurnStart();
        }
    }
    
    endTurn() {
        // Update city production and population
        for (const city of this.cities) {
            city.update();
        }
        
        // Update research progress
        this.updateResearch();
        
        // Update culture progress
        this.updateCulture();
        
        // Update gold
        this.updateGold();
        
        // Update stats
        this.updateStats();
        
        // Trigger end of turn for agent
        if (this.agent) {
            this.agent.onTurnEnd();
        }
    }
    
    addInitialUnits(player, location) {
        // Add some initial units to create more action
        // Warrior
        const warrior = new Unit({
            type: 'warrior',
            owner: player,
            location: {...location, x: location.x + 1}
        });
        player.units.push(warrior);
        if (this.game && this.game.map) {
            this.game.map.placeUnit(warrior);
        }
        
        // Settler
        const settler = new Unit({
            type: 'settler',
            owner: player,
            location: {...location, y: location.y + 1}
        });
        player.units.push(settler);
        if (this.game && this.game.map) {
            this.game.map.placeUnit(settler);
        }
    }
    
    serialize() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            civilization: this.civilization,
            leader: this.leader,
            gold: this.gold,
            science: this.science,
            culture: this.culture,
            currentResearch: this.currentResearch,
            researchProgress: this.researchProgress,
            policies: this.policies,
            policyProgress: this.policyProgress,
            policyPoints: this.policyPoints,
            government: this.government,
            resources: Array.from(this.resources.entries()),
            technology: this.technology.serialize(),
            agent: this.agent ? this.agent.serialize() : null,
            cities: this.cities.map(city => city.serialize()),
            units: this.units.map(unit => unit.serialize()),
            stats: this.stats
        };
    }
    
    deserialize(data, game) {
        this.id = data.id;
        this.name = data.name;
        this.color = data.color;
        this.civilization = data.civilization || 'American';
        this.leader = data.leader || 'Abraham Lincoln';
        this.gold = data.gold;
        this.science = data.science;
        this.culture = data.culture;
        this.currentResearch = data.currentResearch;
        this.researchProgress = data.researchProgress;
        this.policies = data.policies;
        this.policyProgress = data.policyProgress;
        this.policyPoints = data.policyPoints;
        this.government = data.government;
        this.resources = new Map(data.resources);
        this.stats = data.stats;
        this.game = game;
        
        // Deserialize technology
        this.technology = new TechnologyTree();
        this.technology.deserialize(data.technology);
        
        // Deserialize cities
        this.cities = data.cities.map(cityData => {
            const city = new City();
            city.deserialize(cityData, game);
            city.owner = this;
            return city;
        });
        
        // Deserialize units
        this.units = data.units.map(unitData => {
            const unit = new Unit();
            unit.deserialize(unitData);
            unit.owner = this;
            return unit;
        });
        
        // Deserialize agent if exists
        if (data.agent) {
            // Create appropriate agent type based on data
            const agentType = data.agent.type || 'qlearn';
            if (agentType === 'qlearn') {
                this.agent = new QLearningAgent({ player: this });
            } else if (agentType === 'deepq') {
                this.agent = new DeepQAgent({ player: this });
            } else {
                // Default agent
                this.agent = new AIAgent({ player: this });
            }
            this.agent.deserialize(data.agent);
        }
    }
}