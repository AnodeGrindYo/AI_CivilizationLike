class GameMap {
    constructor(width = 32, height = 24) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.units = [];
        this.cities = [];
        this.totalCities = 0;
        this.useHexGrid = true; // Enable hexagonal grid
    }
    
    generate() {
        // Generate a new random map
        this.tiles = [];
        
        // Create noise function for more reliable terrain generation
        const simplex = new SimplexNoise();
        
        // Generate base terrain
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Get noise value at this position
                const nx = x / this.width;
                const ny = y / this.height;
                const elevation = (simplex.noise2D(nx * 3, ny * 3) + 1) / 2;
                const moisture = (simplex.noise2D(nx * 5, ny * 5) + 1) / 2;
                
                // Determine tile type based on elevation and moisture
                let type = 'plains';
                
                if (elevation < 0.3) {
                    type = 'ocean';
                } else if (elevation < 0.4) {
                    type = 'grassland';
                } else if (elevation < 0.7) {
                    if (moisture > 0.6) {
                        type = 'forest';
                    } else if (moisture < 0.3) {
                        type = 'desert';
                    } else {
                        type = 'plains';
                    }
                } else if (elevation < 0.8) {
                    type = 'hills';
                } else {
                    type = 'mountains';
                }
                
                // Create tile with properties
                const tile = new Tile({
                    x: x,
                    y: y,
                    type: type,
                    elevation: elevation,
                    moisture: moisture,
                    explored: false // Start with unexplored tiles
                });
                
                // Add resources with some probability
                if (Math.random() < 0.1 && type !== 'ocean' && type !== 'mountains') {
                    tile.resource = this.getRandomResource(type);
                }
                
                this.tiles.push(tile);
            }
        }
        
        // Add rivers with more straightforward approach
        this.generateRivers();
        
        // Make starting areas explored
        this.exploreStartingAreas();
        
        return this;
    }
    
    // Generate better rivers
    generateRivers() {
        const riverCount = Math.floor(Math.min(this.width, this.height) / 4);
        
        for (let i = 0; i < riverCount; i++) {
            // Pick a random starting point for river source (higher elevation)
            let x = Math.floor(Math.random() * this.width);
            let y = Math.floor(Math.random() * (this.height / 3));
            
            let currentTile = this.getTileAt(x, y);
            if (!currentTile || currentTile.elevation < 0.6) continue; // Only start rivers at higher elevations
            
            const riverPath = [];
            let steps = 0;
            const maxSteps = this.height * 2; // Prevent infinite loops
            
            while (currentTile && steps < maxSteps) {
                currentTile.hasRiver = true;
                riverPath.push({x: currentTile.x, y: currentTile.y});
                
                // Find lowest neighboring tile to flow to
                const neighbors = this.getNeighbors(currentTile);
                let lowestNeighbor = null;
                let lowestElevation = currentTile.elevation;
                
                for (const neighbor of neighbors) {
                    if (neighbor.elevation < lowestElevation && !riverPath.some(p => p.x === neighbor.x && p.y === neighbor.y)) {
                        lowestNeighbor = neighbor;
                        lowestElevation = neighbor.elevation;
                    }
                }
                
                if (!lowestNeighbor) break; // No where to flow
                
                currentTile = lowestNeighbor;
                steps++;
                
                // Stop when reaching ocean
                if (currentTile.type === 'ocean') break;
            }
        }
    }
    
    exploreStartingAreas() {
        // Make sure starting positions are already explored
        const potentialStartSpots = this.tiles.filter(tile => 
            (tile.type === 'grassland' || tile.type === 'plains') && 
            !tile.city && 
            tile.hasRiver
        );
        
        for (const tile of potentialStartSpots) {
            this.exploreTilesAroundLocation({x: tile.x, y: tile.y}, 3);
        }
    }
    
    getRandomResource(tileType) {
        // Return a resource appropriate for the tile type
        const resources = {
            ocean: ['fish', 'whales'],
            grassland: ['cattle', 'wheat', 'horses'],
            plains: ['wheat', 'horses', 'iron'],
            desert: ['oil', 'gold'],
            hills: ['iron', 'coal', 'gold'],
            forest: ['game', 'furs'],
            mountains: ['gold', 'silver', 'gems']
        };
        
        const possibleResources = resources[tileType] || ['none'];
        return possibleResources[Math.floor(Math.random() * possibleResources.length)];
    }
    
    getNeighbors(tile) {
        const neighbors = [];
        const directions = [
            {dx: 0, dy: -1}, // North
            {dx: 1, dy: -1}, // Northeast
            {dx: 1, dy: 0},  // East
            {dx: 1, dy: 1},  // Southeast
            {dx: 0, dy: 1},  // South
            {dx: -1, dy: 1}, // Southwest
            {dx: -1, dy: 0}, // West
            {dx: -1, dy: -1} // Northwest
        ];
        
        for (const dir of directions) {
            const nx = tile.x + dir.dx;
            const ny = tile.y + dir.dy;
            
            // Check bounds
            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                const index = ny * this.width + nx;
                neighbors.push(this.tiles[index]);
            }
        }
        
        return neighbors;
    }
    
    getTileAt(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.tiles[y * this.width + x];
    }
    
    findStartingPosition() {
        // Find a suitable starting position for a new player
        // Prefer grassland or plains away from other players
        
        const suitableTiles = this.tiles.filter(tile => 
            (tile.type === 'grassland' || tile.type === 'plains') && 
            !tile.city && 
            tile.hasRiver
        );
        
        if (suitableTiles.length === 0) {
            // Fallback if no ideal tiles
            return this.tiles.find(tile => 
                tile.type !== 'ocean' && 
                tile.type !== 'mountains' && 
                !tile.city
            );
        }
        
        // Find tile with maximum distance from other cities
        let bestTile = null;
        let maxDistance = -1;
        
        for (const tile of suitableTiles) {
            let minDistance = Number.MAX_VALUE;
            
            for (const city of this.cities) {
                const cityTile = this.getTileAt(city.location.x, city.location.y);
                const distance = this.getDistance(tile, cityTile);
                minDistance = Math.min(minDistance, distance);
            }
            
            if (minDistance > maxDistance) {
                maxDistance = minDistance;
                bestTile = tile;
            }
        }
        
        return bestTile || suitableTiles[0];
    }
    
    getDistance(tileA, tileB) {
        // Add null check to prevent errors
        if (!tileA || !tileB) return Infinity;
        
        const dx = tileA.x - tileB.x;
        const dy = tileA.y - tileB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    placeCity(city) {
        const tile = this.getTileAt(city.location.x, city.location.y);
        if (tile) {
            tile.city = city;
            this.cities.push(city);
            this.totalCities++;
        }
    }
    
    removeCity(city) {
        const tile = this.getTileAt(city.location.x, city.location.y);
        if (tile) {
            tile.city = null;
        }
        
        const index = this.cities.findIndex(c => c.id === city.id);
        if (index !== -1) {
            this.cities.splice(index, 1);
        }
    }
    
    placeUnit(unit) {
        this.units.push(unit);
    }
    
    moveUnit(unit, destination) {
        // Mark tiles as explored around unit's path
        this.exploreTilesAroundLocation(unit.location, 2);
        this.exploreTilesAroundLocation(destination, 2);
        
        unit.location = {...destination};
        
        // Emit event for UI update
        if (this.onUnitMoved) {
            this.onUnitMoved(unit);
        }
    }
    
    exploreTilesAroundLocation(location, radius) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = location.x + dx;
                const y = location.y + dy;
                
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    const tile = this.getTileAt(x, y);
                    if (tile) {
                        tile.explored = true;
                    }
                }
            }
        }
    }
    
    removeUnit(unit) {
        const index = this.units.findIndex(u => u.id === unit.id);
        if (index !== -1) {
            this.units.splice(index, 1);
        }
    }
    
    isValidMove(unit, destination) {
        // Check if destination is within bounds
        if (destination.x < 0 || destination.x >= this.width || 
            destination.y < 0 || destination.y >= this.height) {
            return false;
        }
        
        // Get the destination tile
        const destTile = this.getTileAt(destination.x, destination.y);
        
        // Add null check to prevent errors
        if (!destTile) return false;
        
        // Check if tile is passable for this unit type
        if (unit.type === 'naval' && destTile.type !== 'ocean') {
            return false;
        }
        
        if (unit.type !== 'naval' && destTile.type === 'ocean') {
            return false;
        }
        
        if (unit.type !== 'air' && destTile.type === 'mountains') {
            return false;
        }
        
        // Check for movement range
        const startTile = this.getTileAt(unit.location.x, unit.location.y);
        const distance = this.getDistance(startTile, destTile);
        
        return distance <= unit.movementRange;
    }
    
    update() {
        // Update tile yields, resource depletion, etc.
        for (const tile of this.tiles) {
            // Update resources
            if (tile.resource && tile.worked && Math.random() < 0.01) {
                // 1% chance per turn to deplete a worked resource
                tile.resourceAmount = Math.max(0, tile.resourceAmount - 1);
                if (tile.resourceAmount === 0) {
                    tile.resource = null;
                }
            }
        }
        
        // Process city growth
        for (const city of this.cities) {
            city.update();
        }
    }
    
    serialize() {
        return {
            width: this.width,
            height: this.height,
            tiles: this.tiles.map(tile => tile.serialize()),
            cities: this.cities.map(city => city.id), // Just store IDs, cities are serialized with players
            units: this.units.map(unit => unit.id),   // Just store IDs, units are serialized with players
            totalCities: this.totalCities
        };
    }
    
    deserialize(data) {
        this.width = data.width;
        this.height = data.height;
        this.totalCities = data.totalCities;
        
        // Deserialize tiles
        this.tiles = data.tiles.map(tileData => {
            const tile = new Tile();
            tile.deserialize(tileData);
            return tile;
        });
        
        // Cities and units are connected later after players are loaded
    }
}