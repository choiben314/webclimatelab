/* global webClimateLab */
var rcpTemp = "8.5_temp";
/**
 * Creates an object representing a graph that can be outlined and plotted.
 * @class
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} originX
 * @param {Number} originY
 * @param {Number} width
 * @param {Number} height
 * @param {Number} buffer
 * @param {Number} minXVal
 * @param {Number} maxXVal
 * @param {Number} minYVal
 * @param {Number} maxYVal
 * @returns {Graph}
 */
function Graph(ctx, originX, originY, width, height, buffer, minXVal, maxXVal, minYVal, maxYVal) {
    this.ctx = ctx;
    this.originX = originX;
    this.originY = originY;
    this.width = width;
    this.height = height;
    this.buffer = buffer;
    this.minXVal = minXVal;
    this.maxXVal = maxXVal;
    this.minYVal = minYVal;
    this.maxYVal = maxYVal;
    this.maxX = this.originX + this.width - this.buffer;
    this.maxY = this.originY - this.height + this.buffer;
    this.edgeX = this.originX;
    this.edgeY = this.originY;
    this.title = undefined;
    this.hasPast = false;
    this.hasSAModel = false;
    this.has2100 = false;

    /**
     * Adds a past data series. Use this instead of setting pastTemps directly.
     * @param {Number[]} pastTemps Format [unlim][3], where [][0] is estimate, [][1] is lower, and [][2] is upper. Indexed by year.
     */
    this.addPastTemps = function (pastTemps) {
        this.hasPast = true;

        //this.pastMin = Math.max(Math.min.apply(null, Object.keys(pastTemps)), this.minXVal);
        //this.pastMax = Math.min(Math.max.apply(null, Object.keys(pastTemps)), this.maxXVal);
        this.pastTemps = pastTemps;
    };

    /**
     * Adds a state of the art model data series. Use this instead of setting saModelTemps directly.
     * @param {Number[]} saModelTemps Format [unlim][3], where [][0] is estimate, [][1] is lower, and [][2] is upper. Indexed by year.
     */
    this.addSAModelTemps = function (saModelTemps) {
        this.hasSAModel = true;

        this.saModelMin = Math.max(Math.min.apply(null, Object.keys(saModelTemps[rcpTemp])), this.minXVal);
        this.saModelMax = Math.min(Math.max.apply(null, Object.keys(saModelTemps[rcpTemp])), this.maxXVal);
        this.saModelTemps = saModelTemps;
    };

    /**
     * Adds a model data series. Use this instead of setting modelTemps directly.
     * @param {Number[]} modelTemps Indexed by year
     */
    this.addModelTemps = function (modelTemps) {
        this.modelMin = Math.max(Math.min.apply(null, Object.keys(modelTemps)), this.minXVal);
        this.modelMax = Math.min(Math.max.apply(null, Object.keys(modelTemps)), this.maxXVal);
        this.modelTemps = modelTemps;
    };

    /**
     * Outlines this graph's axes without markings.
     * @param {Number} width Width of lines, in pixels
     * @param {Number} arrowLength
     */
    this.axes = function (width, arrowLength) {
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(this.originX, this.originY - this.height);
        this.ctx.lineTo(this.originX, this.originY);
        this.ctx.lineTo(this.originX + this.width, this.originY);
        this.ctx.stroke();
        Graph.drawArrow(this.ctx, this.originX, this.originY - this.height,
                arrowLength, "u");
        Graph.drawArrow(this.ctx, this.originX + this.width, this.originY,
                arrowLength, "r");
    };

    /**
     * Mark the axes with tickmarks, labels, and captions
     * @param {Number} width Width of tickmarks, in pixels
     * @param {Number} tickLength Length of tickmarks, in pixels
     * @param {Number|String} labelEms Label font size in ems
     * @param {Number|String} captionEms Caption font size in ems
     * @param {String} captionX
     * @param {String} captionY
     * @param {Boolean} markX
     * @param {Boolean} markY
     * @param {Number} [placesX=0]
     * @param {Number} [placesY=0]
     * @param {Number[]} [extraXL=[]] Extra locations to mark and label on the x-axis
     * @param {Number[]} [extraYL=[]] Extra locations to mark and label on the y-axis
     * @param {Number[]} [extraXM=[]] Extra locations to mark on the x-axis
     * @param {Number[]} [extraYM=[]] Extra locations to mark on the y-axis
     */
    this.mark = function (width, tickLength, labelEms, captionEms, captionX,
            captionY, markX, markY, placesX, placesY, extraXL, extraYL, extraXM,
            extraYM) {
        if (placesX === undefined)
            placesX = 0;
        if (placesY === undefined)
            placesY = 0;
        if (extraXL === undefined)
            extraXL = [];
        if (extraYL === undefined)
            extraYL = [];
        if (extraXM === undefined)
            extraXM = [];
        if (extraYM === undefined)
            extraYM = [];
        var captionSize = captionEms * Number($(ctx.canvas).css("font-size").replace(/[px]/g, ""));
        var captionHeight = captionEms * Number($(ctx.canvas).css("line-height").replace(/[px]/g, ""));
        var labelSize = labelEms * Number($(ctx.canvas).css("font-size").replace(/[px]/g, ""));
        this.ctx.strokeStyle = "#000000";
        this.ctx.fillStyle = "#3A3A3A";
        this.ctx.lineWidth = width;
        this.ctx.font = labelEms + "em Helvetica";
        this.ctx.beginPath();
        if (markX) {
            this.ctx.moveTo(this.originX, this.originY - tickLength);
            this.ctx.lineTo(this.originX, this.originY + tickLength);
            this.ctx.moveTo(this.maxX, this.originY - tickLength);
            this.ctx.lineTo(this.maxX, this.originY + tickLength);
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "top";
            this.ctx.fillText(this.minXVal.toFixed(placesX), this.originX, this.originY + 1.5 * tickLength);
            this.ctx.fillText(this.maxXVal.toFixed(placesX), this.maxX, this.originY + 1.5 * tickLength);
            Array.prototype.push.apply(extraXM, extraXL);
            for (var i in extraXM) {
                this.ctx.moveTo(this.mapXVal(extraXM[i]), this.originY - tickLength);
                this.ctx.lineTo(this.mapXVal(extraXM[i]), this.originY + tickLength);
            }
            for (var i in extraXL) {
                this.ctx.fillText(extraXL[i].toFixed(placesX), this.mapXVal(extraXL[i]), this.originY + 1.5 * tickLength);
            }
        }
        if (markY) {
            this.ctx.moveTo(this.originX - tickLength, this.originY);
            this.ctx.lineTo(this.originX + tickLength, this.originY);
            this.ctx.moveTo(this.originX - tickLength, this.maxY);
            this.ctx.lineTo(this.originX + tickLength, this.maxY);
            this.ctx.textAlign = "right";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(this.minYVal.toFixed(placesY), this.originX - 1.5 * tickLength, this.originY);
            this.ctx.fillText(this.maxYVal.toFixed(placesY), this.originX - 1.5 * tickLength, this.maxY);
            Array.prototype.push.apply(extraYM, extraYL);
            for (var i in extraYM) {
                this.ctx.moveTo(this.originX - tickLength, this.mapYVal(extraYM[i]));
                this.ctx.lineTo(this.originX + tickLength, this.mapYVal(extraYM[i]));
            }
            for (var i in extraYL) {
                this.ctx.fillText(extraYL[i].toFixed(placesY), this.originX - 1.5 * tickLength, this.mapYVal(extraYL[i]));
            }
        }
        this.ctx.stroke();

        this.ctx.font = captionEms + "em Helvetica";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "top";
        var xLabelOff = 1.5 * tickLength;
        if (markX)
            xLabelOff += 1.5 * labelSize;
        this.ctx.fillText(captionX, (this.originX + this.originY) / 2,
                this.originY + xLabelOff);
        this.edgeY = this.originY + xLabelOff;
        if (captionX !== "")
            this.edgeY += captionSize;
        this.ctx.textBaseline = "bottom";
        this.ctx.rotate(-Math.PI / 2);
        var yLabelOff = 1.5 * tickLength;
        if (markY)
            yLabelOff += 2 * labelSize;
        this.ctx.fillText(captionY, -(this.originY + this.maxY) / 2,
                this.originX - yLabelOff);
        this.edgeX = this.originX - yLabelOff;
        if (this.topCaptionY !== undefined) {
            this.ctx.fillText(this.topCaptionY, -(this.originY + this.maxY) / 2,
                    this.originX - yLabelOff - captionHeight);
            this.edgeX -= captionHeight;
        }
        if (captionY !== "")
            this.edgeX -= captionSize;
        this.ctx.rotate(Math.PI / 2);
    };

    /**
     * Plots a series on this graph.
     * @param {Number[]} series
     * @param {String} style
     * @param {Number} width
     * @param {Boolean} [smooth=false]
     * @param {Number} [startXVal=0]
     * @param {Number} [incXVal=0]
     */
    this.plot = function (series, style, width, smooth, startXVal, incXVal) {
        if (smooth === undefined)
            smooth = false;
        if (startXVal === undefined)
            startXVal = this.minXVal;
        if (incXVal === undefined)
            incXVal = 1;
        if (smooth) {
            this.ctx.lineJoin = "round";
        }
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = style;

        this.ctx.beginPath();
        this.ctx.moveTo(this.mapXVal(startXVal), this.mapYVal(series[startXVal]));
        var plotXVal = startXVal;
        while (series[plotXVal] !== undefined) {
            this.ctx.lineTo(this.mapXVal(plotXVal), this.mapYVal(series[plotXVal]));
            plotXVal = Math.round((plotXVal + incXVal) * 1000000000) / 1000000000;
            //console.log('X Value: ' + plotXVal + ' | Temperature Output: ' + series[plotXVal]);
        }
        this.ctx.stroke();
        this.ctx.lineJoin = "miter";
    };

    this.recalcSize = function () {
        this.maxX = this.originX + this.width - this.buffer;
        this.maxY = this.originY - this.height + this.buffer;
        this.edgeX = this.originX;
        this.edgeY = this.originY;
    };

    /**
     * Maps a value onto this graph's x-scale.
     * @param {Number} xVal
     * @returns {Number} The x-coordinate this value should be plotted at
     */
    this.mapXVal = function (xVal) {
        return xVal.map(this.minXVal, this.maxXVal, this.originX, this.maxX);
    };

    /**
     * Maps a value onto this graph's y-scale.
     * @param {Number} yVal
     * @returns {Number} The y-coordinate this value should be plotted at
     */
    this.mapYVal = function (yVal) {
        return yVal.map(this.minYVal, this.maxYVal, this.originY, this.maxY);
    };
}

/**
 * Draws an arrow point on a canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} pointX
 * @param {Number} pointY
 * @param {Number} length
 * @param {String} dir Direction to point: "u" or "r"
 */
Graph.drawArrow = function (ctx, pointX, pointY, length, dir) {
    var angle = 30 * Math.PI / 180;
    var width = length * Math.tan(angle);
    ctx.beginPath();
    if (dir === "u") {
        ctx.moveTo(pointX - width, pointY + length);
        ctx.lineTo(pointX, pointY);
        ctx.lineTo(pointX + width, pointY + length);
    } else if (dir === "r") {
        ctx.moveTo(pointX - length, pointY - width);
        ctx.lineTo(pointX, pointY);
        ctx.lineTo(pointX - length, pointY + width);
    } else {
        throw new Error("Invalid arrow direction");
    }
    ctx.stroke();
};

/**
 * @param {Number[]} modelTempSeries
 * @param {Graph} g
 * @param {Boolean} [h3=false] Whether to show the title as h3, otherwise, it
 * will be shown as h4
 */
function showTempGraph(modelTempSeries, g, h3) {
    if (typeof webClimateLab.rcp !== "undefined") {
        rcpTemp = webClimateLab.rcp + "_temp";
    }
    if (h3 === undefined)
        h3 = false;
    var possibleExtremeTemps = [];
    for (var i in modelTempSeries) {
        if (i >= g.modelMin && i <= g.modelMax)
            possibleExtremeTemps.push(modelTempSeries[i]);
    }
    if (g.has2100) {
        if (modelTempSeries.length !== 0) {
            possibleExtremeTemps.push(webClimateLab.ar5_proj[webClimateLab.rcp][3]);
            possibleExtremeTemps.push(webClimateLab.ar5_proj[webClimateLab.rcp][4]);
        }
        possibleExtremeTemps.push(0);
    }
//    if (g.hasPast) {
//        for (var i = g.pastMin; i <= g.pastMax; i++) {
//            possibleExtremeTemps.push(g.pastTemps[i][1]);
//            possibleExtremeTemps.push(g.pastTemps[i][2]);
//        }
//    }
    if (g.hasSAModel) {
        for (var i = g.saModelMin; i <= g.saModelMax; i++) {
            possibleExtremeTemps.push(g.saModelTemps[rcpTemp][i][0]);
            possibleExtremeTemps.push(g.saModelTemps[rcpTemp][i][2]);
        }
    }
    g.minYVal = Math.floor(Math.min.apply(null, possibleExtremeTemps) * 2) / 2;
    g.maxYVal = Math.ceil(Math.max.apply(null, possibleExtremeTemps) * 2) / 2;

    if (g.has2100) {
        if (webClimateLab.rcp !== undefined) {
            showParisGoal(modelTempSeries, g);
            //showAr5Proj(modelTempSeries, g); // Uncomment this to display Ar5 Projection (Green vertical bar).
        }
    }
    if (g.hasPast) {
        plotHistorical(g);
    }

    if (g.hasSAModel) {
        plotSAModel(g);
    }

    if (modelTempSeries.length !== 0) {
        plotModel(modelTempSeries, g);
    }

    g.axes(2, 6);
    if (g.yCaption === undefined) {
        g.yCaption = "";
    }
    var xLabel = [1940, 1980, 2020, 2060]; //TODO Make this flexible for future changes
    var yLabel = [0];
    var xMark = [];
    for (var i = g.minXVal + 1; i < Math.floor(g.maxXVal / 20) * 20; i += 20) {
        xMark.push(Math.ceil(i / 20) * 20);
    }
    var yMark = [];
    for (var i = g.minYVal + .1; i < Math.floor(g.maxYVal); i += 1) {
        if (Math.ceil(i) !== 0) {
            yMark.push(Math.ceil(i));
        }
    }
    g.mark(1, 4, 1, 1, "", g.yCaption, true, true, 0, 1, xLabel, yLabel, xMark, yMark);
    g.ctx.textAlign = "center";
    g.ctx.textBaseline = "bottom";
    var props;
    if (h3) {
        props = getElementStyle("<h3>", g.ctx.canvas);
    } else {
        props = getElementStyle("<h4>", g.ctx.canvas);
    }
    g.ctx.fillStyle = props.color;
    g.ctx.font = props.fontweight + " " + props.fontsize + "px " +
            props.fontfamily;
    g.ctx.fillText(g.title, g.originX + g.width / 2, g.originY - g.height - 5);
}

/**
 * @param {Graph} g
 */
function plotHistorical(g) {
    var data = g.pastTemps;
    var meanSeries = [];
    var lowerSeries = [];
    var upperSeries = [];
    for (var i in data) {
        meanSeries[i] = data[i][0];
//        lowerSeries[i] = data[i][1];
//        upperSeries[i] = data[i][2];
    }
// UNCOMMENT THE BELOW TO ADD HISTORICAL UNCERTAINTY

//    g.ctx.fillStyle = "#4D94FF";
//    var plotYear = g.pastMax;
//    g.ctx.beginPath();
//    g.ctx.moveTo(g.mapXVal(g.pastMax), g.mapYVal(upperSeries[g.pastMax]));
//    while (plotYear > g.pastMin) {
//        plotYear--;
//        g.ctx.lineTo(g.mapXVal(plotYear), g.mapYVal(upperSeries[plotYear]));
//    }
//    g.ctx.lineTo(g.mapXVal(g.pastMin), g.mapYVal(lowerSeries[g.pastMin]));
//    while (plotYear < g.pastMax) {
//        plotYear++;
//        g.ctx.lineTo(g.mapXVal(plotYear), g.mapYVal(lowerSeries[plotYear]));
//    }
//    g.ctx.fill();

    //g.plot(lowerSeries, "#0066FF", 1);
    //g.plot(upperSeries, "#0066FF", 1);
    g.plot(meanSeries, "#000000", 1, false, 1900, 1);
}

/**
 * @param {Graph} g
 */
function plotSAModel(g) {
    var data = g.saModelTemps;
    var meanSeries = [];
    var lowerSeries = [];
    var upperSeries = [];
    for (var i in data[rcpTemp]) {
        meanSeries[i] = data[rcpTemp][i][1];
        lowerSeries[i] = data[rcpTemp][i][0];
        upperSeries[i] = data[rcpTemp][i][2];
    }
    // lower is actually greater than upper

    // sets opacity of model range to 0.5
    g.ctx.globalAlpha = 0.5;
    g.ctx.fillStyle = "#99C199";

    var plotYear = g.saModelMax;
    g.ctx.beginPath();
    g.ctx.moveTo(g.mapXVal(g.saModelMax), g.mapYVal(upperSeries[g.saModelMax]));
    while (plotYear > g.saModelMin) {
        plotYear--;
        g.ctx.lineTo(g.mapXVal(plotYear), g.mapYVal(upperSeries[plotYear]));
    }
    g.ctx.lineTo(g.mapXVal(g.saModelMin), g.mapYVal(lowerSeries[g.saModelMin]));
    while (plotYear < g.saModelMax) {
        plotYear++;
        g.ctx.lineTo(g.mapXVal(plotYear), g.mapYVal(lowerSeries[plotYear]));
    }
    g.ctx.fill();
    g.ctx.globalAlpha = 1.0;

    if (typeof g.modelTemps !== "undefined") {
        webClimateLab.inCmipRange = g.modelTemps[2100] <= lowerSeries[2100] && g.modelTemps[2100] >= upperSeries[2100];
        setCmipCaption();
    }

    //g.plot(lowerSeries, "#0066FF", 1);
    //g.plot(upperSeries, "#0066FF", 1);

    // UNCOMMENT THE BELOW TO ADD STATE OF THE ART MODEL MEAN ESTIMATE

    //g.plot(meanSeries, "#498D34", 1);
}

function plotModel(data, g) {
    var dataToPlot = [];
    for (var i in data) {
        if (i >= g.minXVal && i <= g.maxXVal)
            dataToPlot[i] = data[i];
    }
    g.plot(dataToPlot, "#FF0000", 1.5);
}
/*
 function calcWaypoints(vertices) {
 var waypoints[];
 for(var i=1; i<vertices.length;i++) {
 var pt0=vertices[i-1];
 var pt1=vertices[i];
 var dx=pt1.x
 }
 */

/**
 * Shows a whisker plot of temperature projections for the selected RCP from
 * the IPCC AR5.
 * @param {Number[]} modelTemps
 * @param {Graph} g
 */
function showAr5Proj(modelTemps, g) {
    var rcp = webClimateLab.rcp;
    var data = webClimateLab.ar5_proj[rcp];
    var meanY = g.mapYVal(data[0]);
    var sminY = g.mapYVal(data[1]);
    var smaxY = g.mapYVal(data[2]);
    var eminYVal = data[3];
    var emaxYVal = data[4];
    var eminY = g.mapYVal(eminYVal);
    var emaxY = g.mapYVal(emaxYVal);

    var width = 8;
    if ($(g.ctx.canvas).css("opacity") === "1")
        g.ctx.globalAlpha = webClimateLab.fGraph.cmipOp;
    g.ctx.beginPath();
    g.ctx.strokeStyle = "#004000";
    g.ctx.fillStyle = "#99C199";
    g.ctx.lineWidth = 1;
    g.ctx.rect(g.mapXVal(2090.5) - width / 2, emaxY, width, eminY - emaxY);
    g.ctx.fill();
    g.ctx.stroke();
    g.ctx.globalAlpha = 1;

    var avgModelTemp = averageTemp(modelTemps, 2081, 2100);
    webClimateLab.inCmipRange = avgModelTemp <= emaxYVal &&
            avgModelTemp >= eminYVal;
    setCmipCaption();
}

/**
 * Shows the 2°C goal as a line on the graph.
 * @param {Number[]} modelTemps
 * @param {Graph} g
 */
function showParisGoal(modelTemps, g) {
    var startY = g.mapYVal(2);
    var endY = g.mapYVal(1.5);
    var grad = g.ctx.createLinearGradient(0, startY, 0, endY);
    grad.addColorStop(0, "rgba(128, 191, 255, .5)");
    grad.addColorStop(1, "rgba(128, 191, 255, 0)");
    g.ctx.fillStyle = grad;
    g.ctx.fillRect(g.originX, startY, g.maxX - g.originX, endY - startY);

    g.ctx.strokeStyle = "#0066CC";
    g.ctx.lineWidth = 1;
    g.ctx.beginPath();
    g.ctx.moveTo(g.originX, startY);
    g.ctx.lineTo(g.maxX, startY);
    g.ctx.stroke();
}

/**
 * Gets parsed computed styles of a hypothetical element.
 * Currently only supports fontfamily, fontsize, fontweight, color, and
 * lineheight.
 * @param {String} tag HTML tag of desired element
 * @param {HTMLElement} location Sibling element for calculated style
 * @returns {Object}
 */
function getElementStyle(tag, location) {
    var elem = $(tag);
    $(location).after(elem);
    var fontFamily = elem.css("font-family");
    var fontSize = Number(elem.css("font-size").replace(/[px]/g, ""));
    var fontWeight = elem.css("font-weight");
    var color = elem.css("color");
    var lineHeight = Number(elem.css("line-height").replace(/[px]/g, ""));
    elem.detach();
    return {
        fontfamily: fontFamily,
        fontsize: fontSize,
        fontweight: fontWeight,
        color: color,
        lineheight: lineHeight
    };
}
