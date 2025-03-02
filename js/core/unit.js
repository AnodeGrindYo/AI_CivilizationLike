class Unit {
    constructor(props = {}) {
        this.id = props.id || uuid.v4();
        this.type = props.type || 'warrior';
        this.owner = props.owner || null;
        this.location = props.location || { x: 0, y: 0 };
        this.health = props.health || 100;
        this.experience = props.experience || 0;
        this.movementPoints = props.movementPoints || this.getBaseMovement();
        this.movementRange = props.movementRange || this.getBaseMovement();
        this.attackStrength = props.attackStrength || this.getBaseAttack();
        this.defenseStrength = props.defenseStrength || this.getBaseDefense();
        this.canMove = props.canMove !== undefined ? props.canMove : true;
        this.hasAttacked = props.hasAttacked || false;
    }
    
    getBaseMovement() {
        const movementRates = {
            settler: 2,
            worker: 2,
            warrior: 2,
            archer: 2,
            spearman: 2,
            horseman: 4,
            swordsman: 2,
            catapult: 1,
            chariot: 4,
            galley: 3,
            trireme: 4,
            knight: 3,
            pikeman: 2,
            musketman: 2,
            cavalry: 4,
            cannon: 1,
            rifleman: 2,
            tank: 3,
            artillery: 1,
            bomber: 8,
            fighter: 10,
            submarine: 4,
            battleship: 5,
            carrier: 5,
            nuclear: 16
        };
        
        return movementRates[this.type] || 2;
    }
    
    getBaseAttack() {
        const attackValues = {
            settler: 0,
            worker: 0,
            warrior: 6,
            archer: 4,
            spearman: 7,
            horseman: 12,
            swordsman: 10,
            catapult: 8,
            chariot: 6,
            galley: 4,
            trireme: 6,
            knight: 15,
            pikeman: 12,
            musketman: 14,
            cavalry: 18,
            cannon: 20,
            rifleman: 16,
            tank: 24,
            artillery: 28,
            bomber: 30,
            fighter: 25,
            submarine: 22,
            battleship: 32,
            carrier: 15,
            nuclear: 99
        };
        
        return attackValues[this.type] || 1;
    }
    
    getBaseDefense() {
        const defenseValues = {
            settler: 1,
            worker: 1,
            warrior: 5,
            archer: 2,
            spearman: 10,
            horseman: 6,
            swordsman: 8,
            catapult: 4,
            chariot: 4,
            galley: 2,
            trireme: 4,
            knight: 8,
            pikeman: 14,
            musketman: 10,
            cavalry: 8,
            cannon: 6,
            rifleman: 12,
            tank: 16,
            artillery: 6,
            bomber: 8,
            fighter: 10,
            submarine: 12,
            battleship: 24,
            carrier: 20,
            nuclear: 0
        };
        
        return defenseValues[this.type] || 1;
    }
    
    getUnitCategory() {
        const landUnits = [
            'settler', 'worker', 'warrior', 'archer', 'spearman', 
            'horseman', 'swordsman', 'catapult', 'chariot', 'knight',
            'pikeman', 'musketman', 'cavalry', 'cannon', 'rifleman',
            'tank', 'artillery'
        ];
        
        const navalUnits = ['galley', 'trireme', 'submarine', 'battleship', 'carrier'];
        
        const airUnits = ['bomber', 'fighter', 'nuclear'];
        
        if (landUnits.includes(this.type)) {
            return 'land';
        } else if (navalUnits.includes(this.type)) {
            return 'naval';
        } else if (airUnits.includes(this.type)) {
            return 'air';
        }
        
        return 'land'; // Default
    }
    
    resetForNewTurn() {
        this.movementPoints = this.getBaseMovement();
        this.canMove = true;
        this.hasAttacked = false;
    }
    
    move(destination, game) {
        if (!this.canMove || this.movementPoints <= 0) {
            return false;
        }
        
        // Calculate distance (simplified)
        const dx = Math.abs(destination.x - this.location.x);
        const dy = Math.abs(destination.y - this.location.y);
        const distance = Math.max(dx, dy);
        
        if (distance > this.movementPoints) {
            return false;
        }
        
        // Check if move is valid using the map
        if (game && game.map) {
            if (!game.map.isValidMove(this, destination)) {
                return false;
            }
            
            game.map.moveUnit(this, destination);
        }
        
        // Update movement points
        this.movementPoints -= distance;
        
        // If out of points, can't move anymore this turn
        if (this.movementPoints <= 0) {
            this.canMove = false;
        }
        
        return true;
    }
    
    canAttack() {
        return !this.hasAttacked && this.attackStrength > 0;
    }
    
    attack(target, game) {
        if (!this.canAttack()) {
            return false;
        }
        
        // Calculate distance to target
        const dx = Math.abs(target.location.x - this.location.x);
        const dy = Math.abs(target.location.y - this.location.y);
        const distance = Math.max(dx, dy);
        
        // Check range (most units can only attack adjacent tiles)
        let maxAttackRange = 1;
        if (this.type === 'archer' || this.type === 'catapult') {
            maxAttackRange = 2;
        }
        
        if (distance > maxAttackRange) {
            return false;
        }
        
        // Calculate attack value with modifiers
        let attackValue = this.attackStrength;
        
        // Experience bonus
        attackValue += Math.floor(this.experience / 5);
        
        // Tile defense bonus for defender
        let defenseValue = target.defenseStrength;
        
        if (game && game.map) {
            const targetTile = game.map.getTileAt(target.location.x, target.location.y);
            
            if (targetTile) {
                // Terrain defense bonuses
                const terrainDefense = {
                    plains: 0,
                    grassland: 0,
                    desert: 0,
                    ocean: 0,
                    hills: 3,
                    mountains: 5,
                    forest: 2
                };
                
                defenseValue += terrainDefense[targetTile.type] || 0;
                
                // River defense
                if (targetTile.hasRiver) {
                    defenseValue += 2;
                }
            }
        }
        
        // Calculate damage with some randomness
        const attackRoll = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
        const defenseRoll = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
        
        const attackScore = attackValue * attackRoll;
        const defenseScore = defenseValue * defenseRoll;
        
        let damage;
        if (attackScore > defenseScore) {
            // Attacker wins
            damage = Math.max(10, Math.floor((attackScore / defenseScore) * 30));
            target.takeDamage(damage);
            
            // Gain experience
            this.experience += 2;
        } else {
            // Defender holds
            damage = Math.max(5, Math.floor((defenseScore / attackScore) * 15));
            this.takeDamage(damage);
            
            // Defender gains experience
            target.experience += 1;
        }
        
        // Unit has used its attack
        this.hasAttacked = true;
        
        // Check if target is destroyed
        if (target.health <= 0) {
            this.experience += 5;
            
            // Handle unit death
            if (game && game.map) {
                game.map.removeUnit(target);
            }
            
            if (target.owner) {
                const index = target.owner.units.findIndex(u => u.id === target.id);
                if (index !== -1) {
                    target.owner.units.splice(index, 1);
                }
            }
            
            // Move to target location if it was a successful attack
            if (this.type !== 'archer' && this.type !== 'catapult') {
                this.location = { ...target.location };
            }
        }
        
        return true;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
    
    heal() {
        if (this.health < 100) {
            // Heal 10 points per turn when resting
            this.health = Math.min(100, this.health + 10);
            return true;
        }
        return false;
    }
    
    canSettleCity() {
        return this.type === 'settler';
    }
    
    settleCity(cityName) {
        if (!this.canSettleCity() || !this.owner) {
            return null;
        }
        
        const city = new City({
            name: cityName || `${this.owner.name} City ${this.owner.cities.length + 1}`,
            owner: this.owner,
            location: { ...this.location }
        });
        
        // Add to player's cities
        this.owner.addCity(city);
        
        // Place on map
        if (this.owner.game && this.owner.game.map) {
            this.owner.game.map.placeCity(city);
        }
        
        return city;
    }
    
    canBuildImprovement() {
        return this.type === 'worker';
    }
    
    buildImprovement(improvementType) {
        if (!this.canBuildImprovement() || !this.owner || !this.owner.game) {
            return false;
        }
        
        const map = this.owner.game.map;
        const tile = map.getTileAt(this.location.x, this.location.y);
        
        if (tile && tile.canBuildImprovement(improvementType)) {
            tile.buildImprovement(improvementType);
            return true;
        }
        
        return false;
    }
    
    serialize() {
        return {
            id: this.id,
            type: this.type,
            owner: this.owner ? this.owner.id : null,
            location: this.location,
            health: this.health,
            experience: this.experience,
            movementPoints: this.movementPoints,
            movementRange: this.movementRange,
            attackStrength: this.attackStrength,
            defenseStrength: this.defenseStrength,
            canMove: this.canMove,
            hasAttacked: this.hasAttacked
        };
    }
    
    deserialize(data) {
        this.id = data.id;
        this.type = data.type;
        this.location = data.location;
        this.health = data.health;
        this.experience = data.experience;
        this.movementPoints = data.movementPoints;
        this.movementRange = data.movementRange;
        this.attackStrength = data.attackStrength;
        this.defenseStrength = data.defenseStrength;
        this.canMove = data.canMove;
        this.hasAttacked = data.hasAttacked;
        
        // Owner reference is connected later
        this.ownerId = data.owner;
    }
}