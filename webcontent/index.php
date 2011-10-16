<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />

		<link rel="shortcut icon" href="/favicon.ico" />
		<link rel="stylesheet" href="style-core.css" charset="UTF-8">

		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script>
		<!--<script src="slideshow.js"></script>-->
		<script src="slideshow-designer.js"></script>
		<script src="slideshow-viewer.js"></script>
		<script src="slide-annotations.js"></script>
		<script src="canvastools.js"></script>
		<script src="imagecollection.js"></script>
		<script src="index.js"></script>
		
		<title>Slide Show</title>
	</head>
	<body class="mode-designer">
		<div id="designer">
			<?php include("designmode.php"); ?>
		</div>
		<div id="viewer">
			<?php include("viewer.php"); ?>
		</div>
	</body>
</html>