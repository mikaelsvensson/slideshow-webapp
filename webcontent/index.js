window.onload = function() {

	var U = new Utils();

	try {
		/*
		 * HTML5: Web Storage
		 */
		var slideshowModel = JSON.parse(localStorage["slideshow-webapp-model"]);
	} catch (ex) {
	}
	if(!slideshowModel) {
		var slideshowModel = {
			title : "Untitled Slideshow",
			slides : []
		};
	}
	socket = io.connect('http://localhost:8080/');
	socket.on('connect', function() {
		socket.send('hi');

		socket.emit("login", {
			name : prompt("Vad heter du?")
		});

		socket.emit("image-list", null);

		socket.on("image-list-response", function(data) {
			var imageCollection = new ImageCollection();

			for(var i in data) {

				imageCollection.addImage(data[i].url, data[i].thumbnailUrl, data[i].width, data[i].height);
			}

			var viewer = new SlideshowViewer(slideshowModel, imageCollection, "viewer-slide", "viewer-prev-button", "viewer-next-button", "viewer-annotations-buttons", "viewer-close-button", "viewer-comments");
			viewer.init();

			var designer = new SlideshowDesigner(slideshowModel, imageCollection, viewer, "designer-images", "designer-availableimages", "designer-gallery-droparea", "designer-buttons");
			designer.init();
		});

		socket.on('userlist-updated', function(clientList) {
			console.log("Clients: " + clientList);
		});

		socket.on('message', function(msg) {
			console.log("Received " + msg);
		});
	});

	U.$("designer-title").innerHTML = slideshowModel.title;

	U.$("designer-save-button").onclick = function(e) {
		/*
		 * HTML5: Web Storage
		 */
		localStorage["slideshow-webapp-model"] = JSON.stringify(slideshowModel);
	};
};
window.onunload = function() {
	socket.emit("logout");
};
