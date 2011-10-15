<?php
require_once 'service-list.php';
define("FILE_EXT_JPEGTHUMBNAIL", ".thumbnail.JPG");
define("FILE_EXT_JPEG", ".JPG");
$response = null;

switch($_GET["request"])
{
	case "images-list":
		$response = serviceImagesList(FILE_EXT_JPEG, FILE_EXT_JPEGTHUMBNAIL); 
		break;
};

header("Content-type: text/json;");
print json_encode($response);
?>