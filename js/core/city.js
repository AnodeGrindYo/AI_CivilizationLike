class City {
    constructor(props = {}) {
        this.id = props.id || uuid.v4();
        this.name = props.name || 'Unnamed City';
        this.owner = props.owner || null;
        this.location = props.location || { x: 0, y: 0 };
        this.population = props.population || 1;
        this.food = props.food || 0;
        this.foodRequired = this.calculateFoodRequired();
        this.buildings = props.buildings || [];
        this.workedTiles = props.workedTiles || [];
        this.productionQueue = props.productionQueue || [];
        this.currentProduction = props.currentProduction || null;
        this.productionProgress = props.productionProgress || 0;
        this.health = props.health || 100;
        this.defense = props.defense || 10;
        this.happiness = props.happiness || 50;
        
        // Production and science output
        this.yields = {
            food: 0,
            production: 0,
            gold: 0,
            science: 0,
            culture: 0
        };
        
        this.calculateYields();
    }
    
    calculateFoodRequired() {
        // Food required for next population point
        return Math.floor(15 * Math.pow(1.1, this.population - 1));
    }
    
    calculateYields() {
        // Reset yields
        this.yields = {
            food: 0,
            production: 0,
            gold: 0,
            science: 0,
            culture: 0
        };
        
        // Get yields from worked tiles
        if (this.owner && this.owner.game) {
            const map = this.owner.game.map;
            
            // First, get the city center tile
            const cityTile = map.getTileAt(this.location.x, this.location.y);
            if (cityTile) {
                const cityBaseYields = {
                    food: 2,
                    production: 2,
                    gold: 2,
                    science: 1,
                    culture: 1
                };
                
                for (const [resource, value] of Object.entries(cityBaseYields)) {
                    this.yields[resource] += value;
                }
            }
            
            // Then get worked tiles
            for (const tileCoord of this.workedTiles) {
                const tile = map.getTileAt(tileCoord.x, tileCoord.y);
                if (tile) {
                    const tileYields = tile.getYields();
                    for (const [resource, value] of Object.entries(tileYields)) {
                        this.yields[resource] += value;
                    }
                }
            }
            
            // Add building bonuses
            for (const building of this.buildings) {
                const buildingBonuses = this.getBuildingBonuses(building);
                for (const [resource, value] of Object.entries(buildingBonuses)) {
                    this.yields[resource] += value;
                }
            }
            
            // Apply population-based science
            this.yields.science += this.population;
            
            // Apply happiness effects
            const happinessModifier = this.happiness / 50; // 1.0 at 50 happiness
            this.yields.food *= happinessModifier;
            this.yields.production *= happinessModifier;
        }
    }
    
    getBuildingBonuses(building) {
        // Building yield bonuses
        const buildingBonuses = {
            granary: { food: 2 },
            workshop: { production: 2 },
            market: { gold: 3 },
            library: { science: 3 },
            temple: { culture: 3 },
            barracks: {}, // Military bonuses handled separately
            walls: {},    // Defense bonuses handled separately
            university: { science: 5 },
            bank: { gold: 5 },
            cathedral: { culture: 5 },
            factory: { production: 4 },
            power_plant: { production: 6 },
            aqueduct: { food: 4 },
            hospital: { food: 3 },
            research_lab: { science: 8 },
            stock_exchange: { gold: 8 },
            courthouse: { gold: 2 },
            palace: { culture: 4, science: 2, gold: 2, production: 2 },
            colosseum: { happiness: 10 }
        };
        
        return buildingBonuses[building] || {};
    }
    
    getBuildingEffects(building) {
        // Special building effects
        const buildingEffects = {
            granary: { foodStorage: 15 },
            barracks: { unitProduction: 25, defense: 10 },
            walls: { defense: 50 }
        };
        
        return buildingEffects[building] || {};
    }
    
    canBuildBuilding(building) {
        // Check if prerequisites are met
        const prerequisites = {
            granary: [],
            workshop: [],
            market: [],
            library: [],
            temple: [],
            barracks: [],
            walls: [],
            aqueduct: ['granary'],
            university: ['library'],
            bank: ['market'],
            factory: ['workshop']
        };
        
        const required = prerequisites[building] || [];
        
        // Check we have all prerequisites
        for (const req of required) {
            if (!this.buildings.includes(req)) {
                return false;
            }
        }
        
        // Check we don't already have it
        return !this.buildings.includes(building);
    }
    
    buildBuilding(building) {
        if (this.canBuildBuilding(building)) {
            this.buildings.push(building);
            
            // Apply effects
            const effects = this.getBuildingEffects(building);
            if (effects.defense) {
                this.defense += effects.defense;
            }
            
            // Recalculate yields
            this.calculateYields();
            
            return true;
        }
        return false;
    }
    
    canBuildUnit(unitType) {
        // Check if prerequisites are met and enough resources available
        const prerequisites = {
            settler: [],
            warrior: [],
            archer: [],
            spearman: [],
            horseman: ['horses'],
            swordsman: ['iron'],
            catapult: []
        };
        
        const required = prerequisites[unitType] || [];
        
        // Check for required resources
        for (const resource of required) {
            if (!this.owner.hasResource(resource)) {
                return false;
            }
        }
        
        return true;
    }
    
    addToProductionQueue(item) {
        if (item.type === 'building' && !this.canBuildBuilding(item.id)) {
            return false;
        }
        
        if (item.type === 'unit' && !this.canBuildUnit(item.id)) {
            return false;
        }
        
        this.productionQueue.push(item);
        
        if (!this.currentProduction) {
            this.currentProduction = this.productionQueue.shift();
            this.productionProgress = 0;
        }
        
        return true;
    }
    
    update() {
        // Apply food growth
        this.food += this.yields.food;
        
        // Check for population growth
        if (this.food >= this.foodRequired) {
            this.food -= this.foodRequired;
            this.population++;
            this.foodRequired = this.calculateFoodRequired();
            
            // Auto-assign new citizen to work a tile
            this.assignWorker();
            
            // Recalculate yields with new population
            this.calculateYields();
        }
        
        // Handle production
        if (this.currentProduction) {
            this.productionProgress += this.yields.production;
            
            const cost = this.getProductionCost(this.currentProduction);
            
            if (this.productionProgress >= cost) {
                // Complete production
                this.completeProduction();
                
                // Start next item in queue
                if (this.productionQueue.length > 0) {
                    this.currentProduction = this.productionQueue.shift();
                    this.productionProgress = 0;
                } else {
                    this.currentProduction = null;
                    this.productionProgress = 0;
                }
            }
        }
        
        // Update happiness based on various factors
        this.updateHappiness();
    }
    
    getProductionCost(item) {
        const baseCosts = {
            // Buildings
            granary: 40,
            workshop: 60,
            market: 80,
            library: 80,
            temple: 70,
            barracks: 50,
            walls: 100,
            
            // Units
            settler: 80,
            warrior: 40,
            archer: 50,
            spearman: 50,
            horseman: 70,
            swordsman: 80,
            catapult: 100
        };
        
        return baseCosts[item.id] || 50;
    }
    
    completeProduction() {
        if (!this.currentProduction || !this.owner) return;
        
        if (this.currentProduction.type === 'building') {
            this.buildBuilding(this.currentProduction.id);
        } else if (this.currentProduction.type === 'unit') {
            const unit = this.owner.createUnit(this.currentProduction.id, this.location);
            
            if (this.owner.game) {
                this.owner.game.map.placeUnit(unit);
                
                // Add event for unit creation for UI update
                this.owner.game.addGameEvent('unitCreated', {
                    playerName: this.owner.name,
                    playerColor: this.owner.color,
                    unitType: this.currentProduction.id,
                    location: this.location
                });
            }
        }
        
        if (this.owner.onProductionComplete) {
            this.owner.onProductionComplete(this, this.currentProduction);
        }
    }
    
    updateHappiness() {
        // Base happiness
        let happiness = 50;
        
        // Population penalty
        happiness -= Math.max(0, this.population - 3) * 5;
        
        // Buildings bonus
        if (this.buildings.includes('temple')) happiness += 10;
        if (this.buildings.includes('market')) happiness += 5;
        
        // Luxury resources bonus
        const luxuryResources = ['gems', 'gold', 'silver', 'furs'];
        if (this.owner) {
            for (const resource of luxuryResources) {
                if (this.owner.hasResource(resource)) {
                    happiness += 5;
                }
            }
        }
        
        // Clamp value
        this.happiness = Math.max(10, Math.min(100, happiness));
    }
    
    assignWorker() {
        // Find best tile to work that's not already being worked
        if (!this.owner || !this.owner.game) return;
        
        const map = this.owner.game.map;
        const cityRadius = 3; // Work tiles up to 3 spaces away
        
        let bestTile = null;
        let bestScore = -1;
        
        // Check tiles in the city radius
        for (let dy = -cityRadius; dy <= cityRadius; dy++) {
            for (let dx = -cityRadius; dx <= cityRadius; dx++) {
                const x = this.location.x + dx;
                const y = this.location.y + dy;
                
                // Skip center tile (already counted as city center)
                if (dx === 0 && dy === 0) continue;
                
                // Skip if outside of bounds
                if (x < 0 || x >= map.width || y < 0 || y >= map.height) continue;
                
                // Skip if already worked
                const alreadyWorked = this.workedTiles.some(
                    tile => tile.x === x && tile.y === y
                );
                
                if (alreadyWorked) continue;
                
                // Get tile and calculate value
                const tile = map.getTileAt(x, y);
                if (tile && tile.type !== 'mountains') {
                    const yields = tile.getYields();
                    
                    // Simple scoring based on yields
                    let score = yields.food * 2 + yields.production * 1.5 + yields.gold;
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestTile = { x, y };
                    }
                }
            }
        }
        
        if (bestTile) {
            this.workedTiles.push(bestTile);
            const tile = map.getTileAt(bestTile.x, bestTile.y);
            if (tile) {
                tile.worked = true;
                tile.owner = this.owner;
            }
        }
    }
    
    canAttack() {
        return this.defense > 0;
    }
    
    takeDamage(amount) {
        this.defense -= amount;
        
        if (this.defense <= 0) {
            return true; // City can be captured
        }
        
        return false;
    }
    
    capture(newOwner) {
        if (this.owner) {
            // Remove from previous owner
            const index = this.owner.cities.findIndex(city => city.id === this.id);
            if (index !== -1) {
                this.owner.cities.splice(index, 1);
            }
        }
        
        // Assign to new owner
        this.owner = newOwner;
        if (newOwner) {
            newOwner.cities.push(this);
            
            // Population penalty on capture
            this.population = Math.max(1, Math.floor(this.population * 0.7));
            
            // Reset defense
            this.defense = 10;
            
            // Happiness penalty
            this.happiness = Math.max(10, this.happiness - 20);
            
            // Cancel production
            this.currentProduction = null;
            this.productionProgress = 0;
            this.productionQueue = [];
            
            // Recalculate yields
            this.calculateYields();
        }
        
        return true;
    }
    
    serialize() {
        return {
            id: this.id,
            name: this.name,
            owner: this.owner ? this.owner.id : null,
            location: this.location,
            population: this.population,
            food: this.food,
            foodRequired: this.foodRequired,
            buildings: this.buildings,
            workedTiles: this.workedTiles,
            productionQueue: this.productionQueue,
            currentProduction: this.currentProduction,
            productionProgress: this.productionProgress,
            health: this.health,
            defense: this.defense,
            happiness: this.happiness,
            yields: this.yields
        };
    }
    
    deserialize(data, game) {
        this.id = data.id;
        this.name = data.name;
        this.location = data.location;
        this.population = data.population;
        this.food = data.food;
        this.foodRequired = data.foodRequired;
        this.buildings = data.buildings;
        this.workedTiles = data.workedTiles;
        this.productionQueue = data.productionQueue;
        this.currentProduction = data.currentProduction;
        this.productionProgress = data.productionProgress;
        this.health = data.health;
        this.defense = data.defense;
        this.happiness = data.happiness;
        this.yields = data.yields;
        
        // Owner reference is connected later
        this.ownerId = data.owner;
    }
}