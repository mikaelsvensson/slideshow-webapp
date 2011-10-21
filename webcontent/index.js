window.onload = function() {

	var U = new Utils();
	
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

	U.xhrJson("http://www.mikaelsvensson.info/slideshow/service.php?request=images-list", true
	, function(data) {
		
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

	U.$("designer-title").innerHTML = slideshowModel.title;

	U.$("designer-save-button").onclick = function(e) {
		/*
		 * HTML5: Local storage
		 */
		localStorage["slideshow-webapp-model"] = JSON.stringify(slideshowModel);
	};
};
