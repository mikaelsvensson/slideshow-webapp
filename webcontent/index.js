$(document).ready(function() {
	$.getJSON("http://www.mikaelsvensson.info/slideshow/service.php", {
		request : "list-thumbs"
	}, function(data, textStatus, jqXHR) {
		var container = $("#images");
		for(var i in data) {
			var img = new Image();
			img.src = "slides/" + data[i];
			img.draggable = false;
			
			var figCap = document.createElement("figcaption");
			figCap.innerHTML = data[i];
			
			var fig = document.createElement("figure");
			$(document.createElement("div")).append(img).appendTo(fig);
			fig.appendChild(figCap);
			
			var imageContainer = document.createElement("div");
			imageContainer.className = "image";
			imageContainer.id = "img" + i;
			imageContainer.draggable = true;
			imageContainer.dataset.filename = data[i];
			imageContainer.ondragstart = function(e) {
				e.dataTransfer.setData("image-id", e.target.id);
			};
			imageContainer.appendChild(fig);
			
			var sep = document.createElement("div");
			sep.className = "sep";
			sep.ondragenter = function(e) {
				$(e.target).addClass("drag-over");
				e.preventDefault();
				return false;
			};
			sep.ondragleave = function(e) {
				$(e.target).removeClass("drag-over");
			};
			sep.ondragover = function(e) {
				e.preventDefault();
				return false;
			};
			sep.ondrop = function(e) {
				var el = $("#" + e.dataTransfer.getData("image-id"));
				//alert("Dropped " + el.get(0).dataset.filename);
				var dropZone = el.next();
				if(dropZone.get(0) != e.target) {
					dropZone.insertAfter(e.target);
					el.insertAfter(e.target);
				}
				$(e.target).removeClass("drag-over");

				e.preventDefault();
				return false;
			};

			container.append(imageContainer, sep)
		}
	});
});
