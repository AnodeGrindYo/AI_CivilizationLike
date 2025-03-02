class AgentsPanel {
    constructor(uiManager, game) {
        this.uiManager = uiManager;
        this.game = game;
        this.agentStore = uiManager.app.agentStore;
        this.selectedAgent = null;
    }
    
    initialize() {
        this.render();
        this.setupEventListeners();
    }
    
    render() {
        this.renderAgentList();
        this.renderAgentEditor();
        
        if (this.selectedAgent && (this.selectedAgent.type === 'qlearn' || this.selectedAgent.type === 'deepq')) {
            this.renderRewardConfigurator();
        }
    }
    
    renderAgentList() {
        const agentList = document.getElementById('agent-list');
        agentList.innerHTML = '';
        
        const agents = this.agentStore.getAgents();
        
        if (agents.length === 0) {
            const noAgents = document.createElement('div');
            noAgents.textContent = 'No agents created yet';
            noAgents.style.padding = '1rem';
            noAgents.style.opacity = '0.7';
            agentList.appendChild(noAgents);
            return;
        }
        
        for (const agent of agents) {
            const agentItem = document.createElement('div');
            agentItem.className = 'agent-item';
            if (this.selectedAgent && agent.id === this.selectedAgent.id) {
                agentItem.classList.add('selected');
            }
            
            agentItem.textContent = agent.name;
            agentItem.dataset.id = agent.id;
            
            agentItem.addEventListener('click', () => {
                this.selectAgent(agent.id);
            });
            
            agentList.appendChild(agentItem);
        }
    }
    
    renderAgentEditor() {
        const agentEditor = document.getElementById('agent-editor');
        agentEditor.innerHTML = '';
        
        if (!this.selectedAgent) {
            const noSelection = document.createElement('div');
            noSelection.textContent = 'Select an agent to edit or create a new one';
            noSelection.style.padding = '1rem';
            noSelection.style.opacity = '0.7';
            agentEditor.appendChild(noSelection);
            return;
        }
        
        // Agent details form
        const form = document.createElement('form');
        
        // Name field
        const nameGroup = document.createElement('div');
        nameGroup.className = 'form-group';
        
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Agent Name';
        nameLabel.htmlFor = 'agent-name';
        
        const nameInput = document.createElement('input');
        nameInput.className = 'form-input';
        nameInput.id = 'agent-name';
        nameInput.type = 'text';
        nameInput.value = this.selectedAgent.name;
        
        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(nameInput);
        form.appendChild(nameGroup);
        
        // Type field
        const typeGroup = document.createElement('div');
        typeGroup.className = 'form-group';
        
        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Agent Type';
        typeLabel.htmlFor = 'agent-type';
        
        const typeSelect = document.createElement('select');
        typeSelect.className = 'form-input';
        typeSelect.id = 'agent-type';
        
        const typeOptions = [
            { value: 'basic', label: 'Basic Agent' },
            { value: 'qlearn', label: 'Q-Learning Agent' },
            { value: 'deepq', label: 'Deep Q-Learning Agent' }
        ];
        
        for (const option of typeOptions) {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            typeSelect.appendChild(optionElement);
        }
        
        typeSelect.value = this.selectedAgent.type;
        
        typeGroup.appendChild(typeLabel);
        typeGroup.appendChild(typeSelect);
        form.appendChild(typeGroup);
        
        // Hyperparameters section (if applicable)
        if (this.selectedAgent.type === 'qlearn' || this.selectedAgent.type === 'deepq') {
            const hyperparamsGroup = document.createElement('div');
            hyperparamsGroup.className = 'form-group';
            
            const hyperparamsLabel = document.createElement('h3');
            hyperparamsLabel.textContent = 'Hyperparameters';
            hyperparamsGroup.appendChild(hyperparamsLabel);
            
            // Learning rate slider
            const alphaGroup = document.createElement('div');
            alphaGroup.className = 'form-group';
            
            const alphaLabel = document.createElement('label');
            alphaLabel.textContent = 'Learning Rate (Alpha)';
            alphaGroup.appendChild(alphaLabel);
            
            const alphaSlider = document.createElement('div');
            alphaSlider.className = 'slider-container';
            
            const alphaInput = document.createElement('input');
            alphaInput.type = 'range';
            alphaInput.min = '0.001';
            alphaInput.max = '0.5';
            alphaInput.step = '0.001';
            alphaInput.value = this.selectedAgent.alpha || 0.1;
            
            const alphaValue = document.createElement('span');
            alphaValue.className = 'slider-value';
            alphaValue.textContent = alphaInput.value;
            
            alphaInput.addEventListener('input', () => {
                alphaValue.textContent = alphaInput.value;
            });
            
            alphaSlider.appendChild(alphaInput);
            alphaSlider.appendChild(alphaValue);
            alphaGroup.appendChild(alphaSlider);
            
            hyperparamsGroup.appendChild(alphaGroup);
            
            // Exploration rate slider
            const epsilonGroup = document.createElement('div');
            epsilonGroup.className = 'form-group';
            
            const epsilonLabel = document.createElement('label');
            epsilonLabel.textContent = 'Exploration Rate (Epsilon)';
            epsilonGroup.appendChild(epsilonLabel);
            
            const epsilonSlider = document.createElement('div');
            epsilonSlider.className = 'slider-container';
            
            const epsilonInput = document.createElement('input');
            epsilonInput.type = 'range';
            epsilonInput.min = '0.01';
            epsilonInput.max = '1';
            epsilonInput.step = '0.01';
            epsilonInput.value = this.selectedAgent.epsilon || 0.2;
            
            const epsilonValue = document.createElement('span');
            epsilonValue.className = 'slider-value';
            epsilonValue.textContent = epsilonInput.value;
            
            epsilonInput.addEventListener('input', () => {
                epsilonValue.textContent = epsilonInput.value;
            });
            
            epsilonSlider.appendChild(epsilonInput);
            epsilonSlider.appendChild(epsilonValue);
            epsilonGroup.appendChild(epsilonSlider);
            
            hyperparamsGroup.appendChild(epsilonGroup);
            
            form.appendChild(hyperparamsGroup);
        }
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save Agent';
        saveBtn.type = 'button';
        saveBtn.addEventListener('click', () => {
            this.saveAgent();
        });
        
        form.appendChild(saveBtn);
        agentEditor.appendChild(form);
    }
    
    renderRewardConfigurator() {
        const agentEditor = document.getElementById('agent-editor');
        
        // Create reward configuration section
        const rewardSection = document.createElement('div');
        rewardSection.className = 'reward-configuration';
        rewardSection.style.marginTop = '1.5rem';
        
        const rewardTitle = document.createElement('h3');
        rewardTitle.textContent = 'Reward Configuration';
        rewardSection.appendChild(rewardTitle);
        
        // Group rewards by category
        const rewardCategories = {
            'City': ['cityFounded', 'cityGrowth', 'cityLost', 'buildingCompleted', 'wonderCompleted'],
            'Unit': ['unitTrained', 'unitKilled', 'unitLost', 'cityCapture'],
            'Resources': ['goldIncome', 'negativeGold', 'resourceDiscovered'],
            'Knowledge': ['techResearched', 'policyAdopted', 'tileExplored', 'naturalWonderDiscovered'],
            'General': ['turnCompleted', 'scoreIncrease', 'earlyExpansion', 'militaryAdvantage', 'techLead']
        };
        
        // Get reward system from agent if available
        let rewardSystem;
        if (this.selectedAgent.rewardSystem) {
            rewardSystem = this.selectedAgent.rewardSystem;
        } else {
            // Create a new one for preview
            rewardSystem = new RewardSystem();
        }
        
        // Create controls for each reward category
        for (const [category, rewards] of Object.entries(rewardCategories)) {
            const categoryGroup = document.createElement('div');
            categoryGroup.className = 'reward-group';
            
            const categoryHeader = document.createElement('h3');
            categoryHeader.textContent = `${category} Rewards`;
            categoryGroup.appendChild(categoryHeader);
            
            for (const rewardType of rewards) {
                const reward = rewardSystem.rewards[rewardType];
                if (!reward) continue;
                
                const rewardItem = document.createElement('div');
                rewardItem.className = 'reward-item';
                
                // Enable/disable checkbox
                const enableCheckbox = document.createElement('input');
                enableCheckbox.type = 'checkbox';
                enableCheckbox.checked = reward.enabled;
                enableCheckbox.dataset.rewardType = rewardType;
                enableCheckbox.addEventListener('change', () => {
                    rewardSystem.enableReward(rewardType, enableCheckbox.checked);
                    this.updateAgentRewardSystem(rewardSystem);
                });
                
                // Reward name label
                const nameLabel = document.createElement('label');
                nameLabel.textContent = this.formatRewardName(rewardType);
                nameLabel.style.flex = '1';
                
                // Value slider
                const valueSlider = document.createElement('input');
                valueSlider.type = 'range';
                valueSlider.min = '-20';
                valueSlider.max = '20';
                valueSlider.step = '0.5';
                valueSlider.value = reward.value;
                valueSlider.dataset.rewardType = rewardType;
                valueSlider.addEventListener('input', () => {
                    valueDisplay.textContent = valueSlider.value;
                    rewardSystem.setRewardValue(rewardType, parseFloat(valueSlider.value));
                    this.updateAgentRewardSystem(rewardSystem);
                });
                
                // Value display
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'reward-value';
                valueDisplay.textContent = reward.value;
                
                rewardItem.appendChild(enableCheckbox);
                rewardItem.appendChild(nameLabel);
                rewardItem.appendChild(valueSlider);
                rewardItem.appendChild(valueDisplay);
                
                categoryGroup.appendChild(rewardItem);
            }
            
            rewardSection.appendChild(categoryGroup);
        }
        
        agentEditor.appendChild(rewardSection);
    }
    
    formatRewardName(camelCase) {
        return camelCase
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }
    
    updateAgentRewardSystem(rewardSystem) {
        if (!this.selectedAgent) return;
        
        const updates = {
            rewardSystem: rewardSystem.serialize()
        };
        
        this.agentStore.updateAgent(this.selectedAgent.id, updates);
        this.selectedAgent = this.agentStore.getAgentById(this.selectedAgent.id);
    }
    
    setupEventListeners() {
        document.getElementById('create-agent').addEventListener('click', () => {
            this.createNewAgent();
        });
        
        document.getElementById('import-agent').addEventListener('click', () => {
            this.importAgent();
        });
        
        document.getElementById('export-agent').addEventListener('click', () => {
            this.exportAgent();
        });
        
        document.getElementById('delete-agent').addEventListener('click', () => {
            this.deleteSelectedAgent();
        });
    }
    
    selectAgent(agentId) {
        this.selectedAgent = this.agentStore.getAgentById(agentId);
        this.render();
    }
    
    createNewAgent() {
        const agent = this.agentStore.createAgentFromType('qlearn', {
            name: `New Agent ${this.agentStore.getAgents().length + 1}`,
            description: 'A new learning agent'
        });
        
        this.selectedAgent = agent;
        this.render();
    }
    
    saveAgent() {
        if (!this.selectedAgent) return;
        
        const nameInput = document.getElementById('agent-name');
        const typeSelect = document.getElementById('agent-type');
        
        const updates = {
            name: nameInput.value,
            type: typeSelect.value
        };
        
        // Get hyperparameters if present
        if (updates.type === 'qlearn' || updates.type === 'deepq') {
            const alphaInput = document.querySelector('input[type="range"][min="0.001"]');
            const epsilonInput = document.querySelector('input[type="range"][min="0.01"]');
            
            if (alphaInput) updates.alpha = parseFloat(alphaInput.value);
            if (epsilonInput) updates.epsilon = parseFloat(epsilonInput.value);
        }
        
        this.agentStore.updateAgent(this.selectedAgent.id, updates);
        this.selectedAgent = this.agentStore.getAgentById(this.selectedAgent.id);
        this.render();
    }
    
    importAgent() {
        const input = prompt('Paste the agent data:');
        if (!input) return;
        
        const importedAgent = this.agentStore.importAgent(input);
        if (importedAgent) {
            this.selectedAgent = importedAgent;
            this.render();
            alert('Agent imported successfully!');
        } else {
            alert('Failed to import agent. Invalid data format.');
        }
    }
    
    exportAgent() {
        if (!this.selectedAgent) {
            alert('Please select an agent to export');
            return;
        }
        
        const exportData = this.agentStore.exportAgent(this.selectedAgent.id);
        if (exportData) {
            prompt('Copy this agent data:', exportData);
        } else {
            alert('Failed to export agent');
        }
    }
    
    deleteSelectedAgent() {
        if (!this.selectedAgent) {
            alert('Please select an agent to delete');
            return;
        }
        
        if (confirm(`Are you sure you want to delete the agent "${this.selectedAgent.name}"?`)) {
            this.agentStore.deleteAgent(this.selectedAgent.id);
            this.selectedAgent = null;
            this.render();
        }
    }
    
    update() {
        this.render();
    }
}