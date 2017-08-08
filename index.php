<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Web Climate Lab</title>
        <link rel="stylesheet" type="text/css"
              href="css/urbano_boldcondensed_macroman/stylesheet.css"/>
        <link rel="stylesheet" type="text/css" href="css/web_climate_lab.css"/>
        <script src="https://code.jquery.com/jquery-2.2.4.js"></script>
        <script type="text/javascript" src="js/FontDetect/fontdetect.min.js"></script>
        <script type="text/javascript" src="js/jquery-getActiveMQ.js"></script>
        <script type="text/javascript" src="js/jquery-ui.min.js"></script>
        <script type="text/javascript" src="js/temp_graph.js"></script>
        <script type="text/javascript" src="js/distribs.js"></script>
        <script type="text/javascript" src="js/ocean.js"></script>
        <script type="text/javascript" src="js/view.js"></script>
        <script type="text/javascript" src="js/intro.js"></script>
        <script type="text/javascript" src="js/web_climate_lab.js"></script>
    </head>
    <body>
        <div id="intro" class="panel fi_start">
            <div id="intro_text">
                <h2 class="intro_title">Web Climate Lab</h2>
                <p>This application requires JavaScript, which is disabled
                    in your browser. Please enable JavaScript to use this
                    application.</p>
            </div>
            <div id="intro_nav"></div>
        </div>
        <div id="all">
            <div id="intro_spacer"></div>
            <div id="main">
                <div id="policy" class="panel panel_box">
                    <h3 class="panel_title">Which climate policy will the world follow?&nbsp;
                        <a href="javascript:;">
                            <img class="help" src="img/helpbutton.png" alt="Info" data-id="policy"/>
                        </a></h3>
                    <div id="scen_pick" class="paradiv">
                        <input type="radio" name="rcp" class="radiogrid" value="8.5" data-fallback="true"/>
                        <div class="radiogridcap">The world will <b>do very little</b>
                            to reduce greenhouse gas emissions, allowing them to reach
                            <b>three times current levels</b> by 2100.</div>
                        <input type="radio" name="rcp" class="radiogrid" value="6.0"/>
                        <div class="radiogridcap">The world will <b>delay taking
                                action</b> to reduce greenhouse gas emissions, allowing them to reach
                            nearly <b>twice current levels in 2060</b> but reducing
                            them to <b>just above current levels by 2100.</b></div>
                        <input type="radio" name="rcp" class="radiogrid" value="4.5"/>
                        <div class="radiogridcap">The world will take <b>significant
                                action</b> to reduce greenhouse gas emissions, peaking them just above
                            current levels by 2050 and reducing them to <b>less
                                than half of current levels by 2080.</b></div>
                        <input type="radio" name="rcp" class="radiogrid" value="2.6"/>
                        <div class="radiogridcap">The world will take <b>aggressive
                                action</b> to reduce greenhouse gas emissions, reducing
                            them to <b>zero by 2080.</b></div>
                    </div>
                </div>
                <div id="cptop_anchor"></div>
                <div id="cp" class="panel panel_box">
                    <h3 id="cp_title" class="panel_title">Tune your model&nbsp;
                        <a href="javascript:;">
                            <img class="help" src="img/helpbutton.png" alt="Info" data-id="params"/>
                        </a></h3>
                    <div id="param_pick">
                        <div class="boxed_slider paradiv">
                            <h4>How strongly does the climate respond to greenhouse gases?</h4>
                            <div class="slider_cont">
                                <canvas id="cs_disp" width="160" height="130"></canvas>
                                <input type="range" id="clim_sens_param" class="cp_slider" min="1" max="8" value="3.6" step="0.2" disabled/>
                                <span id="clim_sens_param_disp" class="slider_val"></span>
                            </div>
                        </div>
                        <div id="sqrtkv_cont" class="boxed_slider paradiv">
                            <h4>How quickly does the ocean absorb heat from the atmosphere?</h4>
                            <div class="slider_cont">
                                <canvas id="sqrtkv_disp" width="160" height="130"></canvas>
                                <input type="range" id="diff_param" class="cp_slider" min="0.2" max="8.4" value="2.2" step="0.2" disabled/>
                                <span id="diff_param_disp" class="slider_val"></span>
                            </div>
                        </div>
                    </div>
                    <div id="tuning_buttons">
                        <button id="cp_run" disabled>Run Model</button>
                        <a id="cp_output" href="#">Output To File</a>
                    </div>
                </div>
                <div id="results_cont">
                    <canvas id="results_display" class="panel" height="364" width="300"></canvas>
                    <a id="cmip_help" href="javascript:;">
                        <img class="help" src="img/helpbutton.png" alt="Info" data-id="cmip"/>
                    </a>
                </div>
            </div>
            <div id="copyright">
                Copyright &copy; 2016 MIT Joint Program on the Science and Policy of Global Change.
            </div>
        </div>
        <div id="intro_templates" style="display: none;">
            <div id="intro_splash" data-p="#all" data-css="fi_start">
                <h2 class="intro_title">Welcome to the Web Climate Lab!</h2>
                <p>This application is built around a simple climate model,
                    which demonstrates the process used by more sophisticated
                    models to help us understand climate change. Click &ldquo;Start&rdquo; for
                    an introduction to the model, or click &ldquo;Skip&rdquo;
                    to start using it immediately.</p>
            </div>
            <div id="intro_step1" data-p="#cptop_anchor" data-css="fi_controls">
                <h3 class="intro_title">Choose a policy scenario</h3>
                <p>First, choose which climate policy you think the world will
                    follow.</p>
            </div>
            <div id="intro_step2" data-p="#cptop_anchor" data-css="fi_controls">
                <h3 class="intro_title">Choose your model parameters</h3>
                <p>Move these two sliders to change how your model simulates the
                    climate, or click the question mark for more information.</p>
            </div>
            <div id="intro_step2_1" data-p="#cptop_anchor" data-css="fi_run">
                <h3 class="intro_title">Run your model</h3>
                <p>Now, click &ldquo;Run Model&rdquo; to see your results!</p>
            </div>
            <div id="intro_step3" data-p="#cptop_anchor" data-css="fi_overproj">
                <h3 class="intro_title">Model results</h3>
                <p>The red line shows the results of your simple model. It
                    projects that by 2100, the Earth's average surface temperature
                    will increase <span id="intro_proj2100"></span></p>
                <p>Now, let's compare your result with results from state of the
                    art models.</p>
            </div>
            <div id="intro_step4" data-p="#cptop_anchor" data-css="fi_overproj">
                <h3 class="intro_title">Comparison with other models</h3>
                <p>Your simple model's projection for average temperatures between 2081
                    and 2100 is <span id="intro_cmipcomp"></span></p>
                <p>We should also
                    see how well your model fits past observations.</p>
            </div>
            <div id="intro_step5" data-p="#cptop_anchor" data-css="fi_overproj">
                <h3 class="intro_title">Comparison with past observations</h3>
                <p>To evaluate their models, scientists use reconstructions of past
                    climate, show here in blue. If the red line is almost always in the
                    blue range, your simple model matches past observations
                    well, so it's also likely to project future temperatures well.
                    If it doesn't, your choice of parameters might have led to
                    an inaccurate model! Change the parameters to improve your projection.</p>
            </div>
            <div id="intro_done" data-p="#cptop_anchor" data-css="fi_overproj">
                <h3 class="intro_title">Explore!</h3>
                <p>You now have access to all the features of this application.
                    Try varying your policy selections to understand
                    the implications of each decision!</p>
            </div>
            <div id="helpdata_policy">
                The options listed here correspond to the Representative
                Concentration Pathways, or RCPs, created by the Intergovernmental
                Panel on Climate Change. Rather than representing specific policies,
                these pathways describe possibilities for atmospheric greenhouse
                gas concentrations, which are affected by both policy and natural
                variation. We have summarized them in terms of policy for convenience.
                <p></p>
                The RCPs are a worldwide standard for concentration scenarios,
                and therefore enable comparisons between many different models.
                <p></p>
                For more information, see
                <a href="https://www.skepticalscience.com/rcp.php" target="_blank">this guide.</a>
            </div>
            <div id="helpdata_params">
                To simulate the behavior of the climate, models use equations
                derived from observations and experiments. Some of these equations
                include numbers, called &ldquo;parameters,&rdquo; which scientists can't
                measure exactly. Instead, they estimate the likelihood of each
                possible value, producing the green curve shown on the graphs
                below.
                <p></p>
                If you change the sliders below, your model's results will change.
                However, not all of the results you can produce are reasonable,
                as you can see by comparing your model's results to past
                observations and the results of other models. In particular,
                using two &ldquo;very unlikely&rdquo; values can produce wildly improbable
                projections.
            </div>
            <div id="helpdata_cmip">
                The green bar shows the 5th to 95th percentile range of Coupled
                Model Intercomparison Project phase 5 (CMIP5) results for the
                selected scenario. CMIP5 includes 42 models from research groups
                around the world, all of which are atmosphere-ocean general
                circulation models, the most sophisticated type available. Its
                results were used for the Intergovernmental Panel on Climate
                Change's most recent report.
            </div>
        </div>
    </body>
</html>
