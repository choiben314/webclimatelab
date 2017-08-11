/* Global Key */

const DATA_PATH = "local_data/";
var RF_FILENAME = "rf_data.txt";
const INT_FILENAME = "intermediate_temp_data_1.txt";

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

String.prototype.toFixed = function (n) {
    return Number(this).toFixed(n);
};

function objLength(obj) {
    return Object.keys(obj).length;
}

var muData;

$(document).ready(function () {
    muData = runMuOptimization();
    webClimateLab = {
        loaded: false,
        runYet: false
    };
    $("#cp_run").click(function () {
        runFromCP(false);
    });
    $("#cp_output").click(function () {
        runFromCP(true);
    });
    $("input[name=\"rcp\"]").change(function () {
        runFromCP(false);
    });

    addRangeDisps();
    addHelpListeners();
    setupGlobals();
    getStaticData();
    goLoad();
});

function addRangeDisps() {
    $("#clim_sens_param").on("input", function () {
        webClimateLab.distribs.plotCs(Number(this.value));
    });
    $("#diff_param").on("input", function () {
        webClimateLab.distribs.plotSqrtkv(Number(this.value));
    });
}

function updateDisp(id, val) {
    $(id).text(val);
}

function setupGlobals() {
    webClimateLab.piAdjust = 0.32; //Adjustment from pre-industrial average to 1961-1990 average

    var projCtx = $("#results_display")[0].getContext("2d");
//    document.addEventListener("mousemove", function (e) {
//        console.log(e.clientX + " " + e.clientY);
//    });

    webClimateLab.fGraph = new Graph(projCtx, null, null, 245, 250, 15, 1900, 2100, null, null);
    webClimateLab.fGraph.title = "Projected Global Mean Temperature";
    webClimateLab.fGraph.yCaption = "Global warming from pre-industrial avg (°C)";
    webClimateLab.fGraph.has2100 = true;
    webClimateLab.fGraph.cmipOp = 0.05;

    webClimateLab.projView = new View(50, 300, projCtx);
    webClimateLab.projView.add(webClimateLab.fGraph, 0, -20, true);

    var projCenter = (webClimateLab.fGraph.originX + webClimateLab.fGraph.maxX) / 2 - 5;
    webClimateLab.projView.key1 = new Key(projCenter, 315, 1, projCtx);
    webClimateLab.projView.key1.add("#FF0000", "Model Results");
    webClimateLab.projView.key1.add("#000000", "Historical Estimates");
//    webClimateLab.projView.key1.add("#4D94FF", "Historical Uncertainty Range");
    webClimateLab.projView.key1.add("#80BFFF", "Paris Agreement Goal");
    webClimateLab.projView.key2 = new Key(projCenter, 315, 1, projCtx);
    webClimateLab.projView.key2.add("#FF0000", "Model Results");
    webClimateLab.projView.key2.add("#000000", "Historical Estimate");
//    webClimateLab.projView.key2.add("#4D94FF", "Historical Uncertainty Range");
//    webClimateLab.projView.key2.add("#498D34", "State of the Art Model Estimate");
    webClimateLab.projView.key2.add("#99C199", "State of the Art Model Range");
    webClimateLab.projView.key2.add("#80BFFF", "Paris Agreement Goal", 20);

//    document.addEventListener("mousemove", function (e) {
//        console.log(webClimateLab.projView.x);
//        //console.log(webClimateLab.fGraph.originX + " " + webClimateLab.fGraph.originY + " " + webClimateLab.fGraph.width + " " + webClimateLab.fGraph.height);
//    });
}

function getStaticData() {
    $.ajax("get_static_data.php", {
        type: "GET",
        dataType: "json"
    })
            .done(function (json) {
                webClimateLab.rcpForcings = json["rcp"];
                webClimateLab.modelTemps = json["model_temps"];
                for (var rcp in webClimateLab.modelTemps) {
                    for (var year in webClimateLab.modelTemps[rcp]) {
                        webClimateLab.modelTemps[rcp][year][0] += webClimateLab.piAdjust; // mean
                        webClimateLab.modelTemps[rcp][year][1] += webClimateLab.piAdjust; // lower
                        webClimateLab.modelTemps[rcp][year][2] += webClimateLab.piAdjust; // upper
                    }
                }

                var gtemps = json["gtemps"];
                for (var i in gtemps) {
                    gtemps[i][0] += webClimateLab.piAdjust;
                    //gtemps[i][1] += webClimateLab.piAdjust;
                    //gtemps[i][2] += webClimateLab.piAdjust;
                }
                webClimateLab.fGraph.addPastTemps(gtemps);
                webClimateLab.fGraph.addSAModelTemps(webClimateLab.modelTemps);

                webClimateLab.cs_dist = json["cs_dist"];
                webClimateLab.sqrtkv_dist = json["sqrtkv_dist"];
                webClimateLab.fae_dist = json["fae_dist"];
                webClimateLab.ar5_proj = json["ar5_proj"];
                FontDetect.onFontLoaded("urbanobold_condensed", doneLoading, function () {
                    console.log("Webfont failed to load in time, using fallback");
                    doneLoading();
                });
            })
            .fail(function (xhr, status, errorThrown) {
                console.log("Error: " + errorThrown);
                console.log("Status: " + status);
            });
}

function doneLoading() {
    webClimateLab.loaded = true;
    var csGraph = new Graph($("#cs_disp")[0].getContext("2d"), 20, 107, 140, 100,
            10, null, null, 0, null);
    var sqrtkvGraph = new Graph($("#sqrtkv_disp")[0].getContext("2d"), 20, 107, 140, 100,
            10, null, null, 0, null);
    webClimateLab.distribs = new Distribs(csGraph, sqrtkvGraph);
    webClimateLab.distribs.plotCs(Number($("#clim_sens_param").val()));
    webClimateLab.distribs.plotSqrtkv(Number($("#diff_param").val()));
    goStart();
    webClimateLab.projView.draw(false);
    var windowWidth = $(window).width();
    window.onresize = function () {
        // iOS Safari scroll resize fix
        if ($(window).width() !== windowWidth)
            handleResize();
        windowWidth = $(window).width();
    };
    handleResize();
}

function runModel(lambda, kappa, rcp, mu, out) {
    var start = new Date().getTime();
    var startYear = 1765;
    var endYear = 2100;
    var frcs = webClimateLab.rcpForcings;
    var f = .29;
    var rho = 1025;
    var c = 3990;
    var hm = 70;
    var timestep = 864000;
    var pointsPerYear = Math.ceil(31557600 / timestep);

    var temp_anom = [0];

    var Cm = (1 - f) * rho * c * hm;
    var tau = Math.PI * Math.pow(hm, 2) / kappa;

    for (var t = 1; t < (endYear - startYear + 1) * pointsPerYear; t++) {
        var fYear = t / pointsPerYear + startYear;
        var iYear = Math.floor(fYear);
        //console.log(iYear + " " + frcs[rcp][iYear][2]);        

        if (iYear < endYear) {
            var Q = frcs[rcp][iYear][1] + frcs[rcp][iYear][0] + (fYear - iYear) * ((frcs[rcp][iYear + 1][0] + frcs[rcp][iYear + 1][1]) - (frcs[rcp][iYear][0] + frcs[rcp][iYear][1]));
        } else {
            var Q = frcs[rcp][iYear][1] + frcs[rcp][iYear][0] + (fYear - iYear) * ((frcs[rcp][iYear][1] + frcs[rcp][iYear][0]) - (frcs[rcp][iYear - 1][1] + frcs[rcp][iYear - 1][0]));
        }
        temp_anom[t] = temp_anom[t - 1] + (timestep / Cm) * (Q - lambda * temp_anom[t - 1] - ((mu * Cm * temp_anom[t - 1]) / Math.sqrt(tau * t * timestep)));
    }
    var tempsMeanA = runningAvg(temp_anom, startYear, endYear, pointsPerYear, 1);
    // Average of model's output temperatures between 1961 and 1990
    var gAdjust = averageTemp(tempsMeanA, 1961, 1990);
    // Average of historical observed temperatures between 1961 and 1990
    var piAdjust = webClimateLab.piAdjust;
    setIntroProj2100(tempsMeanA[2100] - gAdjust + piAdjust);
    var tempsMeanAdjusted = [];
    for (var i in tempsMeanA) {
        tempsMeanAdjusted[i] = tempsMeanA[i] - gAdjust;
    }
    var tempsMeanPIAdjusted = [];
    for (var i in tempsMeanA) {
        tempsMeanPIAdjusted[i] = tempsMeanA[i] - gAdjust + piAdjust;
    }
    webClimateLab.fGraph.addModelTemps(tempsMeanPIAdjusted);
    webClimateLab.projView.draw();

    console.log(new Date().getTime() - start + " ms");

    if (out) {
        outputTempsToFile(tempsMeanPIAdjusted, 3.7 / lambda, Math.sqrt(kappa * 10000));
    }
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

function setIntroProj2100(proj2100) {
    webClimateLab.proj2100 = proj2100;
    var stack = webClimateLab.introStack;
    if (stack[stack.length - 1] === goStep3 || stack[stack.length - 1] === goDone) {
        setProjCaption(proj2100);
    }
}

function runFromCP(out) {
    webClimateLab.runYet = true;
    webClimateLab.rcp = $("input[name=\"rcp\"]:checked").val();

    var csValue = Number($("#clim_sens_param").val()).toFixed(1);
    var kvValue = Number($("#diff_param").val()).toFixed(1);
    runModel(3.7 / csValue, Math.pow(kvValue, 2) / 10000, webClimateLab.rcp, getMu(csValue, kvValue, muData), out);
}

function outputTempsToFile(series, cs, kv) {
    xval = 1765; // change to 1765 if using rcp data, or 0 or some other start index if other rcp/forcing data
    var txt = "";
    if (webClimateLab.runYet === true) {
        txt += "\nCS: " + cs.toFixed(1) + " | KV: " + kv.toFixed(1) + "\n";
        while (series[xval] !== undefined) {
            console.log('Year: ' + xval + ' | Temperature: ' + series[xval]);
            txt += xval + "," + series[xval] + "\n";
            xval++;
        }
    }
    uri = "data:application/octet-stream," + encodeURIComponent(txt);
    var date = new Date().toISOString().slice(0, 19).replace(/-/g, "");
    $("#cp_output").attr("href", uri).attr("download", "model_temp_data-" + date + ".txt");
}


function handleResize() {
    if (getActiveMQ() === "mq-singlewide") {
        $("#results_display")[0].width = $(window).width() - 20;
        $("#results_display")[0].height = 370;
        webClimateLab.fGraph.width = $(window).width() - 75;
        webClimateLab.fGraph.height = 250;
        webClimateLab.projView.y = 300;
        webClimateLab.projView.key1.y = 315;
        webClimateLab.projView.key2.y = 315;
    } else if (getActiveMQ() === "mq-sidetune" || getActiveMQ() === "mq-floatintro") {
        $("#main").css("max-width", "");
        $("#results_display")[0].width = $(window).width() - 285;
        $("#results_display")[0].height = 500;
        webClimateLab.fGraph.width = $(window).width() - 340;
        webClimateLab.fGraph.height = 395;
        webClimateLab.projView.y = 445;
        webClimateLab.projView.key1.y = 460;
        webClimateLab.projView.key2.y = 460;
    } else if (getActiveMQ() === "mq-maxed") {
        $("#main").css("max-width", "");
        $("#results_display")[0].width = 1200 - 285;
        $("#results_display")[0].height = 500;
        webClimateLab.fGraph.width = 1200 - 340;
        webClimateLab.fGraph.height = 395;
        webClimateLab.projView.y = 445;
        webClimateLab.projView.key1.y = 460;
        webClimateLab.projView.key2.y = 460;
    }

    webClimateLab.projView.draw(webClimateLab.runYet);
    webClimateLab.projView.key1.x = (webClimateLab.fGraph.originX + webClimateLab.fGraph.maxX) / 2 - 5;
    webClimateLab.projView.key2.x = (webClimateLab.fGraph.originX + webClimateLab.fGraph.maxX) / 2 - 5;
    webClimateLab.projView.draw(webClimateLab.runYet);

    introChange();
    moveCmipHelp();
    removeHelpBoxes();
}

function moveCmipHelp() {
    if (webClimateLab.fGraph.cmipOp >= .1) {
        var target = $("#cmip_help");
        var label = webClimateLab.projView.key2.items[webClimateLab.projView.key2.items.length - 1];
        var labelAbsX = label.lineStartX + label.x;
        var labelAbsY = webClimateLab.projView.key2.y + label.y;
        var textSize = parseFloat($("body").css("font-size"));
        target.css("top", labelAbsY - .8 * textSize + "px");
        target.css("left", labelAbsX + label.width - label.buffer + 0.3 * textSize + "px");
        target.css("display", "inline-block");
    } else {
        $("#cmip_help").css("display", "none");
    }
}

function readDataFromFile(file) {
    var text = $.ajax({
        url: file, async: false
    });
    return text.responseText;
}

function parseRfData(filetxt) {
    var lines = filetxt.split("\n");
    var data = [];
    for (var i = 0; i < lines.length; i++) {
        data[i] = lines[i].split(",")[1];
    }
    return data;
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
    var run = runModelCalibration(3.7 / cs, Math.pow(kv, 2) / 10000, rf_data, mu);
    finalPrev = run[run.length - 1];

    while (!stop) {
        mu += muInc;
        var data = runModelCalibration(3.7 / cs, Math.pow(kv, 2) / 10000, rf_data, mu);
        var final = data[data.length - 1];

        if (final - intValue <= 0) {
            var xInt = mu - muInc + (finalPrev - intValue) / (finalPrev - final) * muInc;
            return xInt;
        } else if (mu > 10) {
            stop = true;
            console.log("\n\nVertex not found.\n\n");
        }
        finalPrev = final;
    }
}

function runModelCalibration(lambda, kappa, rf_data, mu) {

    var startYear = 0;
    var endYear = rf_data.length - 1;
    var f = .29;
    var rho = 1025;
    var c = 3990;
    var hm = 70;
    var timestep = 864000;
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

// Each cs object must have exactly the same set of kv values, or bad things may happen!
function getMu(cs, kv, muValues) {
    var bounds = getBounds(muValues);
    if (cs.toFixed(1) < bounds[0] || cs.toFixed(1) > bounds[1]) {
        console.log("CS Value " + cs + " is out of bounds " + bounds[0] + " to " + bounds[1] + ".");
        return;
    } else if (kv.toFixed(1) < bounds[2] || kv.toFixed(1) > bounds[3]) {
        console.log("KV Value " + kv + " is out of bounds " + bounds[2] + " to " + bounds[3] + ".");
        return;
    } else {
        if (typeof muValues[cs] !== "undefined" && typeof muValues[cs][kv] !== "undefined") {
            return muValues[cs][kv];
        } else {
            var ul, ur, bl, br;
            var csClose = getClosest(cs, muValues);
            var kvClose = getClosest(kv, muValues[csClose[0]]);

            if (cs.toFixed(1) === bounds[1]) {
                var ul = muValues[csClose[0]][kvClose[1]];
                var ur = ul;
                var bl = muValues[csClose[0]][kvClose[0]];
                var br = bl;
            } else if (kv.toFixed(1) === bounds[3]) {
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

//function runModel(lambda, kappa, rcp, out) {
//    var start = new Date().getTime();
//    var startYear = 1765;
//    var endYear = 2100;
//    var numLayers = 20;
//    var frcs = webClimateLab.rcpForcings;
//    var f = .29;
//    var k = 1.45;
//    var rho = 1025;
//    var c = 3990;
//    var hm = 70;
//    var alpha = -1.01845;
//    var qa80s = -1.01845;
//    var tempsLand = [0];
//    var tempsMixed = [0];
//    var tempsMean = [0];
//    var ohcs = [0];
//
//    // layerTemps, tempsMixed, and tempsLand are solutions to differential questions, so timestep is fractional to prevent weird numbers/numerical instability (esp. in layerTemps)
//
//    var ocean = new Ocean(hm, numLayers, kappa, c, rho);
//    var pointsPerYear = Math.ceil(31557600 / ocean.timestep);
//    //console.log("Cycles per year: " + pointsPerYear);
//    var secsPerPoint = 31557600 / pointsPerYear;
//    for (var t = 1; t < (endYear - startYear + 1) * pointsPerYear; t++) {
//        /** Fractional year used as index */
//        var fYear = t / pointsPerYear + startYear;
//        /** Actual year containing this point */
//        var iYear = Math.floor(fYear);
//        var oceanRun = ocean.run(tempsMixed[t - 1], secsPerPoint);
//        // qw and ql are radiative forcing (W/m^2) used in calculation of water and land temperatures 
//        var qw = frcs[rcp][Math.floor(fYear - 1 / pointsPerYear)][1] + alpha * frcs[rcp][Math.floor(fYear - 1 / pointsPerYear)][0] / qa80s;
//        var ql = frcs[rcp][iYear][1] + alpha * frcs[rcp][iYear][0] / qa80s;
//        //console.log("qw: " + qw + " | ql: " + ql + " | index 1: " + frcs[rcp][Math.floor(fYear-1 / pointsPerYear)][1] + " | index 0: " + frcs[rcp][Math.floor(fYear-1 / pointsPerYear)][0]);
//
//        tempsMixed[t] = tempsMixed[t - 1] + (qw - lambda * tempsMixed[t - 1] -
//                oceanRun.mixedLoss + (k / (1 - f)) * (tempsLand[t - 1] -
//                tempsMixed[t - 1])) * secsPerPoint / (rho * c * hm);
//        tempsLand[t] = (f * ql + k * tempsMixed[t]) / (f * lambda + k);
//        tempsMean[t] = f * tempsLand[t] + (1 - f) * tempsMixed[t];
//        ohcs[t] = (ocean.ohc + tempsMixed[t] * c * rho * hm *
//                ocean.area) / Math.pow(10, 23);
//        if (fYear === 2100) {
//            //console.log(oceanRun.ohcs);
//        }
//    }
//    var tempsMeanA = runningAvg(tempsMean, startYear, endYear, pointsPerYear, 1);
//    // Average of model's output temperatures between 1961 and 1990
//    var gAdjust = averageTemp(tempsMeanA, 1961, 1990);
//    // Average of historical observed temperatures between 1961 and 1990
//    var piAdjust = webClimateLab.piAdjust;
//    //console.log("2100: " + (tempsMeanA[2100] - gAdjust + piAdjust) + "°C");
//    setIntroProj2100(tempsMeanA[2100] - gAdjust + piAdjust);
//    var tempsMeanAdjusted = [];
//    for (var i in tempsMeanA) {
//        tempsMeanAdjusted[i] = tempsMeanA[i] - gAdjust;
//    }
//    var tempsMeanPIAdjusted = [];
//    for (var i in tempsMeanA) {
//        tempsMeanPIAdjusted[i] = tempsMeanA[i] - gAdjust + piAdjust;
//    }
//    webClimateLab.fGraph.addModelTemps(tempsMeanPIAdjusted);
//    webClimateLab.projView.draw();
//    //console.log(new Date().getTime() - start + "ms");
//    if (out) {
//        outputTempsToFile(tempsMeanPIAdjusted);
//    }
//}