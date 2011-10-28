/**
 * @author Mikael
 */

(function(U) {

	/*
	 * HTML5: Drag and drop
	 */
	var DND_TRANSFERDATA_TEXTPLAIN = "text/plain";
	var DND_TYPE_MOVE = "MOVE";
	var DND_TYPE_ADD = "ADD";

	var URL_TO_SLIDE_TITLE_PATTERN = /\/?(\w+)\.\w{2,5}$/;
	
	SlideshowDesigner = function(slideshowModel, imageCollection, viewer, slidesContainerId, galleryContainerId, localFilesDropContainerId, buttonContainerId) {
		this._model = slideshowModel;
		this._imageCollection = imageCollection;
		this._viewer = viewer;
		this._slidesContainer = U.$(slidesContainerId);
		this._galleryContainer = U.$(galleryContainerId);
		this._localFilesDropContainer = U.$(localFilesDropContainerId);
		this._buttonContainer = U.$(buttonContainerId);
	};

	SlideshowDesigner.prototype.init = function() {
		this._initGallery();
		this._initSlides();
		this._initLocalFilesDropArea();
		this._initButtons();
	};
	SlideshowDesigner.prototype._initGallery = function() {
		var data = this._imageCollection.getList();
		for(var i = 0; i < data.length; i++) {
			var img = new Image();
			img.src = data[i].thumbnailUrl;
			img.draggable = false;

			var figCap = U.createElement("figcaption", this._getSlideTitleFromURL(data[i].url));

			var fig = U.createElement("figure");
			var div = U.createElement("div");
			div.appendChild(img);
			U.appendChildren(fig, div, figCap);

			var imageContainer = U.createElement("div");
			imageContainer.className = "image";
			imageContainer.id = "img" + i;

			/*
			 * HTML5: Drag and drop
			 */
			imageContainer.draggable = true;
			imageContainer.ondragstart = this._onGalleryImageDragStart;

			/*
			 * HTML5: Dataset (custom element attributes)
			 */
			imageContainer.dataset.thumbnailUrl = data[i].thumbnailUrl;
			imageContainer.dataset.url = data[i].url;

			imageContainer.appendChild(fig);
			this._galleryContainer.appendChild(imageContainer);
		}
	};
	SlideshowDesigner.prototype._initSlides = function() {
		this._slidesContainer.appendChild(this._initSlides_createSlideSeparator());
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
		var sep = U.createElement("div");
		sep.className = "sep";
		
		var that = this;
		
		/*
		 * HTML5: Drag and drop events and the data transfer object.
		 */
		sep.ondragenter = function(e) {
			/*
			 * HTML5: CSS class list API
			 */
			e.target.classList.add("drag-over");
			e.preventDefault();
			return false;
		};
		sep.ondragleave = function(e) {
			/*
			 * HTML5: CSS class list API
			 */
			e.target.classList.remove("drag-over");
		};
		sep.ondragover = function(e) {
			e.preventDefault();
			return false;
		};
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
			/*
			 * HTML5: CSS class list API
			 */
			e.target.classList.remove("drag-over");

			e.preventDefault();
			return false;
		};
		return sep;
	};

	SlideshowDesigner.prototype._initSlides_addSlide = function(slide, slideIndex) {
		U.appendChildren(this._slidesContainer, 
				this._createSlideUI(slide, slideIndex), 
				this._initSlides_createSlideSeparator());
	};

	SlideshowDesigner.prototype._createSlideUI = function(slide, slideIndex) {
		var that = this;

		var showSlide = function(e) {
			that._viewer.start(that._model, that._getSlideIndex(this.parentNode.parentNode.parentNode));
		};
		
		var img = new Image();
		img.src = slide.thumbnailUrl;
		img.draggable = false;
		img.ondblclick = showSlide;

		var figCap = U.createElement("figcaption");
		figCap.innerHTML = slide.title;
		figCap.ondblclick = showSlide;
		var closeLink = U.createElement("button");
		closeLink.classList.add("delete");
		closeLink.onclick = function (e) {
			var pos = that._getSlideIndex(this.parentNode.parentNode.parentNode);
			that.removeSlide(pos);
		};
		var openLink = U.createElement("button");
		openLink.classList.add("fullsize");
		openLink.onclick = showSlide; 
		U.appendChildren(figCap, closeLink, openLink);

		var fig = U.createElement("figure");
		var div = U.createElement("div");
		div.appendChild(img);
		fig.appendChild(div);
		fig.appendChild(figCap);

		var imageContainer = U.createElement("div");
		imageContainer.className = "image";
		/*
		 * HTML5: Dataset (custom element attributes)
		 */
		imageContainer.dataset.slideindex = slideIndex;
		/*
		 * HTML5: Drag and drop (events, properties and datatransfer object)
		 */
		imageContainer.draggable = true;
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
		/*
		 * HTML5: Drag and drop (datatransfer object)
		 */
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
			var sepEl = this._slidesContainer.children[newSlideIndex * 2];
			this._slidesContainer.insertBefore(this._initSlides_createSlideSeparator(), sepEl.nextSibling);
			this._slidesContainer.insertBefore(slideEl, sepEl.nextSibling);
		}
		return slide;
	};
	SlideshowDesigner.prototype.removeSlide = function(slideIndex) {
		if(this._model.slides) {
			this._model.slides.splice(slideIndex, 1);
		}
		if(this._slidesContainer) {
			var slideEl = this._slidesContainer.children[slideIndex * 2 + 1];
			U.removeElement(slideEl.nextSibling);
			U.removeElement(slideEl);
		}
	};
	SlideshowDesigner.prototype.moveSlide = function(currentSlideIndex, newSlideIndex) {
		if(this._model.slides) {
			var slide = this._model.slides.splice(currentSlideIndex, 1)[0];
			this._model.slides.splice(newSlideIndex, 0, slide);

			if(this._slidesContainer) {
				var slideEl = this._slidesContainer.children[currentSlideIndex * 2 + 1];
				var sepEl = this._slidesContainer.children[newSlideIndex * 2];
				this._slidesContainer.insertBefore(slideEl.nextSibling, sepEl.nextSibling);
				this._slidesContainer.insertBefore(slideEl, sepEl.nextSibling);
			}
		}
	};
	SlideshowDesigner.prototype.getModel = function() {
		return this._model;
	};
})(new Utils());
