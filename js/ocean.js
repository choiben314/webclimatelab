/**
 * Sets up a layered ocean with the specified layering.
 * @class
 * @param {Number} mixedDepth Depth of mixed layer, m
 * @param {Number} numLayers
 * @param {Number} kappa
 * @param {Number} c
 * @param {Number} rho
 */
function Ocean(mixedDepth, numLayers, kappa, c, rho) {
    this.mixedDepth = mixedDepth;
    this.numLayers = numLayers;
    this.kappa = kappa;
    this.c = c;
    this.rho = rho;
    this.area = 361900000 * 1000000;
    this.layerTemps = [];
    for (var i = 0; i < numLayers; i++) {
        this.layerTemps.push(0);
    }
    var maxDepth = 3689;
    this.depthPerLayer = (maxDepth - mixedDepth) / numLayers;
    this.timestep = Math.pow(Math.min(this.depthPerLayer, mixedDepth), 2) / (2 * kappa);
    this.ohc = 0;


    /**
     * @typedef {Object} Ocean.Run
     * @property {Number} mixedLoss Heat lost by the mixed layer, as a W/m2 flux
     * @property {Number[]} ohcs Ocean heat content by layer, J
     */
    /**
     * Run one timestep of the ocean model.
     * @param {Number} mixedTemp
     * @param {Number} stepSecs Seconds in this model step
     * @returns {Ocean.Run}
     */
    this.run = function(mixedTemp, stepSecs) {
        var newTemps = [];
        var ohcs = [];
        // Loss of energy from mixed layer to ocean in W/m^2
        var mixedLoss = this.kappa * this.c * this.rho * (mixedTemp - this.layerTemps[0]) /
                (this.depthPerLayer);
        this.ohc += mixedLoss * stepSecs * this.area;
        for (var si in this.layerTemps) {
            var i = Number(si);
            var newTemp = this.layerTemps[i];
            if (this.numLayers === 1) {
                newTemp += this.kappa * stepSecs / Math.pow(this.depthPerLayer, 2) *
                        (mixedTemp - this.layerTemps[0]);
            } else if (i === 0) {
                newTemp += this.kappa * stepSecs / Math.pow(this.depthPerLayer, 2) *
                        (this.layerTemps[1] - 2 * this.layerTemps[0] + mixedTemp);
            } else if (i === this.layerTemps.length - 1) {
                newTemp += this.kappa * stepSecs / Math.pow(this.depthPerLayer, 2) *
                        (this.layerTemps[i - 1] - this.layerTemps[i]);
            } else {
                newTemp += this.kappa * stepSecs / Math.pow(this.depthPerLayer, 2) *
                        (this.layerTemps[i + 1] - 2 * this.layerTemps[i] +
                                this.layerTemps[i - 1]);
            }
            newTemps[i] = newTemp;
            var r = this.c * this.rho * this.depthPerLayer * this.area;
            ohcs[i] = r * newTemp;
        }
        this.layerTemps = newTemps;
        return {
            mixedLoss: mixedLoss,
            ohcs: ohcs
        };
    };
}
