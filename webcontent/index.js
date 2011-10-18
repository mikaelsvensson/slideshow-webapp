$(document).ready(function() {

	try {
		/*
		 * HTML5: Local storage
		 */
		var slideshowModel = JSON.parse(localStorage["slideshow-webapp-model"]);
	} catch (ex) {
		var slideshowModel = {
			title : "Untitled Slideshow",
			slides : []
		};
	}

	$.getJSON("http://www.mikaelsvensson.info/slideshow/service.php", {
		request : "images-list"
	}, function(data, textStatus, jqXHR) {
		
		var imageCollection = new ImageCollection();
		
		for(var i in data) {
			
			imageCollection.addImage(
				data[i].url, 
				data[i].thumbnailUrl, 
				data[i].width, 
				data[i].height
			);
		}
		
		var viewer = new SlideshowViewer(slideshowModel, imageCollection, "viewer-slide", "viewer-prev-button", "viewer-next-button", "viewer-annotations-buttons", "viewer-close-button", "viewer-comments");
		viewer.init();
	
		var designer = new SlideshowDesigner(slideshowModel, imageCollection, viewer, "designer-images", "designer-availableimages", "designer-gallery-droparea", "designer-buttons");
		designer.init();
	});

	$("#designer-title").text(slideshowModel.title);

	$("#designer-save-button").click(slideshowModel, function(e) {
		/*
		 * HTML5: Local storage
		 */
		localStorage["slideshow-webapp-model"] = JSON.stringify(e.data);
	});
});
