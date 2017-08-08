/* Global Key */

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

String.prototype.toFixed = function (n) {
    return Number(this).toFixed(n);
};

$(document).ready(function () {
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
    webClimateLab.fGraph = new Graph(projCtx, null, null, 245, 250, 15, 1860, 2100, null, null);
    webClimateLab.fGraph.title = "Projected Global Mean Temperature";
    webClimateLab.fGraph.yCaption = "Global warming from pre-industrial avg (°C)";
    webClimateLab.fGraph.has2100 = true;
    webClimateLab.fGraph.cmipOp = 0.05;

    webClimateLab.projView = new View(50, 300, projCtx);
    webClimateLab.projView.add(webClimateLab.fGraph, 0, -20, true);

    var projCenter = (webClimateLab.fGraph.originX + webClimateLab.fGraph.maxX) / 2 - 5;
    webClimateLab.projView.key1 = new Key(projCenter, 315, 1, projCtx);
    webClimateLab.projView.key1.add("#FF0000", "Model results");
    webClimateLab.projView.key1.add("#000000", "Historical estimates");
    webClimateLab.projView.key1.add("#4D94FF", "Historical uncertainty range");
    webClimateLab.projView.key1.add("#80BFFF", "Paris Agreement goal");
    webClimateLab.projView.key2 = new Key(projCenter, 315, 1, projCtx);
    webClimateLab.projView.key2.add("#FF0000", "Model results");
    webClimateLab.projView.key2.add("#000000", "Historical estimates");
    webClimateLab.projView.key2.add("#4D94FF", "Historical uncertainty range");
    webClimateLab.projView.key2.add("#80BFFF", "Paris Agreement goal");
    webClimateLab.projView.key2.add("#99C199", "State of the art model range", 20);
}

function getStaticData() {
    $.ajax("get_static_data.php", {
        type: "GET",
        dataType: "json"
    })
            .done(function (json) {
                var gtemps = json["gtemps"];
                for (var i in gtemps) {
                    gtemps[i][0] += webClimateLab.piAdjust;
                    gtemps[i][1] += webClimateLab.piAdjust;
                    gtemps[i][2] += webClimateLab.piAdjust;
                }
                webClimateLab.fGraph.addPastTemps(gtemps);
                webClimateLab.rcpForcings = json["rcp"];
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

function runModel(lambda, kappa, rcp, out) {

    var start = new Date().getTime();
    var startYear = 1765;
    var endYear = 2100;
    var frcs = webClimateLab.rcpForcings;
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
            var Q = +frcs[rcp][iYear][1] + (fYear - iYear) * (frcs[rcp][iYear + 1][1] - frcs[rcp][iYear][1]);
        } else {
            var Q = +frcs[rcp][iYear][1] + (fYear - iYear) * (+frcs[rcp][iYear][1] - +frcs[rcp][iYear - 1][1]);
        }
        temp_anom[t] = temp_anom[t - 1] + (timestep / Cm) * (Q - lambda * temp_anom[t - 1] - ((mu * Cm * temp_anom[t - 1]) / Math.sqrt(tau * t * timestep)));

    }
    var tempsMeanA = runningAvg(temp_anom, startYear, endYear, pointsPerYear, 1);
    // Average of model's output temperatures between 1961 and 1990
    var gAdjust = averageTemp(tempsMeanA, 1961, 1990);
    // Average of historical observed temperatures between 1961 and 1990
    var piAdjust = webClimateLab.piAdjust;
    //console.log("2100: " + (tempsMeanA[2100] - gAdjust + piAdjust) + "°C");
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
    console.log(new Date().getTime() - start + "ms");
    if (out) {
        outputTempsToFile(tempsMeanPIAdjusted);
    }
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
    //runModel(3.7 / Number($("#clim_sens_param").val()), Math.pow(1.8095 + 1.7703 * Math.log(Number($("#diff_param").val())), 2) / 10000, webClimateLab.rcp, out);
    runModel(3.7 / Number($("#clim_sens_param").val()), Math.pow(Number($("#diff_param").val()), 2) / 10000, webClimateLab.rcp, out);
}


var txt = "";
function outputTempsToFile(series, cs, kv) {
    xval = 1765; // change to 1765 if using rcp data, or 0 or some other start index if other rcp/forcing data
//    var txt = "";
    if (webClimateLab.runYet === true) {
        txt += "\nCS: " + cs + " | KV: " + kv + "\n";
        while (series[xval] !== undefined) {
            console.log('Year: ' + xval + ' | Temperature: ' + series[xval]);
            txt += xval + "," + series[xval] + "\n";
            xval++;
        }
    }
//        uri = "data:application/octet-stream," + encodeURIComponent(txt);
//        var date = new Date().toISOString().slice(0, 19).replace(/-/g, "");
//        $("#cp_output").attr("href", uri).attr("download", "model_temp_data-" + date + ".txt");
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
        var label = webClimateLab.projView.key2.items[4];
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
