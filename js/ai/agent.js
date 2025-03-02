class AIAgent {
    constructor(config = {}) {
        this.player = config.player || null;
        this.type = 'basic';
        this.name = config.name || 'AI Agent';
        this.description = config.description || 'A basic AI agent with simple rules';
        this.stats = {
            decisions: 0,
            cityFounded: 0,
            battlesWon: 0,
            battlesLost: 0,
            researchCompleted: 0,
            turnsPlayed: 0
        };
    }
    
    makeDecisions() {
        if (!this.player) return [];
        
        const decisions = [];
        
        // Research decision
        if (!this.player.currentResearch) {
            const tech = this.chooseTechnology(this.player.technology.getResearchOptions());
            if (tech) {
                decisions.push({
                    type: 'research',
                    technology: tech
                });
            }
        }
        
        // Create starter units if we don't have any (helps make the game more interesting)
        if (this.player.stats.turnsPlayed < 5 && this.player.cities.length > 0 && this.player.units.length < 3) {
            const city = this.player.cities[0];
            const unitTypes = ['settler', 'warrior', 'archer'];
            const missingUnits = unitTypes.filter(type => 
                !this.player.units.some(unit => unit.type === type)
            );
            
            if (missingUnits.length > 0 && !city.currentProduction) {
                decisions.push({
                    type: 'production',
                    cityId: city.id,
                    item: {
                        type: 'unit',
                        id: missingUnits[0]
                    }
                });
            }
        }
        
        // City production
        for (const city of this.player.cities) {
            if (!city.currentProduction) {
                const production = this.chooseProduction(city);
                if (production) {
                    decisions.push({
                        type: 'production',
                        cityId: city.id,
                        item: production
                    });
                }
            }
        }
        
        // Unit movement
        for (const unit of this.player.units) {
            if (unit.canMove) {
                const move = this.chooseUnitAction(unit);
                if (move) {
                    decisions.push(move);
                }
            }
        }
        
        this.stats.decisions += decisions.length;
        this.stats.turnsPlayed++;
        
        return decisions;
    }
    
    chooseTechnology(options) {
        if (options.length === 0) return null;
        
        // Simple strategy: choose randomly from options
        return options[Math.floor(Math.random() * options.length)];
    }
    
    chooseProduction(city) {
        const options = [];
        
        // Buildings that can be built
        const buildings = [
            'granary', 'workshop', 'market', 'library', 'temple', 
            'barracks', 'walls', 'university', 'bank', 'cathedral', 
            'factory', 'power_plant', 'aqueduct', 'hospital',
            'research_lab', 'stock_exchange', 'courthouse', 'colosseum'
        ];
        
        for (const building of buildings) {
            if (city.canBuildBuilding(building)) {
                options.push({
                    type: 'building',
                    id: building
                });
            }
        }
        
        // Units that can be built
        const units = [
            'settler', 'worker', 'warrior', 'archer', 'spearman', 
            'horseman', 'swordsman', 'catapult', 'chariot', 
            'knight', 'pikeman', 'musketman', 'cavalry', 'cannon', 
            'rifleman', 'tank', 'artillery', 'bomber', 'fighter'
        ];
        
        // Check for naval units if city is coastal
        if (this.isCityCoastal(city)) {
            units.push('galley', 'trireme', 'submarine', 'battleship', 'carrier');
        }
        
        for (const unit of units) {
            if (city.canBuildUnit(unit)) {
                options.push({
                    type: 'unit',
                    id: unit
                });
            }
        }
        
        if (options.length === 0) return null;
        
        // Simple strategy: choose randomly from options
        return options[Math.floor(Math.random() * options.length)];
    }
    
    isCityCoastal(city) {
        if (!this.player || !this.player.game) return false;
        
        const map = this.player.game.map;
        const tiles = map.getNeighbors(map.getTileAt(city.location.x, city.location.y));
        
        // Check if any neighboring tile is ocean
        return tiles.some(tile => tile.type === 'ocean');
    }
    
    chooseUnitAction(unit) {
        if (!this.player.game) return null;
        
        const game = this.player.game;
        const map = game.map;
        
        // If settler, try to found a city
        if (unit.type === 'settler') {
            const tile = map.getTileAt(unit.location.x, unit.location.y);
            if (tile && tile.type !== 'ocean' && tile.type !== 'mountains' && !tile.city) {
                return {
                    type: 'settle',
                    unitId: unit.id
                };
            }
            
            // Move to a good spot
            const possibleMoves = this.getPossibleMoves(unit);
            const goodSpots = possibleMoves.filter(move => {
                const tile = map.getTileAt(move.x, move.y);
                return tile && 
                       tile.type !== 'ocean' && 
                       tile.type !== 'mountains' && 
                       !tile.city &&
                       (tile.type === 'grassland' || tile.type === 'plains');
            });
            
            if (goodSpots.length > 0) {
                const destination = goodSpots[Math.floor(Math.random() * goodSpots.length)];
                return {
                    type: 'move',
                    unitId: unit.id,
                    destination: destination
                };
            }
        }
        
        // If worker, build improvement
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
                
                if (possibleImprovements.length > 0) {
                    const improvement = possibleImprovements[Math.floor(Math.random() * possibleImprovements.length)];
                    return {
                        type: 'build',
                        unitId: unit.id,
                        improvement: improvement
                    };
                }
            }
        }
        
        // If military unit, prefer attacking enemies
        if (unit.canAttack()) {
            const enemyUnits = [];
            
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
                            enemyUnits.push(enemyUnit);
                        }
                    }
                }
            }
            
            if (enemyUnits.length > 0) {
                const target = enemyUnits[Math.floor(Math.random() * enemyUnits.length)];
                return {
                    type: 'attack',
                    unitId: unit.id,
                    targetId: target.id,
                    targetType: 'unit'
                };
            }
        }
        
        // Sometimes head toward enemies for more interesting battles
        if (unit.canAttack() && Math.random() < 0.5) {
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            
            for (const player of game.players) {
                if (player !== this.player) {
                    for (const enemyUnit of player.units) {
                        const dx = enemyUnit.location.x - unit.location.x;
                        const dy = enemyUnit.location.y - unit.location.y;
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        
                        if (distance < nearestDistance && distance < 8) {
                            nearestDistance = distance;
                            nearestEnemy = enemyUnit;
                        }
                    }
                }
            }
            
            if (nearestEnemy) {
                // Move toward enemy
                const possibleMoves = this.getPossibleMoves(unit);
                if (possibleMoves.length > 0) {
                    // Choose move that gets closer to enemy
                    let bestMove = possibleMoves[0];
                    let bestDistance = Infinity;
                    
                    for (const move of possibleMoves) {
                        const dx = move.x - nearestEnemy.location.x;
                        const dy = move.y - nearestEnemy.location.y;
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        
                        if (distance < bestDistance) {
                            bestDistance = distance;
                            bestMove = move;
                        }
                    }
                    
                    return {
                        type: 'move',
                        unitId: unit.id,
                        destination: bestMove
                    };
                }
            }
        }
        
        // Default: For more interesting gameplay, sometimes explore unexplored areas
        if (Math.random() < 0.7) {
            const possibleMoves = this.getPossibleMoves(unit);
            if (possibleMoves.length > 0) {
                // Prefer unexplored tiles
                const unexploredMoves = possibleMoves.filter(move => {
                    const tile = map.getTileAt(move.x, move.y);
                    return !tile.explored;
                });
                
                if (unexploredMoves.length > 0) {
                    const destination = unexploredMoves[Math.floor(Math.random() * unexploredMoves.length)];
                    return {
                        type: 'move',
                        unitId: unit.id,
                        destination: destination
                    };
                }
                
                // If no unexplored tiles nearby, choose random direction
                const destination = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                return {
                    type: 'move',
                    unitId: unit.id,
                    destination: destination
                };
            }
        }
        
        return null;
    }
    
    getPossibleMoves(unit) {
        if (!this.player || !this.player.game) return [];
        
        const map = this.player.game.map;
        const moves = [];
        
        // Check all adjacent tiles
        const directions = [
            {dx: 0, dy: -1}, // North
            {dx: 1, dy: 0},  // East
            {dx: 0, dy: 1},  // South
            {dx: -1, dy: 0}  // West
        ];
        
        for (const dir of directions) {
            const newX = unit.location.x + dir.dx;
            const newY = unit.location.y + dir.dy;
            
            // Add bounds check before calling isValidMove
            if (newX >= 0 && newX < map.width && newY >= 0 && newY < map.height) {
                // Check if move is valid
                if (map.isValidMove(unit, {x: newX, y: newY})) {
                    moves.push({x: newX, y: newY});
                }
            }
        }
        
        return moves;
    }
    
    onTurnStart() {
        // Hook for start of turn logic
    }
    
    onTurnEnd() {
        // Hook for end of turn logic
    }
    
    onResearchComplete(technology) {
        this.stats.researchCompleted++;
    }
    
    onCityFounded(city) {
        this.stats.cityFounded++;
    }
    
    onBattleResult(won, details) {
        if (won) {
            this.stats.battlesWon++;
        } else {
            this.stats.battlesLost++;
        }
    }
    
    learnFromGameResult(isWinner, gameStats) {
        // Basic agents don't learn, overridden in subclasses
    }
    
    serialize() {
        return {
            type: this.type,
            name: this.name,
            description: this.description,
            stats: this.stats
        };
    }
    
    deserialize(data) {
        this.type = data.type;
        this.name = data.name;
        this.description = data.description;
        this.stats = data.stats;
    }
}