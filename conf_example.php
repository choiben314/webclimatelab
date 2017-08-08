<?php
$sqlHost = "sql.example.edu";
$sqlDB = "example";
$sqlUser = "example";
$sqlPass = "example";
$sqlCharset = "utf8"; // Will most likely be utf8, but change if necessary

define('DEBUG', false); // Change to true or false depending on run environment
// true on a production server is a security risk

error_reporting(E_ALL);
ini_set('display_errors', DEBUG ? 1 : 0);
