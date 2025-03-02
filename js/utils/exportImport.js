class ExportImportManager {
    static exportGame(game) {
        if (!game) return null;
        
        const saveData = game.save();
        const exportData = {
            type: 'ai-civilization-game',
            version: '1.0',
            timestamp: Date.now(),
            data: saveData
        };
        
        return btoa(JSON.stringify(exportData));
    }
    
    static importGame(encodedData) {
        try {
            const jsonData = atob(encodedData);
            const importData = JSON.parse(jsonData);
            
            if (importData.type !== 'ai-civilization-game') {
                throw new Error('Invalid game data format');
            }
            
            return importData.data;
        } catch (err) {
            console.error('Error importing game:', err);
            return null;
        }
    }
    
    static exportAgentCollection(agents) {
        const exportData = {
            type: 'ai-civilization-agent-collection',
            version: '1.0',
            timestamp: Date.now(),
            agents: agents
        };
        
        return btoa(JSON.stringify(exportData));
    }
    
    static importAgentCollection(encodedData) {
        try {
            const jsonData = atob(encodedData);
            const importData = JSON.parse(jsonData);
            
            if (importData.type !== 'ai-civilization-agent-collection') {
                throw new Error('Invalid agent collection format');
            }
            
            return importData.agents;
        } catch (err) {
            console.error('Error importing agent collection:', err);
            return null;
        }
    }
}

