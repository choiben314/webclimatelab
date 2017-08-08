/* global webClimateLab */

/**
 * Fills the div#intro with new content.
 * @param {String} slideId The id (without intro_ prefix) of a div in div#templates.
 */
function fillIntro(slideId) {
    webClimateLab.currIntroId = "#intro_" + slideId;
    var elem = $("#intro_" + slideId);
    if (getActiveMQ() === "mq-floatintro" || getActiveMQ() === "mq-maxed") {
        moveFloatingIntro(elem);
    }
    var content = elem.html();
    $("#intro_text").html(content);
}

function moveFloatingIntro(dataElem) {
    var intro = $("#intro");
    intro.detach();
    var newParent = $(dataElem.data("p"));
    newParent.append(intro);
    intro.removeClass(function (index, css) {
        return (css.match(/(^|\s)fi_\S+/g) || []).join(' ');
    });
    intro.addClass(dataElem.data("css"));
}

/**
 * Fills the div#intro_nav with buttons, which should be prefilled with text and actions.
 * @param {jQuery[]} buttons
 * @param {Function[]} actions Click handlers for buttons, respectively ordered
 * @param {Function[]} stack Current call stack
 */
function fillIntroNav(buttons, actions, stack) {
    $("#intro").off();
    var cont = $("<span>");
    for (var i in buttons) {
        if (i !== 0)
            cont.append(" &nbsp; &nbsp;");
        buttons[i].addClass("intro_button");
        cont.append(buttons[i]);
        $("#intro").on("click", "#" + buttons[i].attr("id"), actions[i],
                function (e) {
                    var scrollGetter = e.data(stack);
                    introChange();
                    if (scrollGetter !== null)
                        scrollIfTall(scrollGetter());
                });
    }
    $("#intro_nav").html(cont.html());
}

function backFn(stack) {
    $("input[name=\"rcp\"]").off("change.intro");
    $("#cp_run").off("click.intro");
    stack.pop();
    return stack.pop()(stack);
}

function skipFn(stack) {
    $("input[name=\"rcp\"][data-fallback=\"true\"]").prop("checked", true);
    runFromCP();
    setPolicy(1);
    setTuning(1);
    setCPRun(1);
    setProjView(1);
    setCmip(1);
    return goClose(stack);
}

function introChange() {
    var height = Number($("#intro").css("height").replace(/[px]/g, ""));
    var margin = Number($("#intro").css("margin-bottom").replace(/[px]/g, ""));
    $("#intro_spacer").css("height", height + margin + "px");
    if (getActiveMQ() === "mq-floatintro" || getActiveMQ() === "mq-maxed") {
        moveFloatingIntro($(webClimateLab.currIntroId));
    } else {
        var intro = $("#intro");
        intro.detach();
        $("#all").append(intro);
        intro.removeClass(function (index, css) {
            return (css.match(/(^|\s)fi_\S+/g) || []).join(' ');
        });
    }
}

function scrollIfTall(pos) {
    if (getActiveMQ() === "mq-singlewide" ||
            getActiveMQ() === "mq-sidetune") {
        var introHeight = Number($("#intro_spacer").css("height")
                .replace(/[px]/g, ""));
        $("html, body").stop().animate({
            scrollTop: pos - introHeight
        });
    }
}

function addHelpListeners() {
    $(".help").data("active", false)
            .click(function (e) {
                helpClicked(e);
            });
    $(document).click(function (e) {
        if (!$(e.target).closest(".help_box").length && !e.isDefaultPrevented())
            removeHelpBoxes();
    });
}

function helpClicked(e) {
    var t = $(e.target);
    if (!t.data("disabled") && !t.data("active")) {
        removeHelpBoxes();
        var contents = $("#helpdata_" + t.data("id")).html();
        var box = $("<div>", {
            "class": "help_box",
            html: contents
        });
        box.appendTo($("body"))
                .data("caller", t)
                .position({
                    my: "left top",
                    at: "right+2 bottom+2",
                    of: t,
                    collision: "flipfit",
                    within: "body"
                });
        t.data("active", true);
        // Prevent removal of new box
        e.preventDefault();
    }
}

function removeHelpBoxes() {
    $(".help_box").each(function () {
        $(this).data("caller").data("active", false);
        $(this).remove();
    });
}

function setPolicy(state) {
    $("#policy").css("opacity", state);
    $("input[name=\"rcp\"]").prop("disabled", state < .1);
    $(".help[data-id=policy]").data("disabled", state < .1);
}

function setTuning(state) {
    $("#cp_title").css("opacity", state);
    $("#param_pick").css("opacity", state);
    $("#cp").css("border-color", "rgba(0, 0, 0, " + state + ")");
    $("#clim_sens_param").prop("disabled", state < .1);
    $("#diff_param").prop("disabled", state < .1);
    $(".help[data-id=params]").data("disabled", state < .1);
}

// Toggles opacity/enabled state of 'Run Model' and 'Output to File' Buttons
function setCPRun(state) {
    $("#cp_run").css("opacity", state);
    $("#cp_run").prop("disabled", state < .1);
    $("#cp_output").css("opacity", state);
    
    if (state >= .1) {
        $("#cp_run").css("cursor", "pointer");
        $("#cp_output").css("cursor", "pointer");
        $("#cp_output").css("pointer-events", "auto");
    }
    
    // Quick generating function for calibration data (increases 1% each year for 70 years)
//    var i;
//    var num = 570; // initial CO2 conc. assumed to be 285 ppm at pre-industrial levels.
//    var rf; // radiative forcing in W/m^2
//    var txt = "0,0.0\n";
//    
//    // Radiative forcing calculation done out with CO2 concentration despite being unnecessary, for the purpose of readability.
//    // Calculation of rf based on equation that can be found under "Forcing due to atmospheric gas" on "Radiative forcing" Wikipedia article.
//    for (i = 0; i < 10000; i++) {
//     //   num *= 1.01;
//        rf = 5.35 * Math.log(num / 285);
//        var index = "" + (i + 1);
//        txt += (index + "," + rf + "\n");
//    }
//    uri = "data:application/octet-stream," + encodeURIComponent(txt);
//    location.href = uri;
}

function setProjView(state) {
    var oldState = Number($("#results_display").css("opacity")) >= .1;
    $("#results_display").css("opacity", state);
    $("#cmip_help").css("opacity", state);
    // Ensure CMIP visibility is correct (not double-faded)
    if (oldState)
        webClimateLab.projView.draw();
}

function setCmip(state) {
    webClimateLab.fGraph.cmipOp = state;
    if (state >= .1) {
        webClimateLab.projView.key = webClimateLab.projView.key2;
    } else {
        webClimateLab.projView.key = webClimateLab.projView.key1;
    }
    if (state >= .1 || Number($("#results_display").css("opacity")) >= .1)
        webClimateLab.projView.draw();
    $(".help[data-id=cmip]").data("disabled", state < .1);
    moveCmipHelp();
}

function goLoad() {
    $("#all").css("opacity", 1);
    setCmip(.05);
    setProjView(.05);
    setCPRun(.05);
    setTuning(.05);
    setPolicy(.05);
    fillIntro("splash");
    var skip = $("<button>", {
        id: "splash_skip",
        text: "Loading...",
        disabled: true
    });
    var next = $("<button>", {
        id: "splash_next",
        text: "Loading...",
        disabled: true
    });
    fillIntroNav([skip, next], [null, null], {});
    introChange();
}

function goStart() {
    var stack = [goStart];
    webClimateLab.introStack = stack;
    setCmip(.05);
    setProjView(.05);
    setCPRun(.05);
    setTuning(.05);
    setPolicy(.05);
    fillIntro("splash");
    var skip = $("<button>", {
        id: "start_skip",
        text: "Skip"
    });
    var next = $("<button>", {
        id: "start_next",
        text: "Start"
    });
    fillIntroNav([skip, next], [skipFn, goStep1], stack);
    return null;
}

function goStep1(stack) {
    stack.push(goStep1);
    setPolicy(1);
    setTuning(.05);
    fillIntro("step1");
    var back = $("<button>", {
        id: "step1_back",
        text: "Back"
    });
    var next = $("<button>", {
        id: "step1_next",
        text: "Next",
        disabled: true
    });
    if ($("input[name=\"rcp\"]:checked").length) {
        next.prop("disabled", false);
    } else {
        $("input[name=\"rcp\"]").on("change.intro", function () {
            $("#step1_next").prop("disabled", false);
            $("input[name=\"rcp\"]").off("change.intro");
        });
    }
    fillIntroNav([back, next], [backFn, goStep2], stack);
    return function () {
        return $("#policy").offset().top;
    };
}

function goStep2(stack) {
    stack.push(goStep2);
    setPolicy(.5);
    setTuning(1);
    setCPRun(.05);
    fillIntro("step2");
    var back = $("<button>", {
        id: "step2_back",
        text: "Back"
    });
    var next = $("<button>", {
        id: "step2_next",
        text: "Next"
    });
    fillIntroNav([back, next], [backFn, goStep2_1], stack);
    return function () {
        return $("#cp").offset().top;
    };
}

function goStep2_1(stack) {
    stack.push(goStep2_1);
    setTuning(.5);
    setCPRun(1);
    setProjView(.05);
    fillIntro("step2_1");
    var back = $("<button>", {
        id: "step2_1_back",
        text: "Back"
    });
    $("#cp_run").on("click.intro", function () {
        var scrollGetter = goStep3(stack);
        introChange();
        if (scrollGetter !== null)
            scrollIfTall(scrollGetter());
        $("#cp_run").off("click.intro");
    });
    fillIntroNav([back], [backFn], stack);
    return function () {
        return $("#sqrtkv_disp").offset().top;
    };
}

function goStep3(stack) {
    stack.push(goStep3);
    setCPRun(.5);
    setProjView(1);
    setCmip(.05);
    fillIntro("step3");
    setProjCaption(webClimateLab.proj2100);
    var back = $("<button>", {
        id: "step3_back",
        text: "Back"
    });
    var next = $("<button>", {
        id: "step3_next",
        text: "Next"
    });
    fillIntroNav([back, next], [backFn, goStep4], stack);
    return function () {
        return $("#results_display").offset().top;
    };
}

function setProjCaption(proj2100) {
    if (proj2100 < 2.05) {
        $("#intro_proj2100").html(proj2100.toFixed(1) +
                "°C from its pre-industrial level, which meets" +
                " the Paris Agreement's goal to limit warming" +
                " below 2°C.</p><p>This situation would likely" +
                " avoid the worst impacts of climate change.");
    } else {
        $("#intro_proj2100").html(proj2100.toFixed(1) +
                "°C from its pre-industrial level, which fails to" +
                " meet the Paris Agreement's goal to limit warming" +
                " below 2°C.</p><p>This situation would likely lead to severe" +
                " impacts from climate change.");
    }
}

function goStep4(stack) {
    stack.push(goStep4);
    setProjView(1);
    setCmip(1);
    // Fix unexplained issue of span content escaping span when copied
    $("#intro_cmipcomp").html("");
    fillIntro("step4");
    setCmipCaption();
    var back = $("<button>", {
        id: "step4_back",
        text: "Back"
    });
    var next = $("<button>", {
        id: "step4_next",
        text: "Next"
    });
    fillIntroNav([back, next], [backFn, goStep5], stack);
    return function () {
        return $("#results_display").offset().top;
    };
}

function setCmipCaption() {
    if (webClimateLab.inCmipRange) {
        $("#intro_cmipcomp").html("within the range projected by state of the" +
                " art models.<p></p>This helps confirm that your model's results are" +
                " reasonable.");
    } else {
        $("#intro_cmipcomp").html("outside the range projected by state of the" +
                " art models.<p></p>This suggests that your choice of model" +
                " parameters might have led to unreasonable results.");
    }
}

function goStep5(stack) {
    stack.push(goStep5);
    setProjView(1);
    setCPRun(.5);
    setTuning(.5);
    setPolicy(.5);
    fillIntro("step5");
    var back = $("<button>", {
        id: "step5_back",
        text: "Back"
    });
    var next = $("<button>", {
        id: "step5_next",
        text: "Next"
    });
    fillIntroNav([back, next], [backFn, goDone],
            stack);
    return function () {
        return $("#results_display").offset().top;
    };
}

function goDone(stack) {
    stack.push(goDone);
    setPolicy(1);
    setTuning(1);
    setCPRun(1);
    setProjView(1);
    setCmip(1);
    fillIntro("done");
    var back = $("<button>", {
        id: "done_back",
        text: "Back"
    });
    var restart = $("<button>", {
        id: "done_restart",
        text: "Replay"
    });
    var close = $("<button>", {
        id: "done_close",
        text: "Finish"
    });
    fillIntroNav([back, restart, close], [backFn, goStart, goClose], stack);
    return null;
}

function goClose(stack) {
    $("#intro").css("display", "none");
    $("#intro_spacer").css("display", "none");
    return null;
}
