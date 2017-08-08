/* Global Key */

const DATA_PATH = "../local_data/";
var filename = "rf_data.txt";

String.prototype.toFixed = function (n) {
    return Number(this).toFixed(n);
};

console.log('\nWelcome to the Web Climate Lab, Console Edition! Press \'q\' to exit.\n\nINSTRUCTIONS:\n\nWhen prompted, enter a filename, cs, and sqrtkv value separated by a space. Only a cs and sqrtkv value are required if you would like to keep the filename the same. You may append \'-a\' to the end of your arguments if you wish to output data for all years. The path to the directory containing your data files must be specified in the DATA_PATH variable in the js file.');
runFromCP();

function runFromCP() {
    var rf_txt = readRfDataFromFile(DATA_PATH + filename);
    getInput(function (userInput) {
        var all = userInput[userInput.length - 1] === '-a';
        if (userInput.length === 2 || (userInput.length === 3 && all)) {
            var cs = userInput[0], kv = userInput[1];
        } else {
            filename = userInput[0], cs = userInput[1], kv = userInput[2];
            rf_txt = readRfDataFromFile(DATA_PATH + filename);
        }
        var rf_data = parseRfData(rf_txt);
        var data = runModelNoRCP(cs.toFixed(1), kv.toFixed(1), 3.7 / cs, Math.pow(kv, 2) / 10000, false, rf_data);

        if (all) {
            for (var i = 0; i < data.length; i++) {
                console.log(i + ": " + data[i]);
            }
        } else {
            console.log(data.length - 1 + ": " + data[data.length - 1]);
        }
    });
}

function getInput(callback) {
    var input = [];
    var readline = require('readline');
    var rl = readline.createInterface(process.stdin, process.stdout);
    rl.question('\n---\n\nFilename, CS, and SqrtKV (separated by a space): ', function (cs) {
        input = cs.split(" ");
        if (input[0].toLowerCase() === 'q') {
            process.exit();
        } else {
            callback(input);
            getInput(callback);
        }
    });
}

function readRfDataFromFile(file) {
    var fs = require('fs');
    return fs.readFileSync(file, 'utf8');
}

function parseRfData(filetxt) {
    var lines = filetxt.split("\n");
    var data = [];
    for (var i = 0; i < lines.length; i++) {
        data[i] = lines[i].split(",")[1];
    }
    return data;
}

function runModelNoRCP(cs, kv, lambda, kappa, out, rf_data) {
    var startYear = 0;
    var endYear = rf_data.length - 1;
    var numLayers = 20;
    var f = .29;
    var k = 1.45;
    var rho = 1025;
    var c = 3990;
    var hm = 70;
    var tempsLand = [0];
    var tempsMixed = [0];
    var tempsMean = [0];
    var ohcs = [0];
    var ocean = new Ocean(hm, numLayers, kappa, c, rho);
    var pointsPerYear = Math.ceil(31557600 / ocean.timestep);
    var secsPerPoint = 31557600 / pointsPerYear;
    for (var t = 1; t < (endYear - startYear + 1) * pointsPerYear; t++) {
        var fYear = t / pointsPerYear + startYear;
        var iYear = Math.floor(fYear);
        var oceanRun = ocean.run(tempsMixed[t - 1], secsPerPoint);
        var q = rf_data[iYear];
        tempsMixed[t] = tempsMixed[t - 1] + (q - lambda * tempsMixed[t - 1] -
                oceanRun.mixedLoss + (k / (1 - f)) * (tempsLand[t - 1] -
                tempsMixed[t - 1])) * secsPerPoint / (rho * c * hm);
        tempsLand[t] = (f * q + k * tempsMixed[t]) / (f * lambda + k);
        tempsMean[t] = f * tempsLand[t] + (1 - f) * tempsMixed[t];
        ohcs[t] = (ocean.ohc + tempsMixed[t] * c * rho * hm *
                ocean.area) / Math.pow(10, 23);
    }
    var tempsMeanA = runningAvg(tempsMean, startYear, endYear, pointsPerYear, 1);

    if (out) {
        outputTempsToFile(tempsMeanA, cs, kv);
    }

    return tempsMeanA;
}

function averageTemp(temps, startYear, endYear) {
    var tempsToUse = temps.slice(startYear, endYear + 1);
    var total = 0;
    for (var i in tempsToUse) {
        total += tempsToUse[i];
    }
    return total / (endYear - startYear + 1);
}

function runningAvg(series, startYear, endYear, pointsPerYear, period) {
    var avgByMidYear = [];
    for (var y = startYear; y <= endYear - period + 1; y++) {
        var sum = 0;
        for (var i = (y - startYear) * pointsPerYear; i < (y - startYear + period) * pointsPerYear; i++) {
            sum += series[i];
        }
        var midYear = y + Math.floor(period / 2);
        avgByMidYear[midYear] = sum / (period * pointsPerYear);
    }
    return avgByMidYear;
}

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
    this.run = function (mixedTemp, stepSecs) {
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
