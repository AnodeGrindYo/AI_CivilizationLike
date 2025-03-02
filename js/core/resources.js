class ResourceManager {
    constructor() {
        this.resources = this.initResources();
    }
    
    initResources() {
        // Define resources with their properties
        return {
            // Strategic resources
            'horses': { type: 'strategic', rarity: 'common', provides: 'cavalry' },
            'iron': { type: 'strategic', rarity: 'common', provides: 'weapons' },
            'coal': { type: 'strategic', rarity: 'uncommon', provides: 'production' },
            'oil': { type: 'strategic', rarity: 'uncommon', provides: 'production' },
            
            // Luxury resources
            'gold': { type: 'luxury', rarity: 'rare', provides: 'gold' },
            'silver': { type: 'luxury', rarity: 'uncommon', provides: 'gold' },
            'gems': { type: 'luxury', rarity: 'rare', provides: 'happiness' },
            'furs': { type: 'luxury', rarity: 'uncommon', provides: 'happiness' },
            
            // Bonus resources
            'fish': { type: 'bonus', rarity: 'common', provides: 'food' },
            'whales': { type: 'bonus', rarity: 'uncommon', provides: 'food' },
            'cattle': { type: 'bonus', rarity: 'common', provides: 'food' },
            'wheat': { type: 'bonus', rarity: 'common', provides: 'food' },
            'game': { type: 'bonus', rarity: 'common', provides: 'food' }
        };
    }
    
    getResourceType(resource) {
        if (!this.resources[resource]) return null;
        return this.resources[resource].type;
    }
    
    getResourceRarity(resource) {
        if (!this.resources[resource]) return null;
        return this.resources[resource].rarity;
    }
    
    getResourceProvides(resource) {
        if (!this.resources[resource]) return null;
        return this.resources[resource].provides;
    }
    
    getResourcesByType(type) {
        const result = [];
        for (const [key, data] of Object.entries(this.resources)) {
            if (data.type === type) {
                result.push(key);
            }
        }
        return result;
    }
    
    getLuxuryResources() {
        return this.getResourcesByType('luxury');
    }
    
    getStrategicResources() {
        return this.getResourcesByType('strategic');
    }
    
    getBonusResources() {
        return this.getResourcesByType('bonus');
    }
}

