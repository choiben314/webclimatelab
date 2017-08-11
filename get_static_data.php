<?php
require 'conf.php';

$dsn = "mysql:host=$sqlHost;dbname=$sqlDB;charset=$sqlCharset";
$opt = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];
$pdo = new PDO($dsn, $sqlUser, $sqlPass, $opt);

$stmt = $pdo->query("SELECT `year`, `2.6_aer`, `2.6_noaer`, `4.5_aer`, `4.5_noaer`, `6.0_aer`, `6.0_noaer`, `8.5_aer`, `8.5_noaer` FROM rcp_forcings");
$rcp = ["2.6" => [], "4.5" => [], "6.0" => [], "8.5" => []];
foreach ($stmt as $row) {
    $rcp["2.6"][$row["year"]] = array_values(array_slice($row, 1, 2));
    $rcp["4.5"][$row["year"]] = array_values(array_slice($row, 3, 2));
    $rcp["6.0"][$row["year"]] = array_values(array_slice($row, 5, 2));
    $rcp["8.5"][$row["year"]] = array_values(array_slice($row, 7, 2));
}
$output["rcp"] = $rcp;

$stmt = $pdo->query("SELECT * FROM rcp_temp");
$model_temps = ["2.6_temp" => [], "4.5_temp" => [], "6.0_temp" => [], "8.5_temp" => []];
foreach ($stmt as $row) {
    $model_temps["2.6_temp"][$row["year"]] = array_values(array_slice($row, 1, 3));
    $model_temps["4.5_temp"][$row["year"]] = array_values(array_slice($row, 4, 3));
    $model_temps["6.0_temp"][$row["year"]] = array_values(array_slice($row, 7, 3));
    $model_temps["8.5_temp"][$row["year"]] = array_values(array_slice($row, 10, 3));
}
$output["model_temps"] = $model_temps;

$stmt = $pdo->query("SELECT * FROM HadCRUT4");
$output["gtemps"] = [];
foreach ($stmt as $row) {
    $output["gtemps"][$row["Year"]] = array_values(array_slice($row, 1));
}

$stmt = $pdo->query("SELECT * FROM past_land_temps");
$output["ltemps"] = [];
foreach ($stmt as $row) {
    $output["ltemps"][$row["year"]] = array_values(array_slice($row, 1));
}

$stmt = $pdo->query("SELECT * FROM past_ocean_temps");
$output["otemps"] = [];
foreach ($stmt as $row) {
    $output["otemps"][$row["year"]] = array_values(array_slice($row, 1));
}

$stmt = $pdo->query("SELECT * FROM past_ohcs");
$output["ohcs"] = [];
foreach ($stmt as $row) {
    $output["ohcs"][$row["year"]] = array_values(array_slice($row, 1));
}

$stmt = $pdo->query("SELECT MAX(year) AS currentYear FROM past_global_temps");
$output["current_year"] = $stmt->fetchAll(PDO::FETCH_COLUMN)[0];

$stmt = $pdo->query("SELECT * FROM cs_dist");
$output["cs_dist"] = [];
foreach ($stmt as $row) {
    $output["cs_dist"][$row["bin"]] = $row["density"];
}

$stmt = $pdo->query("SELECT * FROM sqrtkv_dist");
$output["sqrtkv_dist"] = [];
foreach ($stmt as $row) {
    $output["sqrtkv_dist"][$row["bin"]] = $row["density"];
}

$stmt = $pdo->query("SELECT * FROM fae_dist");
$output["fae_dist"] = [];
foreach ($stmt as $row) {
    $output["fae_dist"][$row["bin"]] = $row["density"];
}

$stmt = $pdo->query("SELECT * FROM ar5_proj");
$output["ar5_proj"] = [];
foreach ($stmt as $row) {
    $output["ar5_proj"][$row["rcp"]] = array_values(array_slice($row, 1));
}

echo json_encode($output, JSON_NUMERIC_CHECK);
