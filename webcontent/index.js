$(document).ready(function() {

	try {
		var slideshowModel = JSON.parse(localStorage["slideshow-webapp-model"]);
	} catch (ex) {
		var slideshowModel = {
			title : "Untitled Slideshow",
			slides : []
		};
	}

	var designer = new SlideshowDesigner(
			slideshowModel, 
			"designer", 
			"designer-availableimages", 
			"designer-gallery-droparea", 
			"designer-buttons");
	designer.init();

	$("#designer-title").text(slideshowModel.title);

	$("#designer-save-button").click(slideshowModel, function(e) {
		localStorage["slideshow-webapp-model"] = JSON.stringify(e.data);
	});
});
