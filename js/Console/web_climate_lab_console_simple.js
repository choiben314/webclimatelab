/* Global Key */

const DATA_PATH = "../local_data/";
var RF_FILENAME = "rf_data.txt";
const INT_FILENAME = "intermediate_temp_data.txt";

String.prototype.toFixed = function (n) {
    return Number(this).toFixed(n);
};

function objLength(obj) {
    return Object.keys(obj).length;
}

//console.log('\nWelcome to the Web Climate Lab, Console Edition! Press \'q\' to exit.\n\nINSTRUCTIONS:\n\nWhen prompted, enter a filename, cs, and sqrtkv value separated by a space. Only a cs and sqrtkv value are required if you would like to keep the filename the same. You may append \'-a\' to the end of your arguments if you wish to output data for all years. The path to the directory containing your data files must be specified in the DATA_PATH variable in the js file.');
//runFromC();
//runModelAuto(1);
var muData = runMuOptimization();

for (var i = 1.5; i < 6.51; i += 0.1) {
    for (var j = 1.0; j < 8.01; j += 0.1) {
        var mu = getMu(i.toString().toFixed(1), j.toString().toFixed(1), muData);
        if (typeof mu !== "undefined") {
            console.log(i.toFixed(1) + " " + j.toFixed(1) + " " + mu);
        }
    }
}

function runFromC() {
    var rf_txt = readDataFromFile(DATA_PATH + RF_FILENAME);
    getInput(function (userInput) {
        var all = userInput[userInput.length - 1] === '-a';
        if (userInput.length === 2 || (userInput.length === 3 && all)) {
            var cs = userInput[0], kv = userInput[1];
        } else {
            RF_FILENAME = userInput[0], cs = userInput[1], kv = userInput[2];
            rf_txt = readDataFromFile(DATA_PATH + RF_FILENAME);
        }
        var rf_data = parseRfData(rf_txt);
        var data = runModel(3.7 / cs, Math.pow(kv, 2) / 10000, rf_data, 1);
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

function readDataFromFile(file) {
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

function runModel(lambda, kappa, rf_data, mu) {

    var startYear = 0;
    var endYear = rf_data.length - 1;
    var f = .29;
    var rho = 1025;
    var c = 3990;
    var hm = 70;
    var timestep = 860400;
    var pointsPerYear = Math.ceil(31557600 / timestep);

    var temp_anom = [0];

    var Cm = (1 - f) * rho * c * hm;
    var tau = Math.PI * Math.pow(hm, 2) / kappa;

    for (var t = 1; t < (endYear - startYear + 1) * pointsPerYear; t++) {
        var fYear = t / pointsPerYear + startYear;
        var iYear = Math.floor(fYear);
        if (iYear < endYear) {
            var Q = +rf_data[iYear] + (fYear - iYear) * (rf_data[iYear + 1] - rf_data[iYear]);
        } else {
            var Q = +rf_data[iYear] + (fYear - iYear) * (rf_data[iYear] - rf_data[iYear - 1]);
        }
        temp_anom[t] = temp_anom[t - 1] + (timestep / Cm) * (Q - lambda * temp_anom[t - 1] - ((mu * Cm * temp_anom[t - 1]) / Math.sqrt(tau * t * timestep)));

    }
    var tempsMeanA = runningAvg(temp_anom, startYear, endYear, pointsPerYear, 1);

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

function runModelAuto(mu) {
    var rf_txt = readDataFromFile(DATA_PATH + RF_FILENAME);
    var rf_data = parseRfData(rf_txt);

    for (var cs = 1.5; cs < 6.51; cs++) {
        for (var kv = 0.5; kv < 10.01; kv += 0.1) {
            var data = runModel(3.7 / cs, Math.pow(1.8095 + 1.7703 * Math.log(kv), 2) / 10000, rf_data, mu);
            console.log(cs.toFixed(1) + " " + kv.toFixed(1) + " " + data[data.length - 1]);
        }
    }
}

function runMuOptimization() {
    var int_txt = readDataFromFile(DATA_PATH + INT_FILENAME);
    var int_data = parseIntermediateData(int_txt);
    var rf_txt = readDataFromFile(DATA_PATH + RF_FILENAME);
    var rf_data = parseRfData(rf_txt);

    var muData = {};

    for (var csKey in int_data) {
        if (int_data.hasOwnProperty(csKey)) {
            for (var kvKey in int_data[csKey]) {
                if (int_data[csKey].hasOwnProperty(kvKey)) {
                    if (typeof muData[csKey] === "undefined") {
                        muData[csKey] = {};
                    }
                    muData[csKey][kvKey] = zero(csKey, kvKey, int_data[csKey][kvKey], rf_data);
                    //console.log(csKey + " " + kvKey + " " + muData[csKey][kvKey]);
                }
            }
        }
    }

    return muData;
}

function zero(cs, kv, intValue, rf_data) {

    var stop = false;
    var mu = 0;
    var muInc = 0.1;
    var finalPrev = runModel(3.7 / cs, Math.pow(kv, 2) / 10000, rf_data, mu);

    while (!stop) {
        mu += muInc;
        var data = runModel(3.7 / cs, Math.pow(kv, 2) / 10000, rf_data, mu);
        var final = data[data.length - 1];
        if (final - intValue <= 0) {
            var xInt = mu - muInc + (finalPrev - intValue) / (finalPrev - final) * muInc;
            return xInt;
        } else if (mu > 100) {
            stop = true;
            console.log("\n\nVertex not found.\n\n");
        }
        finalPrev = final;
    }
}

// Each cs object must have exactly the same set of kv values, or bad things may happen!
function getMu(cs, kv, muValues) {
    var bounds = getBounds(muValues);

    if (cs.toFixed(1) < bounds[0] || cs > bounds[1]) {
        console.log("CS Value " + cs + " is out of bounds " + bounds[0] + " to " + bounds[1] + ".");
        return;
    } else if (kv.toFixed(1) < bounds[2] || kv > bounds[3]) {
        console.log("KV Value " + kv + " is out of bounds " + bounds[2] + " to " + bounds[3] + ".");
        return;
    } else {
        if (typeof muValues[cs] !== "undefined" && typeof muValues[cs][kv] !== "undefined") {
            return muValues[cs][kv];
        } else {
            var ul, ur, bl, br;

            var csClose = getClosest(cs, muValues);
            var kvClose = getClosest(kv, muValues[csClose[0]]);

            if (cs === bounds[1]) {
                var ul = muValues[csClose[0]][kvClose[1]];
                var ur = ul;
                var bl = muValues[csClose[0]][kvClose[0]];
                var br = bl;
            } else if (kv === bounds[3]) {
                var br = muValues[csClose[1]][kvClose[0]];
                var ur = br;
                var bl = muValues[csClose[0]][kvClose[0]];
                var ul = bl;
            } else {
                var ul = muValues[csClose[0]][kvClose[1]];
                var ur = muValues[csClose[1]][kvClose[1]];
                var bl = muValues[csClose[0]][kvClose[0]];
                var br = muValues[csClose[1]][kvClose[0]];
            }

            var uWeightedAvg = ((cs - csClose[0]) / (csClose[1] - csClose[0])) * (ur - ul) + ul;
            var lWeightedAvg = ((cs - csClose[0]) / (csClose[1] - csClose[0])) * (br - bl) + bl;
            var mu = ((kv - kvClose[0]) / (kvClose[1] - kvClose[0])) * (uWeightedAvg - lWeightedAvg) + lWeightedAvg;

            return mu;
        }
    }
}

// 0 is lower bound, 1 is upper bound (indices)
function getClosest(val, arr) {
    var closest = [];
    var sorted = Object.getOwnPropertyNames(arr).sort();

    if (val === sorted[sorted.length - 1]) {
        closest[0] = sorted[sorted.length - 1];
        closest[1] = sorted[sorted.length - 1] + 5; // plus one to prevent div by zero
        return closest;
    }

    for (var i = 1; i < sorted.length && closest.length === 0; i++) {
        if (val >= sorted[i - 1] && val < sorted[i]) {
            closest[0] = sorted[i - 1];
            closest[1] = sorted[i];
        }
    }
    return closest;
}

// 0 is minimum cs, 1 is maximum cs, 2 is minimum kv, 3 is maximum kv
function getBounds(muValues) {
    var bounds = [];

    bounds[0] = Object.getOwnPropertyNames(muValues).sort()[0];
    bounds[1] = bounds[0];
    bounds[2] = muValues[bounds[0]][Object.getOwnPropertyNames(muValues[bounds[0]]).sort()[0]];
    bounds[3] = bounds[2];

    for (var csKey in muValues) {
        if (muValues.hasOwnProperty(csKey)) {
            for (var kvKey in muValues[csKey]) {
                if (muValues[csKey].hasOwnProperty(kvKey)) {
                    if (csKey < bounds[0]) {
                        bounds[0] = csKey;
                    } else if (csKey > bounds[1]) {
                        bounds[1] = csKey;
                    }
                    if (kvKey < bounds[2]) {
                        bounds[2] = kvKey;
                    } else if (kvKey > bounds[3]) {
                        bounds[3] = kvKey;
                    }
                }
            }
        }
    }

    return bounds;
}

function parseIntermediateData(filetxt) {
    var lines = filetxt.split("\n");
    var data = {};

    for (var i = 0; i < lines.length; i++) {
        arr = lines[i].split(" ");
        var cs = arr[0];
        var kv = arr[1];
        if (typeof data[cs] === "undefined") {
            data[cs] = {};
        }
        data[cs][kv] = arr[2];
    }
    return data;
}