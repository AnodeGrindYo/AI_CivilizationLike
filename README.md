# 🌍 AI Civilization

Welcome to **AI Civilization**, a simulation where AI agents strategize and compete in a simplified version of the classic *Civilization* game! Watch as different AI approaches battle it out on a procedurally generated world map filled with diverse terrain, resources, and cities.

## 🚀 Overview

This project explores various artificial intelligence techniques in a turn-based strategy environment. Key features include:

- Multiple AI agents with distinct learning styles
- A hex-based procedural world map with dynamic terrain
- Cities, technologies, military units, and resources
- Famous historical leaders guiding civilizations

## 🎮 Features

### 🌎 Game Mechanics

- **Procedural World Generation** – Every game features a unique map with oceans, forests, mountains, and more.
- **Resource System** – Manage strategic (iron, horses), luxury (gold, gems), and bonus (food, production) resources.
- **City Management** – Grow cities, work tiles, construct buildings, and train armies.
- **Technology Tree** – Unlock new units, buildings, and upgrades through research.
- **Combat System** – Deploy military units, engage in battles, and capture enemy cities.
- **Victory Conditions** – Win through domination (controlling most cities), score, or surviving the time limit.

### 🧠 AI Agents

The simulation features three AI types, each with different learning strategies:

1. **Basic AI** – Uses simple rule-based logic.
2. **Q-Learning AI** – Implements tabular Q-learning for adaptive decision-making.
3. **Deep Q-Learning AI** – Employs neural networks for advanced state evaluation.

### 🔧 Customization

- Adjust game speed, map size, and AI parameters.
- Design custom reward systems to encourage specific AI behaviors.
- Import/export trained AI agents to test new strategies.

## 🏁 Getting Started

1. Open `index.html` in a modern browser.
2. Click **Start Game** to launch the simulation.
3. Watch as AI civilizations evolve and compete.
4. Use the control panel to:
   - ⏸ Pause the game
   - ⏭ Advance turns manually
   - ⚡ Adjust simulation speed

## 🛠 AI Agent Configuration

Customize AI behaviors via the **Agents Panel**:

- **Create AI agents** with different decision-making strategies.
- **Tune learning parameters** like:
  - 🔹 *Learning Rate (Alpha)* – How quickly agents adapt.
  - 🔹 *Exploration Rate (Epsilon)* – Balance between new strategies and known optimal choices.
- **Customize rewards** for:
  - 📈 Economic development
  - 🏙️ City growth
  - 🛡️ Military conquest
  - 📜 Technology advancements
  - 💎 Resource accumulation

## ⚙️ Technical Architecture

Built with modern web technologies:

- **Core Engine** – JavaScript-based game logic
- **AI Modules** – Implementing reinforcement learning
- **Rendering** – Canvas and DOM elements for visualization
- **Persistence** – Local storage for saving agents and game progress

### 🔑 Key Components

- `Game.js` – Manages turns and game state
- `Map.js` – Handles terrain generation and layout
- `Player.js` – Represents each civilization
- `Agent.js` – AI decision-making logic
- `City.js` & `Unit.js` – Manage settlements and armies
- `Technology.js` – Implements the research system
- `UIManager.js` – Renders the game and user interface

## 🔧 Development & Extensibility

AI Civilization is designed for easy expansion:

- Modify AI algorithms to test new strategies.
- Extend the technology tree or add new game mechanics.
- Integrate additional visualization tools.

Join the **AI Civilization** experiment and see which strategies dominate! 🌟
