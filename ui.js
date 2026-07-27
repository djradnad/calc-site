const calculator = new RecipeCalculator();
const GLPK_AVAILABLE = typeof window.glpk !== 'undefined';

// Resource max limits
const RESOURCE_MAX_LIMITS = {
    'Wood Log': 178,
    'Coal': 178,
    'Iron Ore': 178,
    'Copper Ore': 150,
    'Stone': 150,
    'Wolframite': 98,
    'Uranium Ore': 40
};

// DOM Elements
const nodeCountsContainer = document.getElementById('nodeCountsContainer');
const nuclearPlantsInput = document.getElementById('nuclearPlants');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsSection = document.getElementById('resultsSection');
const loadingSection = document.getElementById('loadingSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const resourcesOutput = document.getElementById('resourcesOutput');
const recipesOutput = document.getElementById('recipesOutput');
const tabButtons = document.querySelectorAll('.tab-btn');

function initializeUI() {
    calculator.setDefaults();
    renderResourceInputs();
    populateInputs();
}

function renderResourceInputs() {
    nodeCountsContainer.innerHTML = '';
    allResources.forEach(resource => {
        const maxLimit = RESOURCE_MAX_LIMITS[resource] || 100;
        const group = document.createElement('div');
        group.className = 'resource-input-group';
        group.innerHTML = `
            <label for="nodes_${resource}">${resource}:</label>
            <input type="number" id="nodes_${resource}" min="0" max="${maxLimit}" value="0">
            <div class="input-max">Max: ${maxLimit}</div>
        `;
        nodeCountsContainer.appendChild(group);

        // Add validation listener
        const input = group.querySelector('input');
        input.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 0;
            if (value > maxLimit) {
                e.target.value = maxLimit;
            }
        });
        input.addEventListener('blur', (e) => {
            const value = parseInt(e.target.value) || 0;
            if (value > maxLimit) {
                e.target.value = maxLimit;
            }
        });
    });
}

function populateInputs() {
    nuclearPlantsInput.value = calculator.numNuclearPlants.toFloat();

    allResources.forEach(resource => {
        const input = document.getElementById(`nodes_${resource}`);
        if (input && calculator.nodeCounts[resource]) {
            input.value = calculator.nodeCounts[resource].toFloat();
        }
    });
}

function updateFromUI() {
    // Nuclear plants
    calculator.numNuclearPlants = new Fraction(parseInt(nuclearPlantsInput.value) || 0);

    // Node counts with validation
    allResources.forEach(resource => {
        const input = document.getElementById(`nodes_${resource}`);
        const maxLimit = RESOURCE_MAX_LIMITS[resource];
        let value = parseInt(input.value) || 0;
        
        // Enforce max limit
        if (value > maxLimit) {
            value = maxLimit;
            input.value = maxLimit;
        }
        
        calculator.nodeCounts[resource] = new Fraction(value);
        calculator.nuclearBoostedCounts[resource] = new Fraction(value);
        calculator.coalBoostedCounts[resource] = new Fraction(0);
    });
}

async function handleCalculate() {
    try {
        if (!GLPK_AVAILABLE) {
            showError('GLPK library not loaded. Please refresh the page.');
            return;
        }
        
        updateFromUI();
        calculator.calculateResourceProduction();
        
        // Show loading
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
        loadingSection.style.display = 'block';
        
        // Solve LP
        const rawResList = ['Wood Log', 'Coal', 'Iron Ore', 'Copper Ore', 'Stone', 'Wolframite', 'Uranium Ore'];
        const nuclearFuelDemand = calculator.numNuclearPlants.toFloat() * 0.5; // 1 fuel cell every 2 minutes
        
        // Convert recipes to simple format for LP solver
        const recipeData = recipesLibrary.map((recipe, idx) => ({
            name: recipe.name,
            item: recipe.item,
            amount: recipe.amount,
            ingredients: recipe.ingredients.map(ing => [ing[0], ing[1]])
        }));
        
        // Convert resource rates to numbers
        const resourceRates = {};
        allResources.forEach(res => {
            resourceRates[res] = calculator.resourceProductionRates[res].toFloat();
        });
        
        const solver = new LPSolver(recipeData, rawResList, resourceRates, nuclearFuelDemand);
        const lpResult = await solver.solve();
        
        loadingSection.style.display = 'none';
        
        if (lpResult.success) {
            displayResults(lpResult, solver, resourceRates);
            resultsSection.style.display = 'block';
            errorSection.style.display = 'none';
        } else {
            showError(lpResult.message);
        }
    } catch (error) {
        loadingSection.style.display = 'none';
        showError(error.message);
    }
}

function handleReset() {
    calculator.setDefaults();
    populateInputs();
    resultsSection.style.display = 'none';
    loadingSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    resultsSection.style.display = 'none';
    loadingSection.style.display = 'none';
}

function displayResults(lpResult, solver, resourceRates) {
    displayRawResourceProduction(lpResult, resourceRates);
    displayDetailedRecipeBreakdown(lpResult);
}

function displayRawResourceProduction(lpResult, resourceRates) {
    let html = '<h3>Raw Resource Production (Adjusted to Consumption)</h3>';
    
    const rawResList = ['Wood Log', 'Coal', 'Iron Ore', 'Copper Ore', 'Stone', 'Wolframite', 'Uranium Ore'];
    const beltCapacity = 480;
    
    rawResList.forEach(res => {
        const maxProduction = resourceRates[res] || 0;
        const actualConsumption = lpResult.resourceConsumption[res] || 0;
        const belts = maxProduction / beltCapacity;
        const consumptionBelts = actualConsumption / beltCapacity;
        
        html += `
            <div class="resource-output">
                <h4>${res}</h4>
                <div class="resource-stats">
                    <div class="stat">
                        <div class="stat-label">Max Production Rate</div>
                        <div class="stat-value">${maxProduction.toFixed(4)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Actual Consumption</div>
                        <div class="stat-value">${actualConsumption.toFixed(4)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Max Belts</div>
                        <div class="stat-value">${belts.toFixed(2)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Consumption Belts</div>
                        <div class="stat-value">${consumptionBelts.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    resourcesOutput.innerHTML = html;
}

function displayDetailedRecipeBreakdown(lpResult) {
    let html = '<h3>Detailed Recipe Breakdown</h3>';
    const beltCapacity = 480;
    
    const sortedRecipes = Object.entries(lpResult.optimalRecipeRates)
        .sort((a, b) => b[1] - a[1]);
    
    sortedRecipes.forEach(([recipeName, rate]) => {
        const recipe = recipesLibrary.find(r => r.name === recipeName);
        if (!recipe) return;
        
        const produced = recipe.amount * rate;
        const prodTime = recipe.time;
        const building = recipe.building;
        const beltsProduced = produced / beltCapacity;
        
        html += `
            <div class="recipe-output">
                <h4>${recipeName}</h4>
                <div class="recipe-stats">
                    <div class="stat">
                        <div class="stat-label">Run Rate (batches/min)</div>
                        <div class="stat-value">${rate.toFixed(6)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Total Produced</div>
                        <div class="stat-value">${produced.toFixed(4)} units/min</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Belts for Production</div>
                        <div class="stat-value">${beltsProduced.toFixed(2)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Building Used</div>
                        <div class="stat-value">${building}</div>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <strong>Ingredients Consumed:</strong>
                    ${recipe.ingredients.map(ing => `<div class="recipe-ingredient"><span class="ingredient-name">${ing[0]}</span><span class="ingredient-amount">${(ing[1] * rate).toFixed(4)} units/min</span></div>`).join('')}
                </div>
            </div>
        `;
    });
    
    if (sortedRecipes.length === 0) {
        html += '<p style="color: var(--text-secondary); margin-top: 1rem;">No active recipes in optimal solution.</p>';
    }
    
    recipesOutput.innerHTML = html;
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
