// LP Solver implementation using glpk.js

class LPSolver {
    constructor(recipesLib, rawResList, resourceProdRates, nuclearFuelDemand) {
        this.recipes = recipesLib;
        this.rawResList = rawResList;
        this.resourceProdRates = resourceProdRates;
        this.nuclearFuelDemand = nuclearFuelDemand;
        this.glpk = window.glpk;
    }

    // Build the LP problem
    buildProblem() {
        // Collect all unique items
        const allItems = new Set();
        this.recipes.forEach(recipe => {
            allItems.add(recipe.item);
            recipe.ingredients.forEach(ing => allItems.add(ing[0]));
        });
        this.rawResList.forEach(res => allItems.add(res));
        
        this.allItems = Array.from(allItems).sort();
        this.itemToIdx = {};
        this.allItems.forEach((item, idx) => {
            this.itemToIdx[item] = idx;
        });

        const numRecipes = this.recipes.length;
        const numItems = this.allItems.length;
        const numRawRes = this.rawResList.length;

        // Build glpk problem
        const mip = new this.glpk.Problem();
        mip.setDirection(this.glpk.GLP_MAX); // Maximize

        // Variables: one for each recipe
        for (let i = 0; i < numRecipes; i++) {
            mip.addRows(1);
            mip.addCols(1);
            mip.setColName(i + 1, `recipe_${i}`);
            mip.setColKind(i + 1, this.glpk.GLP_CV); // Continuous variable
            mip.setColBnds(i + 1, this.glpk.GLP_LO, 0, 0); // x >= 0
        }

        // Objective: maximize Earth Token production (recipe index for "Earth Token")
        const earthTokenIdx = this.recipes.findIndex(r => r.item === 'Earth Token');
        if (earthTokenIdx >= 0) {
            mip.setRowName(1, 'obj');
            const earthCoeffs = new Array(numRecipes + 1).fill(0);
            earthCoeffs[earthTokenIdx + 1] = this.recipes[earthTokenIdx].amount;
            mip.setMatRow(1, earthCoeffs);
        }

        // Constraint 1: Raw resource limits (inequality constraints)
        let constraintIdx = 2;
        this.rawResList.forEach(res => {
            mip.addRows(1);
            const coeffs = new Array(numRecipes + 1).fill(0);
            
            // For each recipe that uses this resource
            this.recipes.forEach((recipe, recipeIdx) => {
                recipe.ingredients.forEach(ing => {
                    if (ing[0] === res) {
                        coeffs[recipeIdx + 1] = ing[1];
                    }
                });
            });
            
            mip.setRowName(constraintIdx, `resource_${res}`);
            mip.setRowBnds(constraintIdx, this.glpk.GLP_UP, 0, this.resourceProdRates[res] || 0);
            mip.setMatRow(constraintIdx, coeffs);
            constraintIdx++;
        });

        // Constraint 2: Material balance (equality constraints)
        this.allItems.forEach(item => {
            if (!this.rawResList.includes(item) && item !== 'Earth Token') {
                mip.addRows(1);
                const coeffs = new Array(numRecipes + 1).fill(0);
                
                this.recipes.forEach((recipe, recipeIdx) => {
                    // Production: positive
                    if (recipe.item === item) {
                        coeffs[recipeIdx + 1] += recipe.amount;
                    }
                    
                    // Consumption: negative
                    recipe.ingredients.forEach(ing => {
                        if (ing[0] === item) {
                            coeffs[recipeIdx + 1] -= ing[1];
                        }
                    });
                });
                
                mip.setRowName(constraintIdx, `balance_${item}`);
                let bound = item === 'Nuclear Fuel Cell' ? this.nuclearFuelDemand : 0;
                mip.setRowBnds(constraintIdx, this.glpk.GLP_FX, bound, bound);
                mip.setMatRow(constraintIdx, coeffs);
                constraintIdx++;
            }
        });

        return mip;
    }

    // Solve the LP problem
    async solve() {
        try {
            const mip = this.buildProblem();
            
            // Solve
            const options = {
                msglev: this.glpk.GLP_MSG_OFF,
                presolve: this.glpk.GLP_ON
            };
            
            const result = await this.glpk.simplex(mip, options);
            
            if (result.status === this.glpk.GLP_OPT) {
                // Extract solution
                const solution = {};
                const numRecipes = this.recipes.length;
                
                for (let i = 0; i < numRecipes; i++) {
                    const rate = mip.mipColVal(i + 1);
                    if (rate > 1e-9) {
                        solution[this.recipes[i].name] = rate;
                    }
                }
                
                // Calculate resource consumption
                const resourceConsumption = {};
                this.rawResList.forEach(res => {
                    resourceConsumption[res] = 0;
                });
                
                Object.entries(solution).forEach(([recipeName, rate]) => {
                    const recipe = this.recipes.find(r => r.name === recipeName);
                    recipe.ingredients.forEach(ing => {
                        if (resourceConsumption.hasOwnProperty(ing[0])) {
                            resourceConsumption[ing[0]] += ing[1] * rate;
                        }
                    });
                });
                
                return {
                    success: true,
                    optimalRecipeRates: solution,
                    resourceConsumption: resourceConsumption,
                    earthTokens: mip.mipObjVal()
                };
            } else {
                return {
                    success: false,
                    message: `LP solve failed with status: ${result.status}`
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Error solving LP: ${error.message}`
            };
        }
    }
}
