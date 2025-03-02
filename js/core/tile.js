class Tile {
    constructor(props = {}) {
        this.x = props.x || 0;
        this.y = props.y || 0;
        this.type = props.type || 'plains';
        this.elevation = props.elevation || 0.5;
        this.moisture = props.moisture || 0.5;
        this.resource = props.resource || null;
        this.resourceAmount = props.resourceAmount || 10;
        this.improvement = props.improvement || null;
        this.owner = props.owner || null;
        this.worked = props.worked || false;
        this.hasRiver = props.hasRiver || false;
        this.city = null; // Reference to city on this tile, if any
        this.explored = false; // Whether this tile has been explored
        
        // Tile yields
        this.yields = this.calculateBaseYields();
    }
    
    calculateBaseYields() {
        // Base yields for different tile types
        const baseYields = {
            ocean: { food: 1, production: 0, gold: 1, science: 0, culture: 0 },
            grassland: { food: 2, production: 0, gold: 0, science: 0, culture: 0 },
            plains: { food: 1, production: 1, gold: 0, science: 0, culture: 0 },
            desert: { food: 0, production: 0, gold: 0, science: 0, culture: 0 },
            hills: { food: 0, production: 2, gold: 0, science: 0, culture: 0 },
            mountains: { food: 0, production: 0, gold: 0, science: 0, culture: 0 },
            forest: { food: 1, production: 1, gold: 0, science: 0, culture: 0 }
        };
        
        // Start with base yields
        const yields = {...baseYields[this.type]};
        
        // Add river bonus
        if (this.hasRiver) {
            yields.food += 1;
            yields.gold += 1;
        }
        
        // Add resource bonus
        if (this.resource) {
            const resourceBonuses = {
                fish: { food: 1 },
                whales: { food: 1, gold: 1 },
                cattle: { food: 1 },
                wheat: { food: 2 },
                horses: { production: 1 },
                iron: { production: 2 },
                coal: { production: 2 },
                oil: { production: 3 },
                gold: { gold: 2 },
                silver: { gold: 1 },
                gems: { gold: 3 },
                game: { food: 1 },
                furs: { gold: 1 }
            };
            
            const bonus = resourceBonuses[this.resource] || {};
            for (const [key, value] of Object.entries(bonus)) {
                yields[key] += value;
            }
        }
        
        return yields;
    }
    
    getYields() {
        // Start with base yields
        const yields = {...this.yields};
        
        // Add improvement bonuses
        if (this.improvement) {
            const improvementBonuses = {
                farm: { food: 1 },
                mine: { production: 1 },
                plantation: { gold: 1 },
                camp: { food: 1, production: 1 },
                pasture: { food: 1 },
                quarry: { production: 2 },
                fishing: { food: 2 },
                oil_well: { production: 3 }
            };
            
            const bonus = improvementBonuses[this.improvement] || {};
            for (const [key, value] of Object.entries(bonus)) {
                yields[key] += value;
            }
        }
        
        return yields;
    }
    
    canBuildImprovement(improvement) {
        // Check if an improvement can be built on this tile
        const validImprovements = {
            ocean: ['fishing'],
            grassland: ['farm', 'plantation', 'pasture'],
            plains: ['farm', 'mine', 'plantation', 'pasture'],
            desert: ['mine', 'oil_well'],
            hills: ['mine', 'quarry'],
            mountains: [],
            forest: ['camp', 'mine']
        };
        
        const allowedImprovements = validImprovements[this.type] || [];
        return allowedImprovements.includes(improvement);
    }
    
    buildImprovement(improvement) {
        if (this.canBuildImprovement(improvement)) {
            this.improvement = improvement;
            return true;
        }
        return false;
    }
    
    clearImprovement() {
        this.improvement = null;
    }
    
    serialize() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            elevation: this.elevation,
            moisture: this.moisture,
            resource: this.resource,
            resourceAmount: this.resourceAmount,
            improvement: this.improvement,
            owner: this.owner ? this.owner.id : null,
            worked: this.worked,
            hasRiver: this.hasRiver,
            city: this.city ? this.city.id : null
        };
    }
    
    deserialize(data) {
        this.x = data.x;
        this.y = data.y;
        this.type = data.type;
        this.elevation = data.elevation;
        this.moisture = data.moisture;
        this.resource = data.resource;
        this.resourceAmount = data.resourceAmount;
        this.improvement = data.improvement;
        this.worked = data.worked;
        this.hasRiver = data.hasRiver;
        
        // owner and city references are connected later
        this.ownerId = data.owner; // Temporary storage
        this.cityId = data.city;   // Temporary storage
        
        this.yields = this.calculateBaseYields();
    }
}