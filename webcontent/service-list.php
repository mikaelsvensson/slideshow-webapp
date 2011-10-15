<?php
function serviceImagesList($extension = null, $thumbnailExtension = null) {
	$files = scandir("slides");
	$response = array();
	foreach ($files as $file) {
		if ($file != "." && $file != "..") {
			if (substr($file, -strlen($extension)) == $extension && substr($file, -strlen($thumbnailExtension)) != $thumbnailExtension) {
				$url = "slides/" . $file;
				$thumbnailUrl = null;
				$name = substr($file, 0, -strlen($extension));
				$thumbnailFilePath = "slides/$name$thumbnailExtension";
				if (file_exists($thumbnailFilePath))
				{
					$thumbnailUrl = $thumbnailFilePath;
				} 
				$entry = array("url" => $url, "thumbnailUrl" => $thumbnailUrl);
				$response[] = $entry;
			}
		}
	}
	return $response;
};
?>