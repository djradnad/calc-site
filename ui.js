const calculator = new RecipeCalculator();

// DOM Elements
const worldTypeSelect = document.getElementById('worldType');
const extractorLevelSelect = document.getElementById('extractorLevel');
const nodeCountsContainer = document.getElementById('nodeCountsContainer');
const nuclearPlantsInput = document.getElementById('nuclearPlants');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const resourcesOutput = document.getElementById('resourcesOutput');
const recipesOutput = document.getElementById('recipesOutput');
const itemsOutput = document.getElementById('itemsOutput');
const tabButtons = document.querySelectorAll('.tab-btn');

function initializeUI() {
    calculator.setDefaults();
    renderResourceInputs();
    populateInputs();
}

function renderResourceInputs() {
    nodeCountsContainer.innerHTML = '';
    allResources.forEach(resource => {
        const group = document.createElement('div');
        group.className = 'resource-input-group';
        group.innerHTML = `
            <label for="nodes_${resource}">${resource}:</label>
            <input type="number" id="nodes_${resource}" min="0" value="0">
        `;
        nodeCountsContainer.appendChild(group);
    });
}

function populateInputs() {
    worldTypeSelect.value = calculator.worldType;
    extractorLevelSelect.value = calculator.extractorLevel;
    nuclearPlantsInput.value = calculator.numNuclearPlants.toFloat();

    allResources.forEach(resource => {
        const input = document.getElementById(`nodes_${resource}`);
        if (input && calculator.nodeCounts[resource]) {
            input.value = calculator.nodeCounts[resource].toFloat();
        }
    });
}

function updateFromUI() {
    calculator.worldType = worldTypeSelect.value;
    calculator.extractorLevel = parseInt(extractorLevelSelect.value);
    calculator.numNuclearPlants = new Fraction(parseInt(nuclearPlantsInput.value) || 0);

    allResources.forEach(resource => {
        const input = document.getElementById(`nodes_${resource}`);
        const value = parseInt(input.value) || 0;
        calculator.nodeCounts[resource] = new Fraction(value);
        calculator.nuclearBoostedCounts[resource] = new Fraction(value);
        calculator.coalBoostedCounts[resource] = new Fraction(0);
    });
}

function handleCalculate() {
    try {
        updateFromUI();
        calculator.calculateResourceProduction();
        displayResults();
        resultsSection.style.display = 'block';
        errorSection.style.display = 'none';
    } catch (error) {
        showError(error.message);
    }
}

function handleReset() {
    calculator.setDefaults();
    populateInputs();
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    resultsSection.style.display = 'none';
}

function displayResults() {
    const results = calculator.getResults();
    displayResourceResults(results);
    displayRecipeResults(results);
    displayItemFlow(results);
}

function displayResourceResults(results) {
    let html = '';
    allResources.forEach(resource => {
        const production = results.resourceProductionRates[resource];
        const belts = production.divide(BELT_CAPACITY);
        const totalNodes = results.nodeCounts[resource];

        html += `
            <div class="resource-output">
                <h4>${resource}</h4>
                <div class="resource-stats">
                    <div class="stat">
                        <div class="stat-label">Production Rate</div>
                        <div class="stat-value">${production.toFloat().toFixed(2)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Belts Required</div>
                        <div class="stat-value">${belts.toFloat().toFixed(2)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Total Nodes</div>
                        <div class="stat-value">${totalNodes.toFloat().toFixed(0)}</div>
                    </div>
                </div>
            </div>
        `;
    });
    resourcesOutput.innerHTML = html;
}

function displayRecipeResults(results) {
    let html = '<h3>Available Recipes</h3>';
    
    recipesLibrary.forEach(recipe => {
        const time = new Fraction(recipe.time);
        const itemsPerMin = new Fraction(recipe.amount).divide(time).multiply(60);
        const tier = ASSUMED_BUILDING_TIERS[recipe.building];
        const tierMultiplier = BUILDING_TIER_MULTIPLIERS[tier];
        const capacity = itemsPerMin.multiply(tierMultiplier);
        const buildingsNeeded = new Fraction(1).divide(capacity);

        html += `
            <div class="recipe-output">
                <h4>${recipe.name}</h4>
                <div class="recipe-stats">
                    <div class="stat">
                        <div class="stat-label">Produces</div>
                        <div class="stat-value">${recipe.amount} ${recipe.item}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Production Time</div>
                        <div class="stat-value">${recipe.time}s</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Building</div>
                        <div class="stat-value">${recipe.building}</div>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <strong>Ingredients:</strong>
                    ${recipe.ingredients.map(ing => `<div class="recipe-ingredient"><span class="ingredient-name">${ing[0]}</span><span class="ingredient-amount">x${ing[1]}</span></div>`).join('')}
                </div>
            </div>
        `;
    });
    
    recipesOutput.innerHTML = html;
}

function displayItemFlow(results) {
    let html = `
        <h3>Resource Summary</h3>
        <table class="item-table">
            <thead>
                <tr>
                    <th>Resource</th>
                    <th>Production/min</th>
                    <th>Belts Required</th>
                </tr>
            </thead>
            <tbody>
    `;

    allResources.forEach(resource => {
        const production = results.resourceProductionRates[resource];
        const belts = production.divide(BELT_CAPACITY);
        html += `
            <tr>
                <td>${resource}</td>
                <td>${production.toFloat().toFixed(4)}</td>
                <td>${belts.toFloat().toFixed(2)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;
    
    itemsOutput.innerHTML = html;
}

// Event listeners
calculateBtn.addEventListener('click', handleCalculate);
resetBtn.addEventListener('click', handleReset);

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Initialize on load
window.addEventListener('DOMContentLoaded', initializeUI);
