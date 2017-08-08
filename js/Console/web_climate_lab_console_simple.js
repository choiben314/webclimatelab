/* Global Key */

const DATA_PATH = "../local_data/";
var filename = "rf_data.txt";

String.prototype.toFixed = function (n) {
    return Number(this).toFixed(n);
};

console.log('\nWelcome to the Web Climate Lab, Console Edition! Press \'q\' to exit.\n\nINSTRUCTIONS:\n\nWhen prompted, enter a filename, cs, and sqrtkv value separated by a space. Only a cs and sqrtkv value are required if you would like to keep the filename the same. You may append \'-a\' to the end of your arguments if you wish to output data for all years. The path to the directory containing your data files must be specified in the DATA_PATH variable in the js file.');
//runFromC();
runAuto();

function runFromC() {
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
        var data = runModel(3.7 / cs, Math.pow(kv, 2) / 10000, rf_data);

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
function runModel(lambda, kappa, rf_data) {

    var startYear = 0;
    var endYear = rf_data.length - 1;
    var f = .29;
    var rho = 1025;
    var c = 3990;
    var hm = 70;
    var mu = 1;
    var timestep = 86400;
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

function runAuto() {
    console.log("\n");
    var rf_txt = readRfDataFromFile(DATA_PATH + filename);
    rf_data = parseRfData(rf_txt);
    for (var cs = 1.5; cs < 6.51; cs++) {
        for (var kv = 0.5; kv < 10.01; kv += 0.1) {
            var data = runModel(3.7 / cs, Math.pow(1.8095 + 1.7703 * Math.log(kv), 2) / 10000, rf_data);
            console.log(cs.toFixed(1) + " " + kv.toFixed(1) + " " + data[data.length - 1]);
        }
    }
}