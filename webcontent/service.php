<?php
require_once 'service-list.php';
define("FILE_EXT_JPEGTHUMBNAIL", ".thumbnail.jpg");
define("FILE_EXT_JPEG", ".jpg");
$response = null;

switch($_GET["request"])
{
	case "list":
		$response = serviceList(FILE_EXT_JPEG, FILE_EXT_JPEGTHUMBNAIL); 
		break;
	case "list-thumbs":
		$response = serviceList(FILE_EXT_JPEGTHUMBNAIL); 
		break;
};

print json_encode($response);
?>