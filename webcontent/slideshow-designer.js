/**
 * @author Mikael
 */

(function($) {

	var DND_TRANSFERDATA_TEXTPLAIN = "text/plain";
	var DND_TYPE_MOVE = "MOVE";
	var DND_TYPE_ADD = "ADD";

	var URL_TO_SLIDE_TITLE_PATTERN = /\/?(\w+)\.\w{2,5}$/;
	
	SlideshowDesigner = function(slideshowModel, slidesContainerId, galleryContainerId, localFilesDropContainerId, buttonContainerId) {
		this._model = slideshowModel;
		this._slidesContainer = $("#" + slidesContainerId);
		this._galleryContainer = $("#" + galleryContainerId);
		this._localFilesDropContainer = $("#" + localFilesDropContainerId);
		this._buttonContainer = $("#" + buttonContainerId);
	};

	SlideshowDesigner.prototype.init = function() {
		this._initGallery();
		this._initSlides();
		this._initLocalFilesDropArea();
		this._initButtons();
	};
	SlideshowDesigner.prototype._initGallery = function() {
		var that = this;
		$.getJSON("http://www.mikaelsvensson.info/slideshow/service.php", {
			request : "images-list"
		}, function(data, textStatus, jqXHR) {
			for(var i in data) {
				var img = new Image();
				img.src = data[i].thumbnailUrl;
				img.draggable = false;

				var figCap = document.createElement("figcaption");
				figCap.innerHTML = that._getSlideTitleFromURL(data[i].url);

				var fig = document.createElement("figure");
				$(document.createElement("div")).append(img).appendTo(fig);
				fig.appendChild(figCap);

				var imageContainer = document.createElement("div");
				imageContainer.className = "image";
				imageContainer.id = "img" + i;
				imageContainer.draggable = true;
				imageContainer.dataset.thumbnailUrl = data[i].thumbnailUrl;
				imageContainer.dataset.url = data[i].url;
				imageContainer.ondragstart = that._onGalleryImageDragStart;
				imageContainer.appendChild(fig);
				that._galleryContainer.append(imageContainer);

			}
		});
	};
	SlideshowDesigner.prototype._initSlides = function() {
		this._slidesContainer.append(this._initSlides_createSlideSeparator());
		for(var i in this._model.slides) {
			this._initSlides_addSlide(this._model.slides[i], i);
		}

	};
	SlideshowDesigner.prototype._getSlideIndex = function(el) {
		var pos = 0;
		var sibling = el;
		while(( sibling = sibling.previousSibling) != null) {
			pos++;
		}
		return dropPos = Math.floor(pos / 2);
	};

	SlideshowDesigner.prototype._initSlides_createSlideSeparator = function() {
		var sep = document.createElement("div");
		sep.className = "sep";
		sep.ondragenter = function(e) {
			e.target.classList.add("drag-over");
			e.preventDefault();
			return false;
		};
		sep.ondragleave = function(e) {
			e.target.classList.remove("drag-over");
		};
		sep.ondragover = function(e) {
			e.preventDefault();
			return false;
		};
		var that = this;
		sep.ondrop = function(e) {
			var rawData = e.dataTransfer.getData(DND_TRANSFERDATA_TEXTPLAIN).split("|");
			var action = rawData[0];

			var dropPos = that._getSlideIndex(this);

			switch (action) {
				case DND_TYPE_ADD:
					var imageUrl = rawData[1];
					var imageThumbnailUrl = rawData[2];
					that.addSlide(imageUrl, imageThumbnailUrl, dropPos);
					break;
				case DND_TYPE_MOVE:
					var currentSlideIndex = parseInt(rawData[1], 10);
					var newSlideIndex = dropPos;
					that.moveSlide(currentSlideIndex, newSlideIndex);
					break;
			}
			e.target.classList.remove("drag-over");

			e.preventDefault();
			return false;
		};
		return sep;
	};

	SlideshowDesigner.prototype._initSlides_addSlide = function(slide, slideIndex) {
		this._slidesContainer.append(this._createSlideUI(slide, slideIndex), this._initSlides_createSlideSeparator());
	};

	SlideshowDesigner.prototype._createSlideUI = function(slide, slideIndex) {
		var img = new Image();
		//img.src = slide.url;
		img.src = slide.thumbnailUrl;
		img.draggable = false;

		var figCap = document.createElement("figcaption");
		figCap.innerHTML = slide.title;
		var removeLink = $(document.createElement("a")).text("X").click(this, function(e) {
			var pos = e.data._getSlideIndex(this.parentNode.parentNode.parentNode);
			e.data.removeSlide(pos);
		});
		removeLink.appendTo(figCap);

		var fig = document.createElement("figure");
		var div = document.createElement("div");
		div.appendChild(img);
		fig.appendChild(div);
		fig.appendChild(figCap);

		var imageContainer = document.createElement("div");
		imageContainer.className = "image";
		//imageContainer.id = "img" + i;
		imageContainer.draggable = true;
		imageContainer.dataset.slideindex = slideIndex;
		var that = this;
		imageContainer.ondragstart = function(e) {

			var pos = that._getSlideIndex(this);

			e.dataTransfer.setData(DND_TRANSFERDATA_TEXTPLAIN, DND_TYPE_MOVE + "|" + pos);
		};
		imageContainer.appendChild(fig);

		return imageContainer;
	};

	SlideshowDesigner.prototype._initLocalFilesDropArea = function() {

	};
	SlideshowDesigner.prototype._initButtons = function() {

	};

	SlideshowDesigner.prototype._onGalleryImageDragStart = function(e) {
		e.dataTransfer.setData(DND_TRANSFERDATA_TEXTPLAIN, DND_TYPE_ADD + "|" + this.dataset.url + "|" + this.dataset.thumbnailUrl);
	};

	SlideshowDesigner.prototype._getSlideTitleFromURL = function(url) {
		var match = URL_TO_SLIDE_TITLE_PATTERN.exec(url);
		return match[1];
	};

	SlideshowDesigner.prototype.addSlide = function(imageUrl, imageThumbnailUrl, newSlideIndex) {
		if(!this._model.slides) {
			this._model.slides = [];
		}
		var slides = this._model.slides;
		var slide = {
			url : imageUrl,
			thumbnailUrl : imageThumbnailUrl,
			title : this._getSlideTitleFromURL(imageUrl)
		};
		if(newSlideIndex >= slides.length) {
			slides.push(slide);
		} else {
			slides.splice(newSlideIndex, 0, slide);
		}
		if(this._slidesContainer) {
			var slideEl = this._createSlideUI(slide, newSlideIndex);
			var sepEl = this._slidesContainer.children()[newSlideIndex * 2];
			this._slidesContainer.get(0).insertBefore(this._initSlides_createSlideSeparator(), sepEl.nextSibling);
			this._slidesContainer.get(0).insertBefore(slideEl, sepEl.nextSibling);
		}
		return slide;
	};
	SlideshowDesigner.prototype.removeSlide = function(slideIndex) {
		if(this._model.slides) {
			this._model.slides.splice(slideIndex, 1);
		}
		if(this._slidesContainer) {
			var slideEl = this._slidesContainer.children()[slideIndex * 2 + 1];
			$(slideEl.nextSibling).add(slideEl).remove();
		}
	};
	SlideshowDesigner.prototype.moveSlide = function(currentSlideIndex, newSlideIndex) {
		if(this._model.slides) {
			var slide = this._model.slides.splice(currentSlideIndex, 1)[0];
			this._model.slides.splice(newSlideIndex, 0, slide);

			if(this._slidesContainer) {
				var slideEl = this._slidesContainer.children()[currentSlideIndex * 2 + 1];
				var sepEl = this._slidesContainer.children()[newSlideIndex * 2];
				this._slidesContainer.get(0).insertBefore(slideEl.nextSibling, sepEl.nextSibling);
				this._slidesContainer.get(0).insertBefore(slideEl, sepEl.nextSibling);
			}
		}
	};
	SlideshowDesigner.prototype.getModel = function() {
		return this._model;
	};
})(jQuery);
