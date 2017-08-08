/* global webClimateLab */

/**
 * @class
 * @param {Number} x
 * @param {Number} y
 * @param {CanvasRenderingContext2D} ctx
 * @returns {View}
 */
function View(x, y, ctx) {
    this.x = x;
    this.y = y;
    this.ctx = ctx;
    this.graphs = [];
}

/**
 * @param {Graph} g
 * @param {Number} offX
 * @param {Number} offY
 * @param {Boolean} [h3=false] Whether to show the title as h3, otherwise, it
 * will be shown as h4
 */
View.prototype.add = function(g, offX, offY, h3) {
    this.graphs.push(new View.ViewGraph(g, offX, offY, this.x, this.y, h3));
};

/**
 * @param {boolean} [showModel=true]
 */
View.prototype.draw = function(showModel) {
    if (showModel === undefined)
        showModel = true;
    this.ctx.clearRect(this.x - 49, 0, this.ctx.canvas.width - (this.x - 49),
            this.ctx.canvas.height);
    for (var i in this.graphs) {
        var vg = this.graphs[i];
        vg.g.originX = this.x + vg.offX;
        vg.g.originY = this.y + vg.offY;
        vg.g.recalcSize();
        if (showModel) {
            showTempGraph(vg.g.modelTemps, vg.g, vg.h3);
        } else {
            showTempGraph([], vg.g, vg.h3);
        }
    }
    this.key.draw();
};

/**
 * @class
 * @param {Graph} g
 * @param {Number} x
 * @param {Number} y
 * @param {Number} currX
 * @param {Number} currY
 * @param {Boolean} [h3=false] Whether to show the title as h3, otherwise, it
 * will be shown as h4
 */
View.ViewGraph = function(g, x, y, currX, currY, h3) {
    this.g = g;
    this.h3 = h3;
    this.offX = x;
    this.offY = y;
    g.originX = currX + this.offX;
    g.originY = currY + this.offY;
    g.recalcSize();
};

function Key(x, y, textEms, ctx, vert) {
    if (vert === undefined)
        vert = false;
    this.x = x;
    this.y = y;
    this.textEms = textEms;
    this.textSize = textEms * Number($(ctx.canvas).css("font-size").replace(/[px]/g, ""));
    this.lineHeight = textEms * Number($(ctx.canvas).css("line-height").replace(/[px]/g, ""));
    this.ctx = ctx;
    this.vert = vert;
    this.items = [];
}

Key.prototype.add = function(color, caption, buffer) {
    if (buffer === undefined) {
        buffer = 0;
    }
    this.items.push(new Key.Item(color, caption, this.textEms, this.textSize, buffer));
};

Key.prototype.draw = function() {
    this.ctx.font = this.textEms + "em Helvetica";
    if (this.vert) {
        var currY = 0;
        var width = 0;
        for (var i in this.items) {
            var item = this.items[i];
            item.x = 0;
            item.y = currY;
            currY += this.lineHeight;
            width = Math.max(width, this.ctx.measureText(item.caption).width +
                    9 / 8 * this.textSize);
        }
        var startX = this.x - width / 2;
        for (var i in this.items) {
            this.items[i].draw(this.ctx, startX, this.y);
        }
    } else {
        var currX = 0;
        var currY = 0;
        var line = [];
        for (var i in this.items) {
            var item = this.items[i];
            var itemWidth = this.ctx.measureText(item.caption).width +
                    9 / 8 * this.textSize + item.buffer;
            item.width = itemWidth;
            if (currX + itemWidth > this.ctx.canvas.width - 10) {
                var startX = this.x - currX / 2;
                for (var j in line) {
                    line[j].lineStartX = startX;
                    line[j].draw(this.ctx, startX, this.y);
                }
                currX = 0;
                currY += this.lineHeight;
                line = [];
            }
            item.x = currX;
            item.y = currY;
            line.push(item);
            currX += itemWidth + 7 / 8 * this.textSize;
        }
        var startX = this.x - currX / 2;
        for (var j in line) {
            line[j].lineStartX = startX;
            line[j].draw(this.ctx, startX, this.y);
        }
    }
};

Key.Item = function(color, caption, ems, size, buffer) {
    this.color = color;
    this.caption = caption;
    this.ems = ems;
    this.size = size;
    this.buffer = buffer;
    this.x = null;
    this.y = null;
    this.lineStartX = null;
    this.width = null;
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} keyX
 * @param {Number} keyY
 */
Key.Item.prototype.draw = function(ctx, keyX, keyY) {
    var boxSize = .75 * this.size;
    ctx.beginPath();
    ctx.rect(this.x + keyX, this.y + keyY - boxSize, boxSize, boxSize);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.fillStyle = this.color;
    ctx.stroke();
    ctx.fill();
    ctx.font = this.ems + "em Helvetica";
    ctx.fillStyle = "#3A3A3A";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(this.caption, this.x + keyX + 1.5 * boxSize, this.y + keyY);
};
