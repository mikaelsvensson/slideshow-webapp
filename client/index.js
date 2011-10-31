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
			title: null,
			slides: []
		};
	}
	
	var viewer = new SlideshowViewer(/*slideshowModel, imageCollection, */"viewer-slide", "viewer-prev-button", "viewer-next-button", "viewer-annotations-buttons", "viewer-close-button", "viewer-comments");
	viewer.init();
	
	socket = io.connect('http://localhost:8080/');
	socket.on('connect', function() {
		socket.send('hi');

		socket.emit("login", {
			name : prompt("Vad heter du?")
		});

		socket.emit("image-list", function(data) {
			var imageCollection = new ImageCollection();
			for (var i in data) {
				imageCollection.addImage(data[i].url, data[i].thumbnailUrl, data[i].width, data[i].height);
			}

			var designer = new SlideshowDesigner(slideshowModel, imageCollection, viewer, "designer-images", "designer-availableimages", "designer-gallery-droparea", "designer-buttons");
			designer.init();
		});

		socket.on('userlist-updated', function(clientList) {
			console.log("Clients: " + clientList);
		});
		
		socket.on('slideshow-ended', function() {
			console.log("Slideshow has ended.");
			viewer.end(true);
		});
		
		socket.on('slideshow-gotoslide', function(slideIndex) {
			console.log("Presenter has switched to slide " + (slideIndex+1) + ".");
			viewer.gotoSlide(slideIndex);
		});
		
		socket.on("slideshow-addannotation-request", function (slideIndex, annotation) {
			if (viewer._currentSlideIndex == slideIndex) {
				viewer.addAnnotation(annotation);
			}
		});
		
		socket.on("slide-update", function(slideIndex, slide) {
			viewer.setSlide(slideIndex, slide);
		});
		var loadSlideshowList = function(slideshowList) {
			var list = U.$("slideshowList"); 
			list.innerHTML = "";
			for (var i in slideshowList) {
				var joinLink = U.createElement("span", slideshowList[i].title + " (" + slideshowList[i].id + ")");
				joinLink.onclick = function(id) {
					return function () {
						socket.emit("slideshow-join", id, function (model, currentIndex, presenterId) {
							console.log("You are looking as slide " + (currentIndex + 1));
							viewer.start(model, currentIndex, presenterId);
						});
					};
				}(slideshowList[i].id);
				list.appendChild(joinLink);
			}
		};
		
		socket.on('slideshowlist-update', loadSlideshowList);
		socket.emit('slideshowlist-get', loadSlideshowList);

		socket.on('message', function(msg) {
			console.log("Received " + msg);
		});
	});

	var titleInput = U.$("designer-title"); 
	if (slideshowModel.title) {
	    titleInput.value = slideshowModel.title;
	}
	titleInput.onchange = function () {
	    slideshowModel.title = this.value;
	};

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
