<?php
function serviceList($extension = null, $excludeExtension = null) {
	$files = scandir("slides");
	$response = array();
	foreach ($files as $file) {
		if ($file != "." && $file != "..") {
			if (empty($extension) || substr(strtolower($file), -strlen($extension)) == $extension) {
				if (empty($excludeExtension) || substr(strtolower($file), -strlen($excludeExtension)) != $excludeExtension) {
					$response[] = $file;
				}
			}
		}
	}
	return $response;
};
?>