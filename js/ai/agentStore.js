class AgentStore {
    constructor() {
        this.agents = [];
        this.loadFromStorage();
    }
    
    loadFromStorage() {
        try {
            const savedAgents = localStorage.getItem('ai-civilization-agents');
            if (savedAgents) {
                this.agents = JSON.parse(savedAgents);
            }
        } catch (err) {
            console.error('Error loading agents from storage', err);
            this.agents = [];
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('ai-civilization-agents', JSON.stringify(this.agents));
        } catch (err) {
            console.error('Error saving agents to storage', err);
        }
    }
    
    getAgents() {
        return this.agents;
    }
    
    getAgentById(id) {
        return this.agents.find(agent => agent.id === id);
    }
    
    addAgent(agent) {
        // Make sure agent has an ID
        if (!agent.id) {
            agent.id = uuid.v4();
        }
        
        // Add creation date
        if (!agent.createdAt) {
            agent.createdAt = new Date().toISOString();
        }
        
        this.agents.push(agent);
        this.saveToStorage();
        return agent;
    }
    
    updateAgent(id, updates) {
        const index = this.agents.findIndex(agent => agent.id === id);
        if (index === -1) return false;
        
        // Apply updates
        this.agents[index] = { ...this.agents[index], ...updates, updatedAt: new Date().toISOString() };
        this.saveToStorage();
        return true;
    }
    
    deleteAgent(id) {
        const index = this.agents.findIndex(agent => agent.id === id);
        if (index === -1) return false;
        
        this.agents.splice(index, 1);
        this.saveToStorage();
        return true;
    }
    
    exportAgent(id) {
        const agent = this.getAgentById(id);
        if (!agent) return null;
        
        // Add export metadata
        const exportData = {
            ...agent,
            exportedAt: new Date().toISOString(),
            format: 'ai-civilization-agent-v1'
        };
        
        return btoa(JSON.stringify(exportData));
    }
    
    importAgent(encodedData) {
        try {
            const jsonData = atob(encodedData);
            const agentData = JSON.parse(jsonData);
            
            // Validation
            if (!agentData.format || !agentData.format.startsWith('ai-civilization-agent')) {
                throw new Error('Invalid agent format');
            }
            
            // Check if agent with this ID already exists
            if (this.getAgentById(agentData.id)) {
                // Generate new ID to avoid overwriting
                agentData.id = uuid.v4();
                agentData.importedFrom = agentData.name;
                agentData.name = `Copy of ${agentData.name}`;
            }
            
            // Add import metadata
            agentData.importedAt = new Date().toISOString();
            
            // Add to collection
            this.addAgent(agentData);
            return agentData;
            
        } catch (err) {
            console.error('Error importing agent', err);
            return null;
        }
    }
    
    createAgentFromType(type, config = {}) {
        let agent;
        
        // Create the appropriate agent type
        if (type === 'qlearn') {
            agent = new QLearningAgent(config);
        } else if (type === 'deepq') {
            agent = new DeepQAgent(config);
        } else {
            // Default to basic agent
            agent = new AIAgent(config);
        }
        
        const serializedAgent = agent.serialize();
        return this.addAgent(serializedAgent);
    }
    
    instantiateAgent(agentData) {
        let agent;
        
        // Create the appropriate agent type
        if (agentData.type === 'qlearn') {
            agent = new QLearningAgent();
        } else if (agentData.type === 'deepq') {
            agent = new DeepQAgent();
        } else {
            // Default to basic agent
            agent = new AIAgent();
        }
        
        // Load the agent data
        agent.deserialize(agentData);
        
        return agent;
    }
}

