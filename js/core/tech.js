class TechnologyTree {
    constructor() {
        this.researched = [];
        this.technologies = this.initTechnologies();
    }
    
    initTechnologies() {
        // Define technologies with their prerequisites and costs
        return {
            // Ancient era
            'agriculture': { prerequisites: [], cost: 20, era: 'ancient' },
            'pottery': { prerequisites: ['agriculture'], cost: 35, era: 'ancient' },
            'animal_husbandry': { prerequisites: ['agriculture'], cost: 35, era: 'ancient' },
            'archery': { prerequisites: ['agriculture'], cost: 35, era: 'ancient' },
            'mining': { prerequisites: ['agriculture'], cost: 35, era: 'ancient' },
            'sailing': { prerequisites: ['pottery'], cost: 55, era: 'ancient' },
            'writing': { prerequisites: ['pottery'], cost: 55, era: 'ancient' },
            'trapping': { prerequisites: ['animal_husbandry'], cost: 55, era: 'ancient' },
            'masonry': { prerequisites: ['mining'], cost: 55, era: 'ancient' },
            'bronze_working': { prerequisites: ['mining'], cost: 55, era: 'ancient' },
            
            // Classical era
            'calendar': { prerequisites: ['writing'], cost: 70, era: 'classical' },
            'mathematics': { prerequisites: ['writing'], cost: 70, era: 'classical' },
            'construction': { prerequisites: ['masonry'], cost: 100, era: 'classical' },
            'currency': { prerequisites: ['mathematics'], cost: 120, era: 'classical' },
            'iron_working': { prerequisites: ['bronze_working'], cost: 120, era: 'classical' },
            'horseback_riding': { prerequisites: ['animal_husbandry'], cost: 120, era: 'classical' },
            
            // Medieval era
            'civil_service': { prerequisites: ['currency', 'writing'], cost: 250, era: 'medieval' },
            'theology': { prerequisites: ['calendar'], cost: 250, era: 'medieval' },
            'machinery': { prerequisites: ['construction'], cost: 250, era: 'medieval' },
            'education': { prerequisites: ['theology'], cost: 300, era: 'medieval' },
            'steel': { prerequisites: ['iron_working'], cost: 300, era: 'medieval' },
            
            // Renaissance era
            'physics': { prerequisites: ['machinery', 'mathematics'], cost: 450, era: 'renaissance' },
            'printing_press': { prerequisites: ['education'], cost: 450, era: 'renaissance' },
            'astronomy': { prerequisites: ['education'], cost: 450, era: 'renaissance' },
            'gunpowder': { prerequisites: ['physics', 'steel'], cost: 500, era: 'renaissance' },
            'metallurgy': { prerequisites: ['gunpowder'], cost: 500, era: 'renaissance' }
        };
    }
    
    getResearchOptions() {
        // Get list of technologies that can be researched now
        const options = [];
        
        for (const [tech, data] of Object.entries(this.technologies)) {
            if (!this.researched.includes(tech) && this.canResearch(tech)) {
                options.push(tech);
            }
        }
        
        return options;
    }
    
    canResearch(technology) {
        // Check if this technology can be researched
        if (!this.technologies[technology] || this.researched.includes(technology)) {
            return false;
        }
        
        // Check prerequisites
        const prerequisites = this.technologies[technology].prerequisites;
        return prerequisites.every(prereq => this.researched.includes(prereq));
    }
    
    getResearchCost(technology) {
        // Get the cost to research this technology
        if (!this.technologies[technology]) {
            return Infinity;
        }
        
        return this.technologies[technology].cost;
    }
    
    completeResearch(technology) {
        if (this.canResearch(technology) && !this.researched.includes(technology)) {
            this.researched.push(technology);
            return true;
        }
        return false;
    }
    
    getTechnologyEra(technology) {
        if (!this.technologies[technology]) {
            return null;
        }
        
        return this.technologies[technology].era;
    }
    
    getTechnologyLevel(technology) {
        // Calculate how "deep" this technology is in the tree
        if (!this.technologies[technology]) {
            return 0;
        }
        
        const getLevel = (tech, visited = new Set()) => {
            if (visited.has(tech)) return 0; // Avoid cycles
            visited.add(tech);
            
            const prereqs = this.technologies[tech].prerequisites;
            if (prereqs.length === 0) return 1;
            
            return 1 + Math.max(...prereqs.map(p => getLevel(p, visited)));
        };
        
        return getLevel(technology);
    }
    
    getTechsByEra() {
        // Group technologies by era
        const byEra = {};
        
        for (const [tech, data] of Object.entries(this.technologies)) {
            const era = data.era;
            if (!byEra[era]) {
                byEra[era] = [];
            }
            byEra[era].push(tech);
        }
        
        return byEra;
    }
    
    serialize() {
        return {
            researched: this.researched
        };
    }
    
    deserialize(data) {
        this.researched = data.researched;
        // Technologies are recreated in constructor
    }
}

