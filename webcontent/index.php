<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />

		<link rel="shortcut icon" href="/favicon.ico" />
		<link rel="stylesheet" href="style-core.css" charset="UTF-8">

		<script src="utils.js"></script>
		<script src="designer/designer.js"></script>
		<script src="viewer/viewer-annotations.js"></script>
		<script src="viewer/viewer-canvastools.js"></script>
		<script src="viewer/viewer.js"></script>
		<script src="imagecollection.js"></script>
		<script src="index.js"></script>
		
		<title>Slide Show</title>
	</head>
	<body class="mode-designer">
		<div id="designer">
			<?php include("designer/designer.php"); ?>
		</div>
		<div id="viewer">
			<?php include("viewer/viewer.php"); ?>
		</div>
	</body>
</html>