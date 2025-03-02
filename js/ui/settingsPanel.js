class SettingsPanel {
    constructor(uiManager, game) {
        this.uiManager = uiManager;
        this.game = game;
        this.container = document.getElementById('settings-container');
    }
    
    initialize() {
        this.render();
    }
    
    render() {
        // Clear container
        this.container.innerHTML = '';
        
        // Game settings section
        const gameSection = this.createSection('Game Settings');
        
        const gameSettings = [
            {
                label: 'Game Speed',
                type: 'select',
                id: 'game-speed',
                options: [
                    { value: '0.5', label: 'Slow' },
                    { value: '1', label: 'Normal' },
                    { value: '2', label: 'Fast' },
                    { value: '5', label: 'Very Fast' },
                    { value: '10', label: 'Ultra Fast' },
                    { value: '20', label: 'Lightning' },
                    { value: '50', label: 'Maximum' }
                ],
                defaultValue: '5',
                onChange: (value) => {
                    if (this.game) {
                        this.game.speed = parseFloat(value);
                        if (this.game.isRunning && this.game.autoPlayInterval) {
                            clearInterval(this.game.autoPlayInterval);
                            this.game.autoPlayInterval = setInterval(() => {
                                if (this.game.isRunning) {
                                    this.game.nextTurn();
                                }
                            }, 6000 / this.game.speed);
                        }
                    }
                }
            },
            {
                label: 'Map Size',
                type: 'select',
                id: 'map-size',
                options: [
                    { value: 'small', label: 'Small (24x16)' },
                    { value: 'medium', label: 'Medium (32x24)' },
                    { value: 'large', label: 'Large (40x30)' }
                ],
                defaultValue: 'medium',
                onChange: (value) => {
                    // This requires restarting the game
                }
            },
            {
                label: 'Auto-Start New Game',
                type: 'checkbox',
                id: 'auto-new-game',
                defaultValue: false,
                onChange: (value) => {
                    if (this.game) {
                        this.game.config.autoStartNewGame = value;
                    }
                }
            }
        ];
        
        this.addSettingsToSection(gameSection, gameSettings);
        this.container.appendChild(gameSection);
        
        // Player settings section
        const playerSection = this.createSection('Player Settings');
        
        const playerSettings = [
            {
                label: 'Number of AI Players',
                type: 'select',
                id: 'ai-count',
                options: [
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                    { value: '5', label: '5' },
                    { value: '6', label: '6' },
                    { value: '7', label: '7' },
                    { value: '8', label: '8' },
                    { value: '10', label: '10' },
                    { value: '12', label: '12' }
                ],
                defaultValue: '4',
                onChange: (value) => {
                    // This requires restarting the game
                }
            },
            {
                label: 'Starting Era',
                type: 'select',
                id: 'starting-era',
                options: [
                    { value: 'ancient', label: 'Ancient Era' },
                    { value: 'classical', label: 'Classical Era' },
                    { value: 'medieval', label: 'Medieval Era' },
                    { value: 'renaissance', label: 'Renaissance Era' }
                ],
                defaultValue: 'ancient',
                onChange: (value) => {
                    // This requires restarting the game
                }
            }
        ];
        
        this.addSettingsToSection(playerSection, playerSettings);
        this.container.appendChild(playerSection);
        
        // AI settings section
        const aiSection = this.createSection('AI Settings');
        
        const aiSettings = [
            {
                label: 'Default AI Type',
                type: 'select',
                id: 'default-ai-type',
                options: [
                    { value: 'basic', label: 'Basic AI' },
                    { value: 'qlearn', label: 'Q-Learning AI' },
                    { value: 'deepq', label: 'Deep Q-Learning AI' }
                ],
                defaultValue: 'qlearn',
                onChange: (value) => {
                    // This affects new games, saved in app settings
                }
            },
            {
                label: 'AI Learning Speed',
                type: 'range',
                id: 'ai-learning-speed',
                min: 0.001,
                max: 0.5,
                step: 0.001,
                defaultValue: 0.1,
                onChange: (value) => {
                    // Update learning rate for all AI agents
                    if (this.game) {
                        for (const player of this.game.players) {
                            if (player.agent && player.agent.setHyperParameters) {
                                player.agent.setHyperParameters({
                                    alpha: parseFloat(value)
                                });
                            }
                        }
                    }
                }
            },
            {
                label: 'AI Exploration Rate',
                type: 'range',
                id: 'ai-exploration-rate',
                min: 0.01,
                max: 1,
                step: 0.01,
                defaultValue: 0.2,
                onChange: (value) => {
                    // Update exploration rate for all AI agents
                    if (this.game) {
                        for (const player of this.game.players) {
                            if (player.agent && player.agent.setHyperParameters) {
                                player.agent.setHyperParameters({
                                    epsilon: parseFloat(value)
                                });
                            }
                        }
                    }
                }
            }
        ];
        
        this.addSettingsToSection(aiSection, aiSettings);
        this.container.appendChild(aiSection);
        
        // Victory conditions section
        const victorySection = this.createSection('Victory Conditions');
        
        const victorySettings = [
            {
                label: 'Domination Victory',
                type: 'checkbox',
                id: 'domination-victory',
                defaultValue: true,
                onChange: (value) => {
                    // Enable/disable victory condition
                }
            },
            {
                label: 'Cultural Victory',
                type: 'checkbox',
                id: 'cultural-victory',
                defaultValue: true,
                onChange: (value) => {
                    // Enable/disable victory condition
                }
            },
            {
                label: 'Scientific Victory',
                type: 'checkbox',
                id: 'scientific-victory',
                defaultValue: true,
                onChange: (value) => {
                    // Enable/disable victory condition
                }
            },
            {
                label: 'Turn Limit',
                type: 'number',
                id: 'turn-limit',
                min: 100,
                max: 1000,
                step: 50,
                defaultValue: 500,
                onChange: (value) => {
                    if (this.game) {
                        this.game.config.maxTurns = parseInt(value);
                    }
                }
            }
        ];
        
        this.addSettingsToSection(victorySection, victorySettings);
        this.container.appendChild(victorySection);
        
        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'settings-actions';
        
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset to Defaults';
        resetBtn.addEventListener('click', () => this.resetToDefaults());
        actions.appendChild(resetBtn);
        
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply Changes';
        applyBtn.addEventListener('click', () => this.applyChanges());
        actions.appendChild(applyBtn);
        
        this.container.appendChild(actions);
    }
    
    createSection(title) {
        const section = document.createElement('div');
        section.className = 'settings-section';
        
        const heading = document.createElement('h3');
        heading.textContent = title;
        section.appendChild(heading);
        
        return section;
    }
    
    addSettingsToSection(section, settings) {
        const grid = document.createElement('div');
        grid.className = 'settings-grid';
        grid.style.overflow = 'visible'; // Fix overflow issues
        
        for (const setting of settings) {
            const item = document.createElement('div');
            item.className = 'setting-item';
            
            const label = document.createElement('label');
            label.textContent = setting.label;
            label.htmlFor = setting.id;
            item.appendChild(label);
            
            // Create the appropriate input based on type
            let input;
            
            if (setting.type === 'select') {
                input = document.createElement('select');
                input.id = setting.id;
                
                for (const option of setting.options) {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.label;
                    input.appendChild(optionElement);
                }
                
                input.value = setting.defaultValue;
                input.addEventListener('change', () => setting.onChange(input.value));
                
            } else if (setting.type === 'range') {
                const container = document.createElement('div');
                container.className = 'slider-container';
                
                input = document.createElement('input');
                input.id = setting.id;
                input.type = 'range';
                input.min = setting.min || 0;
                input.max = setting.max || 100;
                input.step = setting.step || 1;
                input.value = setting.defaultValue;
                
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'slider-value';
                valueDisplay.textContent = input.value;
                
                input.addEventListener('input', () => {
                    valueDisplay.textContent = input.value;
                    setting.onChange(input.value);
                });
                
                container.appendChild(input);
                container.appendChild(valueDisplay);
                item.appendChild(container);
                
            } else if (setting.type === 'checkbox') {
                input = document.createElement('input');
                input.id = setting.id;
                input.type = 'checkbox';
                input.checked = setting.defaultValue;
                input.addEventListener('change', () => setting.onChange(input.checked));
                
            } else if (setting.type === 'number') {
                input = document.createElement('input');
                input.id = setting.id;
                input.type = 'number';
                input.min = setting.min;
                input.max = setting.max;
                input.step = setting.step || 1;
                input.value = setting.defaultValue;
                input.addEventListener('input', () => setting.onChange(input.value));
            }
            
            // Add input to item if not already added (for range type)
            if (setting.type !== 'range') {
                item.appendChild(input);
            }
            
            grid.appendChild(item);
        }
        
        section.appendChild(grid);
    }
    
    resetToDefaults() {
        // Reset all settings to their defaults
        // This would reload all the setting controls with default values
        this.render();
    }
    
    applyChanges() {
        // Apply all current settings
        // Most settings are applied immediately on change
        if (this.game) {
            this.game.emit('settingsChanged', {});
        }
    }
}