class RewardSystem {
    constructor(config = {}) {
        this.rewards = {
            // City-related rewards
            cityFounded: { value: 10, enabled: true },
            cityGrowth: { value: 5, enabled: true },
            cityLost: { value: -15, enabled: true },
            buildingCompleted: { value: 3, enabled: true },
            wonderCompleted: { value: 15, enabled: true },
            
            // Unit-related rewards
            unitTrained: { value: 2, enabled: true },
            unitKilled: { value: 5, enabled: true },
            unitLost: { value: -4, enabled: true },
            cityCapture: { value: 20, enabled: true },
            
            // Resource-related rewards
            goldIncome: { value: 0.1, enabled: true },
            negativeGold: { value: -5, enabled: true },
            resourceDiscovered: { value: 3, enabled: true },
            
            // Tech-related rewards
            techResearched: { value: 8, enabled: true },
            policyAdopted: { value: 12, enabled: true },
            
            // Exploration-related rewards
            tileExplored: { value: 0.1, enabled: true },
            naturalWonderDiscovered: { value: 10, enabled: true },
            
            // General gameplay rewards
            turnCompleted: { value: 1, enabled: true },
            scoreIncrease: { value: 0.5, enabled: true },
            earlyExpansion: { value: 8, enabled: true }, // Bonus for early expansion
            militaryAdvantage: { value: 3, enabled: true }, // Bonus for having military advantage
            techLead: { value: 5, enabled: true } // Bonus for tech leadership
        };
        
        // Override defaults with config
        if (config) {
            for (const [key, settings] of Object.entries(config)) {
                if (this.rewards[key]) {
                    this.rewards[key] = { ...this.rewards[key], ...settings };
                }
            }
        }
        
        // State for tracking changes
        this.previousState = null;
    }
    
    setRewardValue(rewardType, value) {
        if (this.rewards[rewardType]) {
            this.rewards[rewardType].value = value;
            return true;
        }
        return false;
    }
    
    enableReward(rewardType, enabled = true) {
        if (this.rewards[rewardType]) {
            this.rewards[rewardType].enabled = enabled;
            return true;
        }
        return false;
    }
    
    getReward(rewardType) {
        if (!this.rewards[rewardType] || !this.rewards[rewardType].enabled) {
            return 0;
        }
        return this.rewards[rewardType].value;
    }
    
    calculateRewards(player) {
        if (!player) return [];
        
        const calculatedRewards = [];
        
        // Initialize previous state if not exists
        if (!this.previousState) {
            this.previousState = this.capturePlayerState(player);
            return calculatedRewards;
        }
        
        // Capture current state
        const currentState = this.capturePlayerState(player);
        
        // Calculate rewards based on state changes
        
        // Turn completion reward
        if (this.rewards.turnCompleted.enabled) {
            calculatedRewards.push({
                type: 'turnCompleted',
                value: this.rewards.turnCompleted.value
            });
        }
        
        // City rewards
        const citiesDelta = currentState.cities - this.previousState.cities;
        if (citiesDelta > 0 && this.rewards.cityFounded.enabled) {
            calculatedRewards.push({
                type: 'cityFounded',
                value: this.rewards.cityFounded.value * citiesDelta
            });
            
            // Early expansion bonus (before turn 50)
            if (this.rewards.earlyExpansion.enabled && currentState.turn < 50) {
                calculatedRewards.push({
                    type: 'earlyExpansion',
                    value: this.rewards.earlyExpansion.value * (1 - currentState.turn / 100)
                });
            }
        } else if (citiesDelta < 0 && this.rewards.cityLost.enabled) {
            calculatedRewards.push({
                type: 'cityLost',
                value: this.rewards.cityLost.value * citiesDelta // citiesDelta is negative
            });
        }
        
        // Population growth
        const populationDelta = currentState.population - this.previousState.population;
        if (populationDelta > 0 && this.rewards.cityGrowth.enabled) {
            calculatedRewards.push({
                type: 'cityGrowth',
                value: this.rewards.cityGrowth.value * populationDelta
            });
        }
        
        // Buildings completed
        const buildingsDelta = currentState.buildings - this.previousState.buildings;
        if (buildingsDelta > 0 && this.rewards.buildingCompleted.enabled) {
            calculatedRewards.push({
                type: 'buildingCompleted',
                value: this.rewards.buildingCompleted.value * buildingsDelta
            });
        }
        
        // Units trained
        const unitsDelta = currentState.units - this.previousState.units;
        if (unitsDelta > 0 && this.rewards.unitTrained.enabled) {
            calculatedRewards.push({
                type: 'unitTrained',
                value: this.rewards.unitTrained.value * unitsDelta
            });
        }
        
        // Military advantage
        if (this.rewards.militaryAdvantage.enabled && currentState.militaryRatio > 1.2) {
            calculatedRewards.push({
                type: 'militaryAdvantage',
                value: this.rewards.militaryAdvantage.value * (currentState.militaryRatio - 1)
            });
        }
        
        // Unit battle results
        const unitsLostDelta = currentState.unitsLost - this.previousState.unitsLost;
        if (unitsLostDelta > 0 && this.rewards.unitLost.enabled) {
            calculatedRewards.push({
                type: 'unitLost',
                value: this.rewards.unitLost.value * unitsLostDelta
            });
        }
        
        const battlesWonDelta = currentState.battlesWon - this.previousState.battlesWon;
        if (battlesWonDelta > 0 && this.rewards.unitKilled.enabled) {
            calculatedRewards.push({
                type: 'unitKilled',
                value: this.rewards.unitKilled.value * battlesWonDelta
            });
        }
        
        // Technology progress
        const techDelta = currentState.technologies - this.previousState.technologies;
        if (techDelta > 0 && this.rewards.techResearched.enabled) {
            calculatedRewards.push({
                type: 'techResearched',
                value: this.rewards.techResearched.value * techDelta
            });
            
            // Tech lead bonus
            if (this.rewards.techLead.enabled && currentState.techLead > 0) {
                calculatedRewards.push({
                    type: 'techLead',
                    value: this.rewards.techLead.value * currentState.techLead
                });
            }
        }
        
        // Policy adoption
        const policiesDelta = currentState.policies - this.previousState.policies;
        if (policiesDelta > 0 && this.rewards.policyAdopted.enabled) {
            calculatedRewards.push({
                type: 'policyAdopted',
                value: this.rewards.policyAdopted.value * policiesDelta
            });
        }
        
        // Gold income
        if (currentState.gold > this.previousState.gold && this.rewards.goldIncome.enabled) {
            const goldIncome = currentState.gold - this.previousState.gold;
            calculatedRewards.push({
                type: 'goldIncome',
                value: this.rewards.goldIncome.value * goldIncome
            });
        } else if (currentState.gold < 0 && this.rewards.negativeGold.enabled) {
            calculatedRewards.push({
                type: 'negativeGold',
                value: this.rewards.negativeGold.value
            });
        }
        
        // Score progress
        if (currentState.score > this.previousState.score && this.rewards.scoreIncrease.enabled) {
            const scoreDelta = currentState.score - this.previousState.score;
            calculatedRewards.push({
                type: 'scoreIncrease',
                value: this.rewards.scoreIncrease.value * scoreDelta
            });
        }
        
        // Update previous state for next time
        this.previousState = currentState;
        
        return calculatedRewards;
    }
    
    capturePlayerState(player) {
        if (!player) return {};
        
        // Calculate total population
        let totalPopulation = 0;
        let totalBuildings = 0;
        for (const city of player.cities) {
            totalPopulation += city.population;
            totalBuildings += city.buildings.length;
        }
        
        // Calculate military ratio compared to other players
        let militaryRatio = 1;
        let techLead = 0;
        
        if (player.game) {
            let totalMilitaryUnits = player.units.filter(u => 
                u.type !== 'settler' && u.type !== 'worker'
            ).length;
            
            let otherPlayersMilitaryUnits = 0;
            let otherPlayersCount = 0;
            let maxOtherPlayerTechs = 0;
            
            for (const otherPlayer of player.game.players) {
                if (otherPlayer !== player) {
                    otherPlayersCount++;
                    otherPlayersMilitaryUnits += otherPlayer.units.filter(u => 
                        u.type !== 'settler' && u.type !== 'worker'
                    ).length;
                    
                    maxOtherPlayerTechs = Math.max(
                        maxOtherPlayerTechs, 
                        otherPlayer.technology.researched.length
                    );
                }
            }
            
            // Calculate military ratio
            if (otherPlayersMilitaryUnits > 0 && otherPlayersCount > 0) {
                const avgOtherMilitary = otherPlayersMilitaryUnits / otherPlayersCount;
                militaryRatio = totalMilitaryUnits / (avgOtherMilitary || 1);
            }
            
            // Calculate tech lead
            if (maxOtherPlayerTechs > 0) {
                techLead = player.technology.researched.length - maxOtherPlayerTechs;
            }
        }
        
        return {
            turn: player.stats.turnsPlayed,
            cities: player.cities.length,
            population: totalPopulation,
            buildings: totalBuildings,
            units: player.units.length,
            unitsLost: player.stats.unitsLost || 0,
            battlesWon: player.stats.battlesWon || 0,
            technologies: player.technology.researched.length,
            policies: player.policies.length,
            gold: player.gold,
            score: player.getScore(),
            militaryRatio: militaryRatio,
            techLead: techLead
        };
    }
    
    serialize() {
        // Convert rewards object to array for easier serialization
        const rewardsArray = Object.entries(this.rewards).map(([key, data]) => ({
            type: key,
            value: data.value,
            enabled: data.enabled
        }));
        
        return {
            rewards: rewardsArray,
            previousState: this.previousState
        };
    }
    
    deserialize(data) {
        // Restore rewards from array
        if (data.rewards) {
            for (const reward of data.rewards) {
                if (this.rewards[reward.type]) {
                    this.rewards[reward.type].value = reward.value;
                    this.rewards[reward.type].enabled = reward.enabled;
                }
            }
        }
        
        this.previousState = data.previousState;
    }
}

