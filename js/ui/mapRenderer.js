class MapRenderer {
    constructor(mapContainer, game) {
        this.mapContainer = mapContainer;
        this.game = game;
        this.map = game.map;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.tileSize = 64;
        this.selectedTile = null;
        this.activePlayerColor = '#ffffff';
        this.tileDomElements = [];
        this.unitDomElements = [];
        this.cityDomElements = [];
        this.isDragging = false;
        this.startDragX = 0;
        this.startDragY = 0;
        this.initialOffsetX = 0;
        this.initialOffsetY = 0;
        this.hexMode = game.map.useHexGrid;
    }
    
    initialize() {
        this.setupMapControls();
        this.setupEventListeners();
        this.render();
        
        // Add a slight delay to ensure proper rendering
        setTimeout(() => {
            this.centerMap();
        }, 100);
    }
    
    setupMapControls() {
        // Create map control elements
        const mapControls = document.createElement('div');
        mapControls.className = 'map-controls';
        
        // Zoom controls
        const zoomIn = document.createElement('button');
        zoomIn.innerHTML = '+';
        zoomIn.addEventListener('click', () => this.zoom(0.2));
        
        const zoomOut = document.createElement('button');
        zoomOut.innerHTML = '-';
        zoomOut.addEventListener('click', () => this.zoom(-0.2));
        
        // Reset view
        const resetView = document.createElement('button');
        resetView.innerHTML = '⌂';
        resetView.addEventListener('click', () => this.resetView());
        
        mapControls.appendChild(zoomIn);
        mapControls.appendChild(zoomOut);
        mapControls.appendChild(resetView);
        
        this.mapContainer.appendChild(mapControls);
    }
    
    setupEventListeners() {
        // Map dragging events
        this.mapContainer.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Touch events for mobile
        this.mapContainer.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Zoom with mouse wheel
        this.mapContainer.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Game event listeners
        this.game.on('turnChanged', this.handleTurnChanged.bind(this));
        this.game.on('gameInitialized', this.handleGameInitialized.bind(this));
        
        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleMouseDown(e) {
        if (e.button === 0) { // Left button
            this.isDragging = true;
            this.startDragX = e.clientX;
            this.startDragY = e.clientY;
            this.initialOffsetX = this.offsetX;
            this.initialOffsetY = this.offsetY;
            this.mapContainer.style.cursor = 'grabbing';
        }
    }
    
    handleMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.startDragX;
            const dy = e.clientY - this.startDragY;
            
            this.offsetX = this.initialOffsetX + dx;
            this.offsetY = this.initialOffsetY + dy;
            
            this.updateMapPosition();
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.mapContainer.style.cursor = 'grab';
    }
    
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            this.isDragging = true;
            this.startDragX = e.touches[0].clientX;
            this.startDragY = e.touches[0].clientY;
            this.initialOffsetX = this.offsetX;
            this.initialOffsetY = this.offsetY;
        }
    }
    
    handleTouchMove(e) {
        if (this.isDragging && e.touches.length === 1) {
            e.preventDefault();
            const dx = e.touches[0].clientX - this.startDragX;
            const dy = e.touches[0].clientY - this.startDragY;
            
            this.offsetX = this.initialOffsetX + dx;
            this.offsetY = this.initialOffsetY + dy;
            
            this.updateMapPosition();
        }
    }
    
    handleTouchEnd() {
        this.isDragging = false;
    }
    
    handleWheel(e) {
        e.preventDefault();
        const delta = -Math.sign(e.deltaY) * 0.1;
        this.zoom(delta);
    }
    
    handleTurnChanged(data) {
        // Update active player color
        this.activePlayerColor = data.currentPlayer.color;
        
        // Update map
        this.updateUnits();
        this.updateCities();
    }
    
    handleGameInitialized() {
        // Render the map when game is initialized
        this.render();
    }
    
    handleResize() {
        // Re-center map on resize
        this.centerMap();
    }
    
    zoom(delta) {
        const newScale = Math.max(0.5, Math.min(2, this.scale + delta));
        
        // Calculate the center of the viewport
        const viewportWidth = this.mapContainer.clientWidth;
        const viewportHeight = this.mapContainer.clientHeight;
        const centerX = viewportWidth / 2 - this.offsetX;
        const centerY = viewportHeight / 2 - this.offsetY;
        
        // Adjust offset to keep the center point fixed
        this.offsetX = this.offsetX - (centerX * (newScale - this.scale)) / this.scale;
        this.offsetY = this.offsetY - (centerY * (newScale - this.scale)) / this.scale;
        
        this.scale = newScale;
        this.updateMapPosition();
    }
    
    resetView() {
        this.scale = 1;
        this.centerMap();
    }
    
    centerMap() {
        const viewportWidth = this.mapContainer.clientWidth;
        const viewportHeight = this.mapContainer.clientHeight;
        
        const mapWidth = this.map.width * this.tileSize * this.scale;
        const mapHeight = this.map.height * this.tileSize * this.scale;
        
        this.offsetX = (viewportWidth - mapWidth) / 2;
        this.offsetY = (viewportHeight - mapHeight) / 2;
        
        this.updateMapPosition();
    }
    
    updateMapPosition() {
        const mapContent = this.mapContainer.querySelector('.map-content');
        if (mapContent) {
            mapContent.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
        }
    }
    
    render() {
        // Clear the map container
        this.mapContainer.innerHTML = '';
        this.tileDomElements = [];
        this.unitDomElements = [];
        this.cityDomElements = [];
        
        // Create a content container for transforms
        const mapContent = document.createElement('div');
        mapContent.className = 'map-content';
        mapContent.style.transformOrigin = '0 0';
        this.mapContainer.appendChild(mapContent);
        
        // Render tiles
        for (const tile of this.map.tiles) {
            const tileElement = this.createTileElement(tile);
            mapContent.appendChild(tileElement);
            this.tileDomElements.push(tileElement);
        }
        
        // Render cities
        for (const city of this.map.cities) {
            const cityElement = this.createCityElement(city);
            mapContent.appendChild(cityElement);
            this.cityDomElements.push(cityElement);
        }
        
        // Render units
        for (const unit of this.map.units) {
            const unitElement = this.createUnitElement(unit);
            mapContent.appendChild(unitElement);
            this.unitDomElements.push(unitElement);
        }
        
        // Add game events notification area
        const eventsArea = document.createElement('div');
        eventsArea.id = 'game-events';
        eventsArea.className = 'game-events';
        this.mapContainer.appendChild(eventsArea);
        
        // Add map controls
        this.setupMapControls();
    }
    
    createTileElement(tile) {
        const element = document.createElement('div');
        element.className = `tile tile-${tile.type}`;
        element.dataset.x = tile.x;
        element.dataset.y = tile.y;
        
        // Apply hex grid positioning if enabled
        if (this.hexMode) {
            element.dataset.hex = "true";
            const isOddRow = tile.y % 2 !== 0;
            if (isOddRow) {
                element.dataset.y = "odd";
                element.style.left = `${tile.x * this.tileSize + this.tileSize/2}px`;
            } else {
                element.style.left = `${tile.x * this.tileSize}px`;
            }
            // Adjust vertical spacing for hex grid
            element.style.top = `${tile.y * (this.tileSize * 0.75)}px`;
        } else {
            element.style.left = `${tile.x * this.tileSize}px`;
            element.style.top = `${tile.y * this.tileSize}px`;
        }
        
        element.style.width = `${this.tileSize}px`;
        element.style.height = `${this.tileSize}px`;
        
        // Add resource indicator if present
        if (tile.resource) {
            const resourceElement = document.createElement('div');
            resourceElement.className = `tile-resource resource-${tile.resource}`;
            resourceElement.title = `${tile.resource.charAt(0).toUpperCase() + tile.resource.slice(1)}`;
            element.appendChild(resourceElement);
        }
        
        // Add river indicator if present
        if (tile.hasRiver) {
            element.classList.add('tile-river');
        }
        
        // Add improvement indicator if present
        if (tile.improvement) {
            const improvementElem = document.createElement('div');
            improvementElem.className = `tile-improvement improvement-${tile.improvement}`;
            switch(tile.improvement) {
                case 'farm': improvementElem.textContent = '🌾'; break;
                case 'mine': improvementElem.textContent = '⛏️'; break;
                case 'plantation': improvementElem.textContent = '🌱'; break;
                case 'camp': improvementElem.textContent = '🏕️'; break;
                case 'pasture': improvementElem.textContent = '🐄'; break;
                case 'quarry': improvementElem.textContent = '🪨'; break;
                case 'fishing': improvementElem.textContent = '🎣'; break;
                case 'oil_well': improvementElem.textContent = '🛢️'; break;
            }
            element.appendChild(improvementElem);
        }
        
        // Mark tile as explored or unexplored
        if (!tile.explored) {
            element.classList.add('tile-unexplored');
            // Hide details until explored
            element.style.filter = 'brightness(0.4) saturate(0)';
            element.style.opacity = '0.7';
        }
        
        // Handle click
        element.addEventListener('click', () => {
            // Deselect previous tile
            if (this.selectedTile) {
                this.selectedTile.classList.remove('tile-selected');
            }
            
            // Select this tile
            element.classList.add('tile-selected');
            this.selectedTile = element;
            
            // Emit tile selection event
            if (this.onTileSelected) {
                this.onTileSelected(tile);
            }
        });
        
        return element;
    }
    
    createCityElement(city) {
        const element = document.createElement('div');
        element.className = 'city';
        element.dataset.id = city.id;
        element.style.left = `${city.location.x * this.tileSize + this.tileSize/2}px`;
        element.style.top = `${city.location.y * this.tileSize + this.tileSize/2}px`;
        
        // Set owner color
        if (city.owner) {
            element.style.backgroundColor = city.owner.color;
            
            // Add name and population label
            const nameLabel = document.createElement('div');
            nameLabel.className = 'city-name';
            nameLabel.textContent = `${city.name} (${city.population})`;
            nameLabel.style.position = 'absolute';
            nameLabel.style.bottom = '100%';
            nameLabel.style.left = '50%';
            nameLabel.style.transform = 'translateX(-50%)';
            nameLabel.style.color = 'white';
            nameLabel.style.textShadow = '1px 1px 2px black';
            nameLabel.style.fontSize = '12px';
            nameLabel.style.whiteSpace = 'nowrap';
            element.appendChild(nameLabel);
            
            // Add production icon if producing something
            if (city.currentProduction) {
                const productionIcon = document.createElement('div');
                productionIcon.className = 'city-production';
                if (city.currentProduction.type === 'building') {
                    productionIcon.textContent = '🏗️';
                    productionIcon.title = `Building: ${city.currentProduction.id}`;
                } else if (city.currentProduction.type === 'unit') {
                    productionIcon.textContent = '🛠️';
                    productionIcon.title = `Training: ${city.currentProduction.id}`;
                }
                productionIcon.style.position = 'absolute';
                productionIcon.style.top = '-10px';
                productionIcon.style.right = '-10px';
                element.appendChild(productionIcon);
            }
            
            // Size based on population
            const size = Math.min(1.5, 0.8 + city.population * 0.1);
            element.style.transform = `translate(-50%, -50%) scale(${size})`;
        }
        
        // Handle click
        element.addEventListener('click', () => {
            // Emit city selection event
            if (this.onCitySelected) {
                this.onCitySelected(city);
            }
        });
        
        return element;
    }
    
    createUnitElement(unit) {
        const element = document.createElement('div');
        element.className = `unit unit-${unit.type}`;
        element.dataset.id = unit.id;
        element.style.left = `${unit.location.x * this.tileSize + this.tileSize/2}px`;
        element.style.top = `${unit.location.y * this.tileSize + this.tileSize/2}px`;
        element.title = `${unit.owner ? unit.owner.name : 'Unknown'}'s ${unit.type}`;
        
        // Set owner color
        if (unit.owner) {
            element.style.backgroundColor = unit.owner.color;
            element.style.border = '2px solid #fff';
            // Make active player's units more visible
            if (this.game.players[this.game.currentPlayerIndex] === unit.owner) {
                element.style.boxShadow = '0 0 10px 2px rgba(255,255,255,0.7)';
            }
        }
        
        // Add unit icon with more visible style
        const unitIcon = document.createElement('div');
        unitIcon.className = 'unit-icon';
        unitIcon.style.fontSize = '16px';
        unitIcon.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
        
        switch(unit.type) {
            case 'settler': unitIcon.textContent = '🚶'; break;
            case 'worker': unitIcon.textContent = '👷'; break;
            case 'warrior': unitIcon.textContent = '⚔️'; break;
            case 'archer': unitIcon.textContent = '🏹'; break;
            case 'spearman': unitIcon.textContent = '🔱'; break;
            case 'horseman': unitIcon.textContent = '🐎'; break;
            case 'swordsman': unitIcon.textContent = '🗡️'; break;
            case 'catapult': unitIcon.textContent = '🧨'; break;
            case 'chariot': unitIcon.textContent = '🛒'; break;
            case 'galley': unitIcon.textContent = '⛵'; break;
            case 'trireme': unitIcon.textContent = '🚢'; break;
            case 'knight': unitIcon.textContent = '🏇'; break;
            case 'pikeman': unitIcon.textContent = '🔪'; break;
            case 'musketman': unitIcon.textContent = '🔫'; break;
            case 'cavalry': unitIcon.textContent = '🐄'; break;
            case 'cannon': unitIcon.textContent = '💣'; break;
            case 'rifleman': unitIcon.textContent = '🎯'; break;
            case 'tank': unitIcon.textContent = '🚜'; break;
            case 'artillery': unitIcon.textContent = '💥'; break;
            case 'bomber': unitIcon.textContent = '✈️'; break;
            case 'fighter': unitIcon.textContent = '🛩️'; break;
            case 'submarine': unitIcon.textContent = '🛥️'; break;
            case 'battleship': unitIcon.textContent = '⚓'; break;
            case 'carrier': unitIcon.textContent = '🚢'; break;
            case 'nuclear': unitIcon.textContent = '☢️'; break;
            default: unitIcon.textContent = '👤';
        }
        element.appendChild(unitIcon);
        
        // Add health indicator
        const healthBar = document.createElement('div');
        healthBar.className = 'unit-health';
        healthBar.style.position = 'absolute';
        healthBar.style.bottom = '-4px';
        healthBar.style.left = '50%';
        healthBar.style.transform = 'translateX(-50%)';
        healthBar.style.width = '16px';
        healthBar.style.height = '3px';
        healthBar.style.backgroundColor = '#333';
        
        const healthFill = document.createElement('div');
        healthFill.style.width = `${unit.health}%`;
        healthFill.style.height = '100%';
        healthFill.style.backgroundColor = unit.health > 60 ? 'green' : unit.health > 30 ? 'yellow' : 'red';
        
        healthBar.appendChild(healthFill);
        element.appendChild(healthBar);
        
        // Add movement indicator
        if (!unit.canMove || unit.movementPoints <= 0) {
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'unit-status';
            statusIndicator.textContent = '💤';
            statusIndicator.style.position = 'absolute';
            statusIndicator.style.top = '-8px';
            statusIndicator.style.right = '-8px';
            statusIndicator.style.fontSize = '10px';
            element.appendChild(statusIndicator);
        }
        
        // Handle click
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Emit unit selection event
            if (this.onUnitSelected) {
                this.onUnitSelected(unit);
            }
        });
        
        return element;
    }
    
    updateUnits() {
        // Clear existing unit elements
        this.unitDomElements.forEach(element => element.remove());
        this.unitDomElements = [];
        
        // Create updated elements
        const mapContent = this.mapContainer.querySelector('.map-content');
        if (mapContent) {
            for (const unit of this.map.units) {
                const unitElement = this.createUnitElement(unit);
                mapContent.appendChild(unitElement);
                this.unitDomElements.push(unitElement);
            }
        }
    }
    
    updateCities() {
        // Clear existing city elements
        this.cityDomElements.forEach(element => element.remove());
        this.cityDomElements = [];
        
        // Create updated elements
        const mapContent = this.mapContainer.querySelector('.map-content');
        if (mapContent) {
            for (const city of this.map.cities) {
                const cityElement = this.createCityElement(city);
                mapContent.appendChild(cityElement);
                this.cityDomElements.push(cityElement);
            }
        }
    }
    
    highlightTile(x, y) {
        // Remove previous highlight
        const previousHighlight = this.mapContainer.querySelector('.tile-highlighted');
        if (previousHighlight) {
            previousHighlight.classList.remove('tile-highlighted');
        }
        
        // Add highlight to the specified tile
        const tileElement = this.tileDomElements.find(
            el => parseInt(el.dataset.x) === x && parseInt(el.dataset.y) === y
        );
        
        if (tileElement) {
            tileElement.classList.add('tile-highlighted');
        }
    }
    
    scrollToTile(x, y) {
        const viewportWidth = this.mapContainer.clientWidth;
        const viewportHeight = this.mapContainer.clientHeight;
        
        // Calculate the position in the scaled map
        const tileX = x * this.tileSize * this.scale;
        const tileY = y * this.tileSize * this.scale;
        
        // Calculate new offsets to center the tile
        this.offsetX = viewportWidth / 2 - tileX - (this.tileSize * this.scale) / 2;
        this.offsetY = viewportHeight / 2 - tileY - (this.tileSize * this.scale) / 2;
        
        this.updateMapPosition();
    }
}