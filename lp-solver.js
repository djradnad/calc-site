// LP Solver implementation using glpk.js (model API)

class LPSolver {
    constructor(recipesLib, rawResList, resourceProdRates, nuclearFuelDemand) {
        this.recipes = recipesLib;
        this.rawResList = rawResList;
        this.resourceProdRates = resourceProdRates;
        this.nuclearFuelDemand = nuclearFuelDemand;
        this.glpk = window.glpk;
    }

    // Build a model object compatible with glpk.solve(model, options)
    buildModel() {
        const model = {
            name: 'recipe_lp',
            objective: {
                direction: this.glpk.GLP_MAX,
                name: 'obj',
                vars: []
            },
            subjectTo: [],
            bounds: []
        };

        const numRecipes = this.recipes.length;

        // Create a variable name for each recipe: recipe_0, recipe_1, ...
        for (let i = 0; i < numRecipes; i++) {
            const varName = `recipe_${i}`;

            // Non-negative variable
            model.bounds.push({ name: varName, type: this.glpk.GLP_LO, lb: 0 });

            // Objective coefficient: only Earth Token recipe(s) contribute
            const recipe = this.recipes[i];
            const coef = (recipe.item === 'Earth Token') ? recipe.amount : 0;
            model.objective.vars.push({ name: varName, coef });
        }

        // 1) Raw resource constraints (upper bounds on consumption)
        this.rawResList.forEach(res => {
            const vars = [];
            this.recipes.forEach((recipe, recipeIdx) => {
                recipe.ingredients.forEach(ing => {
                    if (ing[0] === res) {
                        vars.push({ name: `recipe_${recipeIdx}`, coef: ing[1] });
                    }
                });
            });

            model.subjectTo.push({
                name: `resource_${res}`,
                vars,
                bnds: { type: this.glpk.GLP_UP, ub: Number(this.resourceProdRates[res] || 0) }
            });
        });

        // 2) Material balance constraints (equalities) for intermediate items
        // Collect all items (produced + ingredients)
        const allItems = new Set();
        this.recipes.forEach(r => {
            allItems.add(r.item);
            r.ingredients.forEach(ing => allItems.add(ing[0]));
        });
        this.rawResList.forEach(r => allItems.add(r));

        allItems.forEach(item => {
            if (!this.rawResList.includes(item) && item !== 'Earth Token') {
                const vars = [];

                this.recipes.forEach((recipe, recipeIdx) => {
                    // production = positive
                    if (recipe.item === item) {
                        vars.push({ name: `recipe_${recipeIdx}`, coef: recipe.amount });
                    }
                    // consumption = negative
                    recipe.ingredients.forEach(ing => {
                        if (ing[0] === item) {
                            vars.push({ name: `recipe_${recipeIdx}`, coef: -ing[1] });
                        }
                    });
                });

                const boundValue = (item === 'Nuclear Fuel Cell') ? Number(this.nuclearFuelDemand || 0) : 0;
                model.subjectTo.push({
                    name: `balance_${item}`,
                    vars,
                    bnds: { type: this.glpk.GLP_FX, lb: boundValue, ub: boundValue }
                });
            }
        });

        return model;
    }

    // Solve the LP problem using glpk.solve
    async solve() {
        try {
            if (!this.glpk || typeof this.glpk.solve !== 'function') {
                return { success: false, message: 'GLPK not available or incompatible build loaded.' };
            }

            const model = this.buildModel();
            const options = { msgLevel: this.glpk.GLP_MSG_OFF };

            // glpk.solve is synchronous in many builds; wrap in Promise for consistency
            const out = await new Promise((resolve) => {
                const result = this.glpk.solve(model, options);
                resolve(result);
            });

            // result shape varies between builds; try to access result.result or result
            const sol = out.result || out;

            const status = sol.status !== undefined ? sol.status : (sol.hasOwnProperty('z') ? this.glpk.GLP_OPT : null);

            if (status === this.glpk.GLP_OPT || sol.status === this.glpk.GLP_OPT) {
                // Extract variable values
                const vars = sol.vars || sol.columns || {};

                const solution = {};
                for (let i = 0; i < this.recipes.length; i++) {
                    const varName = `recipe_${i}`;
                    const val = (vars[varName] !== undefined) ? Number(vars[varName]) : 0;
                    if (val > 1e-12) {
                        solution[this.recipes[i].name] = val;
                    }
                }

                // Calculate resource consumption
                const resourceConsumption = {};
                this.rawResList.forEach(res => resourceConsumption[res] = 0);

                Object.entries(solution).forEach(([recipeName, rate]) => {
                    const recipe = this.recipes.find(r => r.name === recipeName);
                    if (!recipe) return;
                    recipe.ingredients.forEach(ing => {
                        if (resourceConsumption.hasOwnProperty(ing[0])) {
                            resourceConsumption[ing[0]] += ing[1] * rate;
                        }
                    });
                });

                // Objective value
                const earthTokens = sol.z !== undefined ? sol.z : (out.z !== undefined ? out.z : null);

                return {
                    success: true,
                    optimalRecipeRates: solution,
                    resourceConsumption,
                    earthTokens
                };
            } else {
                return { success: false, message: `LP solve failed with status: ${sol.status}` };
            }
        } catch (error) {
            return { success: false, message: `Error solving LP: ${error.message}` };
        }
    }
}
