// Fraction class for exact arithmetic
class Fraction {
    constructor(numerator, denominator = 1) {
        if (typeof numerator === 'string') {
            const parts = numerator.split('/');
            this.numerator = parseInt(parts[0]);
            this.denominator = parts.length > 1 ? parseInt(parts[1]) : 1;
        } else {
            this.numerator = numerator;
            this.denominator = denominator;
        }
        this.reduce();
    }

    reduce() {
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const g = gcd(Math.abs(this.numerator), Math.abs(this.denominator));
        this.numerator /= g;
        this.denominator /= g;
        if (this.denominator < 0) {
            this.numerator = -this.numerator;
            this.denominator = -this.denominator;
        }
    }

    add(other) {
        const num = this.numerator * other.denominator + other.numerator * this.denominator;
        const denom = this.denominator * other.denominator;
        return new Fraction(num, denom);
    }

    subtract(other) {
        const num = this.numerator * other.denominator - other.numerator * this.denominator;
        const denom = this.denominator * other.denominator;
        return new Fraction(num, denom);
    }

    multiply(other) {
        if (typeof other === 'number') {
            return new Fraction(this.numerator * other, this.denominator);
        }
        return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator);
    }

    divide(other) {
        if (typeof other === 'number') {
            return new Fraction(this.numerator, this.denominator * other);
        }
        return new Fraction(this.numerator * other.denominator, this.denominator * other.numerator);
    }

    toFloat() {
        return this.numerator / this.denominator;
    }

    toString() {
        if (this.denominator === 1) return String(this.numerator);
        return `${this.numerator}/${this.denominator}`;
    }

    toMixed() {
        const int = Math.floor(Math.abs(this.numerator) / this.denominator);
        const remainder = Math.abs(this.numerator) % this.denominator;
        const sign = this.numerator < 0 ? '-' : '';

        if (remainder === 0) return `${sign}${int}`;
        if (int === 0) return `${sign}${remainder}/${this.denominator}`;
        return `${sign}${int} and ${remainder}/${this.denominator}`;
    }
}

// Recipe data
const recipesLibrary = [
    { name: 'Iron Ingot', item: 'Iron Ingot', amount: 1, ingredients: [['Iron Ore', 1]], time: 2, building: 'Furnace' },
    { name: 'Copper Ingot', item: 'Copper Ingot', amount: 1, ingredients: [['Copper Ore', 1]], time: 2, building: 'Furnace' },
    { name: 'Silicon', item: 'Silicon', amount: 1, ingredients: [['Sand', 2]], time: 3, building: 'Furnace' },
    { name: 'Glass', item: 'Glass', amount: 1, ingredients: [['Sand', 4]], time: 6, building: 'Furnace' },
    { name: 'Tungsten Ore', item: 'Tungsten Ore', amount: 1, ingredients: [['Wolframite', 5]], time: 2.5, building: 'Furnace' },
    { name: 'Enriched Uranium', item: 'Enriched Uranium', amount: 1, ingredients: [['Uranium Ore', 30]], time: 60, building: 'Furnace' },
    { name: 'Wood Plank', item: 'Wood Plank', amount: 1, ingredients: [['Wood Log', 1]], time: 4, building: 'Workshop' },
    { name: 'Wood Frame', item: 'Wood Frame', amount: 1, ingredients: [['Wood Plank', 4]], time: 8, building: 'Workshop' },
    { name: 'Copper Wire', item: 'Copper Wire', amount: 2, ingredients: [['Copper Ingot', 3]], time: 4, building: 'Workshop' },
    { name: 'Heat Sink', item: 'Heat Sink', amount: 1, ingredients: [['Copper Ingot', 5]], time: 6, building: 'Workshop' },
    { name: 'Iron Gear', item: 'Iron Gear', amount: 1, ingredients: [['Iron Ingot', 2]], time: 4, building: 'Workshop' },
    { name: 'Iron Plating', item: 'Iron Plating', amount: 2, ingredients: [['Iron Ingot', 4]], time: 6, building: 'Workshop' },
    { name: 'Steel Rod', item: 'Steel Rod', amount: 1, ingredients: [['Steel', 3]], time: 4, building: 'Workshop' },
    { name: 'Sand', item: 'Sand', amount: 1, ingredients: [['Stone', 1]], time: 1.5, building: 'Workshop' },
    { name: 'Condenser Lens', item: 'Condenser Lens', amount: 1, ingredients: [['Glass', 3]], time: 3, building: 'Workshop' },
    { name: 'Carbon Fiber', item: 'Carbon Fiber', amount: 1, ingredients: [['Graphite', 4]], time: 8, building: 'Workshop' },
    { name: 'Coupler', item: 'Coupler', amount: 1, ingredients: [['Tungsten Carbide', 1]], time: 10, building: 'Workshop' },
    { name: 'Particle Glue', item: 'Particle Glue', amount: 10, ingredients: [['Matter Compressor', 1]], time: 30, building: 'Workshop' },
    { name: 'Graphite', item: 'Graphite', amount: 1, ingredients: [['Coal', 3], ['Wood Log', 3]], time: 4, building: 'Forge' },
    { name: 'Steel', item: 'Steel', amount: 1, ingredients: [['Graphite', 1], ['Iron Ore', 6]], time: 8, building: 'Forge' },
    { name: 'Steel (Alt)', item: 'Steel', amount: 1, ingredients: [['Iron Ore', 4], ['Coal', 4]], time: 6, building: 'Forge' },
    { name: 'Concrete', item: 'Concrete', amount: 1, ingredients: [['Sand', 10], ['Steel Rod', 1]], time: 8, building: 'Forge' },
    { name: 'Concrete (Alt)', item: 'Concrete', amount: 1, ingredients: [['Stone', 20], ['Wood Frame', 4]], time: 12, building: 'Forge' },
    { name: 'Tungsten Carbide', item: 'Tungsten Carbide', amount: 1, ingredients: [['Tungsten Ore', 2], ['Graphite', 1]], time: 5, building: 'Forge' },
    { name: 'Tungsten Carbide (Alt)', item: 'Tungsten Carbide', amount: 2, ingredients: [['Tungsten Ore', 1], ['Steel', 1]], time: 15, building: 'Forge' },
    { name: 'Electromagnet', item: 'Electromagnet', amount: 1, ingredients: [['Copper Wire', 6], ['Iron Ingot', 2]], time: 8, building: 'Machine Shop' },
    { name: 'Logic Circuit', item: 'Logic Circuit', amount: 1, ingredients: [['Copper Wire', 3], ['Silicon', 2]], time: 6, building: 'Machine Shop' },
    { name: 'Metal Frame', item: 'Metal Frame', amount: 1, ingredients: [['Wood Frame', 1], ['Iron Plating', 4]], time: 12, building: 'Machine Shop' },
    { name: 'Battery', item: 'Battery', amount: 1, ingredients: [['Electromagnet', 8], ['Graphite', 8]], time: 24, building: 'Machine Shop' },
    { name: 'Rotor', item: 'Rotor', amount: 1, ingredients: [['Steel Rod', 1], ['Iron Plating', 2]], time: 6, building: 'Machine Shop' },
    { name: 'Nano Wire', item: 'Nano Wire', amount: 1, ingredients: [['Carbon Fiber', 2], ['Glass', 4]], time: 12, building: 'Machine Shop' },
    { name: 'Gyroscope', item: 'Gyroscope', amount: 1, ingredients: [['Copper Wire', 12], ['Rotor', 2]], time: 12, building: 'Machine Shop' },
    { name: 'Energy Cube', item: 'Energy Cube', amount: 1, ingredients: [['Battery', 2], ['Industrial Frame', 1]], time: 30, building: 'Machine Shop' },
    { name: 'Empty Fuel Cell', item: 'Empty Fuel Cell', amount: 1, ingredients: [['Tungsten Carbide', 3], ['Glass', 5]], time: 15, building: 'Machine Shop' },
    { name: 'Computer', item: 'Computer', amount: 1, ingredients: [['Metal Frame', 1], ['Heat Sink', 3], ['Logic Circuit', 3]], time: 8, building: 'Industrial Factory' },
    { name: 'Electric Motor', item: 'Electric Motor', amount: 1, ingredients: [['Battery', 1], ['Iron Gear', 4], ['Rotor', 2]], time: 20, building: 'Industrial Factory' },
    { name: 'Stabilizer', item: 'Stabilizer', amount: 1, ingredients: [['Computer', 1], ['Electric Motor', 1], ['Gyroscope', 2]], time: 24, building: 'Industrial Factory' },
    { name: 'Industrial Frame', item: 'Industrial Frame', amount: 1, ingredients: [['Concrete', 6], ['Metal Frame', 2], ['Tungsten Carbide', 8]], time: 20, building: 'Industrial Factory' },
    { name: 'Tank', item: 'Tank', amount: 1, ingredients: [['Glass', 2], ['Concrete', 4], ['Tungsten Carbide', 4]], time: 10, building: 'Industrial Factory' },
    { name: 'Nuclear Fuel Cell', item: 'Nuclear Fuel Cell', amount: 1, ingredients: [['Empty Fuel Cell', 1], ['Steel Rod', 1], ['Enriched Uranium', 1]], time: 30, building: 'Industrial Factory' },
    { name: 'Turbocharger', item: 'Turbocharger', amount: 1, ingredients: [['Iron Gear', 8], ['Logic Circuit', 4], ['Nano Wire', 2], ['Coupler', 4]], time: 15, building: 'Manufacturer' },
    { name: 'Super Computer', item: 'Super Computer', amount: 1, ingredients: [['Computer', 2], ['Heat Sink', 8], ['Turbocharger', 1], ['Coupler', 8]], time: 30, building: 'Manufacturer' },
    { name: 'Matter Compressor', item: 'Matter Compressor', amount: 1, ingredients: [['Industrial Frame', 1], ['Turbocharger', 2], ['Electric Motor', 2], ['Tank', 1]], time: 30, building: 'Manufacturer' },
    { name: 'Earth Token', item: 'Earth Token', amount: 1, ingredients: [['Matter Duplicator', 1]], time: 42, building: 'Earth Teleporter' }
];

const standardResources = ['Wood Log', 'Coal', 'Iron Ore', 'Copper Ore', 'Stone', 'Wolframite'];
const uraniumResource = 'Uranium Ore';
const allResources = [...standardResources, uraniumResource];

const DEFAULT_BASE_RATE = new Fraction(75, 10); // 7.5
const GEN2_BASE_RATE = new Fraction(150, 10); // 15.0
const URANIUM_DEFAULT_RATE = new Fraction(100, 10); // 10.0
const URANIUM_GEN2_RATE = new Fraction(500, 10); // 50.0

const BOOST_PERCENTAGES = {
    nuclear: { default: new Fraction(40, 100), gen2: new Fraction(60, 100) },
    coal: new Fraction(20, 100)
};

const EXTRACTOR_MULTIPLIERS = {
    default: { 1: new Fraction(1), 2: new Fraction(3, 2), 3: new Fraction(2), 4: new Fraction(3), 5: new Fraction(4) },
    gen2: { 1: new Fraction(1), 2: new Fraction(2), 3: new Fraction(4), 4: new Fraction(8), 5: new Fraction(10) }
};

const BUILDING_TIER_MULTIPLIERS = {
    1: new Fraction(1),
    2: new Fraction(3, 2),
    3: new Fraction(2),
    4: new Fraction(3)
};

const ASSUMED_BUILDING_TIERS = {
    'Furnace': 4,
    'Workshop': 4,
    'Forge': 4,
    'Machine Shop': 4,
    'Industrial Factory': 4,
    'Manufacturer': 4,
    'Earth Teleporter': 1
};

const BELT_CAPACITY = new Fraction(480);

class RecipeCalculator {
    constructor() {
        this.worldType = 'gen2';
        this.extractorLevel = 5;
        this.nodeCounts = {};
        this.nuclearBoostedCounts = {};
        this.coalBoostedCounts = {};
        this.numNuclearPlants = new Fraction(50);
        this.resourceProductionRates = {};
    }

    setDefaults() {
        this.worldType = 'gen2';
        this.extractorLevel = 5;
        this.nodeCounts = {
            'Wood Log': new Fraction(178),
            'Coal': new Fraction(178),
            'Iron Ore': new Fraction(178),
            'Copper Ore': new Fraction(150),
            'Stone': new Fraction(150),
            'Wolframite': new Fraction(98),
            'Uranium Ore': new Fraction(40)
        };
        this.nuclearBoostedCounts = { ...this.nodeCounts };
        this.coalBoostedCounts = {
            'Wood Log': new Fraction(0),
            'Coal': new Fraction(0),
            'Iron Ore': new Fraction(0),
            'Copper Ore': new Fraction(0),
            'Stone': new Fraction(0),
            'Wolframite': new Fraction(0),
            'Uranium Ore': new Fraction(0)
        };
        this.numNuclearPlants = new Fraction(50);
    }

    calculateResourceProduction() {
        const multiplier = EXTRACTOR_MULTIPLIERS[this.worldType][this.extractorLevel];
        const nuclearBoost = BOOST_PERCENTAGES.nuclear[this.worldType];
        const coalBoost = BOOST_PERCENTAGES.coal;

        this.resourceProductionRates = {};

        allResources.forEach(resource => {
            const isUranium = resource === uraniumResource;
            const baseRate = isUranium 
                ? (this.worldType === 'default' ? URANIUM_DEFAULT_RATE : URANIUM_GEN2_RATE)
                : (this.worldType === 'default' ? DEFAULT_BASE_RATE : GEN2_BASE_RATE);
            
            const extractorRate = isUranium ? baseRate : baseRate.multiply(multiplier);
            
            const totalNodes = this.nodeCounts[resource] || new Fraction(0);
            const nuclearNodes = this.nuclearBoostedCounts[resource] || new Fraction(0);
            const coalNodes = this.coalBoostedCounts[resource] || new Fraction(0);
            const unboostedNodes = totalNodes.subtract(nuclearNodes).subtract(coalNodes);

            const production = 
                nuclearNodes.multiply(extractorRate).multiply(new Fraction(1).add(nuclearBoost))
                .add(coalNodes.multiply(extractorRate).multiply(new Fraction(1).add(coalBoost)))
                .add(unboostedNodes.multiply(extractorRate));

            this.resourceProductionRates[resource] = production;
        });
    }

    getResults() {
        return {
            worldType: this.worldType,
            extractorLevel: this.extractorLevel,
            nodeCounts: this.nodeCounts,
            resourceProductionRates: this.resourceProductionRates,
            numNuclearPlants: this.numNuclearPlants
        };
    }
}
