/* global webClimateLab, Graph */

/**
 * @class
 * @param {Graph} csGraph
 * @param {Graph} sqrtkvGraph
 */
function Distribs(csGraph, sqrtkvGraph) {
    this.csGraph = csGraph;
    this.sqrtkvGraph = sqrtkvGraph;
    this.csSeries = setupGraph(this.csGraph, webClimateLab.cs_dist);
    this.sqrtkvSeries = setupGraph(this.sqrtkvGraph, webClimateLab.sqrtkv_dist);

    this.plotCs = function(selected) {
        var g = this.csGraph;
        g.ctx.clearRect(g.edgeX, g.originY - g.height, g.originX + g.width - g.edgeX,
                g.edgeY - (g.originY - g.height));
        g.plot(this.csSeries, "#004d00", 3, true, g.minXVal, g.step);
        g.axes(1, 5);
        g.mark(1, 4, 1, 1, "", "Probability", true, false, 1, 0, [3, 6]);
        this.drawSelected(g, selected, this.csSeries);
        updateDisp("#clim_sens_param_disp", selected, this.csSeries, "°C/2x CO" +
                String.fromCharCode(8322));
    };

    this.plotSqrtkv = function(selected) {
        var g = this.sqrtkvGraph;
        g.ctx.clearRect(g.edgeX, g.originY - g.height, g.originX + g.width - g.edgeX,
                g.edgeY - (g.originY - g.height));
        g.plot(this.sqrtkvSeries, "#004d00", 3, true, g.minXVal, g.step);
        g.axes(1, 5);
        g.mark(1, 4, 1, 1, "", "Probability", true, false, 1, 0, [3, 6]);
        this.drawSelected(g, selected, this.sqrtkvSeries);
        updateDisp("#diff_param_disp", selected, this.sqrtkvSeries,
                "&radic;<span class=\"sqrt\">cm</span><sup>2</sup><span class=\"sqrt\">/s</span>");
    };

    this.drawSelected = function(g, selected, series) {
        if (selected < g.minXVal) {
            selected = g.minXVal;
        }
        if (selected > g.maxXVal) {
            selected = g.maxXVal;
        }
        g.ctx.strokeStyle = "#001a00";
        g.ctx.lineWidth = 1;
        g.ctx.beginPath();
        g.ctx.moveTo(g.mapXVal(selected), g.originY);
        g.ctx.lineTo(g.mapXVal(selected), g.mapYVal(series[selected]) + 1.5);
        g.ctx.stroke();
        g.ctx.strokeStyle = "#000000";
        g.ctx.lineWidth = 1;
        g.ctx.fillStyle = "#DDDDDD";
        g.ctx.beginPath();
        //g.ctx.arc(g.mapXVal(selected), g.originY, 4, 0, Math.PI * 2);
        var boxSize = 8;
        var lift = boxSize;
        g.ctx.moveTo(g.mapXVal(selected), g.originY - lift);
        g.ctx.lineTo(g.mapXVal(selected) - boxSize / 2, g.originY + boxSize / 2 - lift);
        g.ctx.lineTo(g.mapXVal(selected) - boxSize / 2, g.originY + boxSize * 3 / 2 - lift);
        g.ctx.lineTo(g.mapXVal(selected) + boxSize / 2, g.originY + boxSize * 3 / 2 - lift);
        g.ctx.lineTo(g.mapXVal(selected) + boxSize / 2, g.originY + boxSize / 2 - lift);
        g.ctx.lineTo(g.mapXVal(selected), g.originY - lift);
        g.ctx.fill();
        g.ctx.stroke();
    };

    /**
     * Sets up the boundaries of a density graph.
     * @param {Graph} graph
     * @param {Object} series Series which may have string keys
     * @return {Number[]} Series without string keys
     */
    function setupGraph(graph, series) {
        var newSeries = {};
        var indices = [];
        var values = [];
        for (var index in series) {
            indices.push(Number(index));
            values.push(series[index]);
            newSeries[Number(index)] = series[index];
        }
        graph.step = indices[1] - indices[0];
        graph.minXVal = Math.min.apply(null, indices);
        graph.maxXVal = Math.max.apply(null, indices);
        graph.maxYVal = Math.ceil(Math.max.apply(null, values) * 20) / 20;
        return newSeries;
    }

    /**
     * Updates a distribution slider's display with value and likelihood.
     * @param {String} id
     * @param {Number} val
     * @param {Number[]} series
     * @param {String} unit
     */
    function updateDisp(id, val, series, unit) {
        var likelihood;
        var color;
        if (series[val] >= 0.075) {
            likelihood = "Likely";
            color = "#108010";
        } else if (series[val] >= 0.035) {
            likelihood = "Possible";
            color = "#99CC00";
        } else if (series[val] >= 0.01) {
            likelihood = "Unlikely";
            color = "#FF8000";
        } else {
            likelihood = "Very Unlikely";
            color = "#FF0000";
        }
        $(id).html(val.toFixed(1) + " " + unit + ": " + likelihood);
        $(id).css("color", color);
    }
}
