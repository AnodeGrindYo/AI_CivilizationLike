class PersistenceManager {
    constructor() {
        this.storagePrefix = 'ai-civilization-';
    }
    
    saveGame(game, slotName = 'autosave') {
        try {
            const serializedGame = game.save();
            const saveData = {
                timestamp: Date.now(),
                name: slotName,
                game: serializedGame
            };
            
            localStorage.setItem(
                `${this.storagePrefix}save-${slotName}`, 
                JSON.stringify(saveData)
            );
            
            return true;
        } catch (err) {
            console.error('Error saving game:', err);
            return false;
        }
    }
    
    loadGame(slotName = 'autosave') {
        try {
            const saveData = localStorage.getItem(`${this.storagePrefix}save-${slotName}`);
            if (!saveData) return null;
            
            return JSON.parse(saveData);
        } catch (err) {
            console.error('Error loading game:', err);
            return null;
        }
    }
    
    getSaveSlots() {
        const slots = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`${this.storagePrefix}save-`)) {
                try {
                    const saveData = JSON.parse(localStorage.getItem(key));
                    slots.push({
                        name: saveData.name,
                        timestamp: saveData.timestamp,
                        key: key
                    });
                } catch (err) {
                    console.error('Error parsing save slot:', err);
                }
            }
        }
        
        // Sort by timestamp (newest first)
        return slots.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    deleteSaveSlot(slotName) {
        localStorage.removeItem(`${this.storagePrefix}save-${slotName}`);
    }
    
    saveSettings(settings) {
        localStorage.setItem(`${this.storagePrefix}settings`, JSON.stringify(settings));
    }
    
    loadSettings() {
        const settings = localStorage.getItem(`${this.storagePrefix}settings`);
        return settings ? JSON.parse(settings) : null;
    }
}

