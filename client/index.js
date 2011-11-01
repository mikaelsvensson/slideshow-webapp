window.onload = function() {

	var U = new Utils();

	var viewer = new SlideshowViewer(/*slideshowModel, imageCollection, */"viewer-slide", "viewer-prev-button", "viewer-next-button", "viewer-annotations-buttons", "viewer-close-button", "viewer-comments");
	viewer.init();
	
	socket = io.connect('http://localhost:8080/');
	socket.on('connect', function() {
		socket.send('hi');

		socket.emit("login", {
			name: navigator.userAgent/* prompt("Vad heter du?")*/
		});

		socket.emit("image-list", function(data) {
			var imageCollection = new ImageCollection();
			for (var i in data) {
				imageCollection.addImage(data[i].url, data[i].thumbnailUrl, data[i].width, data[i].height);
			}

			var designer = new SlideshowDesigner(imageCollection, viewer, "designer-images", "designer-gallery-header", "designer-gallery-droparea", "designer-title");
			designer.init();
		});

		socket.on('userlist-updated', function(clientList) {
			console.log("Clients: " + clientList);
		});
		
		socket.on('slideshow-ended', function() {
			alert("Bildspelet avslutades av presentatören.");
			viewer.end(true);
		});
		
		socket.on('slideshow-gotoslide', function(slideIndex) {
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
		
		var onJoinLinkClick = function (e) {
		    var id = this.dataset.slideshowid;
            socket.emit("slideshow-join", id, function (model, currentIndex, presenterId) {
                viewer.start(model, currentIndex, presenterId);
            });
        };
		
		var loadSlideshowList = function(slideshowList) {
			var list = U.$("slideshow-list");
			
			while (list.nextSibling && list.nextSibling.nodeName == "A") {
			    list.parentNode.removeChild(list.nextSibling);
			}

			var ref = list.nextSibling;
			for (var i in slideshowList) {
				var joinLink = U.createElement("a", slideshowList[i].title);
				joinLink.dataset.slideshowid = slideshowList[i].id; 
				joinLink.onclick = onJoinLinkClick;
				list.parentNode.insertBefore(joinLink, ref);
			}
		};
		
		socket.on('slideshowlist-update', loadSlideshowList);
		socket.emit('slideshowlist-get', loadSlideshowList);

		socket.on('message', function(msg) {
			console.log("Received " + msg);
		});
	});
};
window.onunload = function() {
	socket.emit("logout");
};
