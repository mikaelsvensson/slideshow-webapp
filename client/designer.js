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
	var DND_TYPE_ADDCOLLECTION = "ADDCOLLECTION";

	var URL_TO_SLIDE_TITLE_PATTERN = /\/?(\w+)\.\w{2,5}$/;
	
	SlideshowDesigner = function(imageCollection, viewer, slidesContainerId, galleryContainerId, localFilesDropContainerId, titleInputId) {
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
	    
		this._model = slideshowModel;
		this._imageCollection = imageCollection;
		this._viewer = viewer;
		this._slidesContainer = U.$(slidesContainerId);
		this._galleryContainer = U.$(galleryContainerId);
		this._localFilesDropContainer = U.$(localFilesDropContainerId);
		this._titleInputId = U.$(titleInputId);
	};

	SlideshowDesigner.prototype.init = function() {
		this._initGallery();
		this._initSlides();
		this._initLocalFilesDropArea();
		this._initTitleField();
	};
	
    SlideshowDesigner.prototype._onGalleryHeaderClick = function (event) {
        var prevId = this.parentNode.dataset.expandedcollectionid;
        var thisId = this.dataset.collectionid;
        if (prevId && prevId > 0) {
            U.$("gallery-collection-" + prevId).classList.add("collapsed");
            U.$("collection-header-" + prevId).classList.add("collapsed");
            this.parentNode.dataset.expandedcollectionid = 0;
        }
        if (thisId != prevId) {
            U.$("gallery-collection-" + thisId).classList.remove("collapsed");
            U.$("collection-header-" + thisId).classList.remove("collapsed");
            this.parentNode.dataset.expandedcollectionid = this.dataset.collectionid;
        }
    };
    
	SlideshowDesigner.prototype._initGallery = function() {
		var data = this._imageCollection.getList();
		var insertBeforeRef = this._galleryContainer.nextSibling;
		var collections = {};
		for(var i = 0; i < data.length; i++) {
		    
            var parts = data[i].url.split("/");
            var collection = (parts.length > 2 ? parts[1] : "misc");
            if (!collections[collection]) {
                var collectionId = this._galleryContainer.parentNode.children.length;
                var colEl = U.createElement("div", null, "id", "gallery-collection-" + collectionId);
                colEl.classList.add("slides");
                colEl.classList.add("accordion-panel-content");
                colEl.classList.add("collapsed");
                collections[collection] = colEl;
                
                var header = U.createElement("div", "<a>" + collection + "</a>", "id", "collection-header-" + collectionId);
                header.classList.add("collapsed");
                header.classList.add("accordion-panel-header");
                header.onclick = this._onGalleryHeaderClick;
                header.dataset.collectionid = collectionId;
                header.dataset.baseurl = parts[0] + "/" + parts[1];
                /*
                 * HTML5: Drag and drop
                 */
                header.draggable = true;
                header.ondragstart = this._onGalleryCollectionHeaderDragStart;
                
                this._galleryContainer.parentNode.insertBefore(header, insertBeforeRef);
                this._galleryContainer.parentNode.insertBefore(colEl, insertBeforeRef);
            }
		    
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
			
			collections[collection].appendChild(imageContainer);
			//this._galleryContainer.appendChild(imageContainer);
		}
		
//		for (var i in collections) {
//		    this._galleryContainer.parentNode.insertBefore(collections[i], this._galleryContainer);
//		}
	};
	SlideshowDesigner.prototype._initSlides = function() {
		this._slidesContainer.appendChild(this._initSlides_createSlideSeparator("<span><strong>Dra bilder från galleriet</strong> till sådana här ljusblå platshållare.</span>"));
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

	SlideshowDesigner.prototype._initSlides_createSlideSeparator = function(text) {
		var sep = U.createElement("div", text);
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
                case DND_TYPE_ADDCOLLECTION:
                    if (confirm("Vill du verkligen lägga in alla mappens bilder i ditt bildspel?")) {
                        var imageBaseUrl = rawData[1];
                        var col = that._imageCollection.getList();
                        for (var i=0; i < col.length; i++) {
                            if (col[i].url.substr(0, imageBaseUrl.length) == imageBaseUrl) {
                                that.addSlide(col[i].url, col[i].thumbnailUrl, dropPos++);
                            }
                        }
                    }
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
	
	SlideshowDesigner.prototype._initTitleField = function() {
        this._titleInputId.value = this._model.title ? this._model.title : "";
        var that = this;
        this._titleInputId.onchange = function () {
	        if (this.validity.valid) {
	            that._model.title = this.value;
	            that.save();
	        } else {
	            alert("Tyvärr får du inte kalla ditt bildspel för '" + this.value + "' eftersom namnet bara får innehålla bokstäver.")
	            this.value = that._model.title;
	        }
	    };
	};
	
	SlideshowDesigner.prototype.save = function() {
        /*
         * HTML5: Web Storage
         */
        localStorage["slideshow-webapp-model"] = JSON.stringify(this._model);
	};

	SlideshowDesigner.prototype._onGalleryImageDragStart = function(e) {
		/*
		 * HTML5: Drag and drop (datatransfer object)
		 */
		e.dataTransfer.setData(DND_TRANSFERDATA_TEXTPLAIN, DND_TYPE_ADD + "|" + this.dataset.url + "|" + this.dataset.thumbnailUrl);
	};
	
	SlideshowDesigner.prototype._onGalleryCollectionHeaderDragStart = function(e) {
	    /*
	     * HTML5: Drag and drop (datatransfer object)
	     */
	    e.dataTransfer.setData(DND_TRANSFERDATA_TEXTPLAIN, DND_TYPE_ADDCOLLECTION + "|" + this.dataset.baseurl);
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
		this.save();
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
			this.save();
		}
		if(this._slidesContainer) {
			var slideEl = this._slidesContainer.children[slideIndex * 2 + 1];
			U.removeElement(slideEl.nextSibling);
			U.removeElement(slideEl);
		}
	};
	SlideshowDesigner.prototype.moveSlide = function(currentSlideIndex, newSlideIndex) {
//	    if (newSlideIndex > currentSlideIndex) {
//	        newSlideIndex--;
//	    }
		if (currentSlideIndex != newSlideIndex && this._model.slides) {
			var slide = this._model.slides.splice(currentSlideIndex, 1)[0];
			this._model.slides.splice(newSlideIndex, 0, slide);
			this.save();

			if(this._slidesContainer) {
				var slideEl = this._slidesContainer.children[currentSlideIndex * 2 + 1];
				var sepEl = this._slidesContainer.children[currentSlideIndex * 2 + 2];
				var refEl = this._slidesContainer.children[newSlideIndex * 2].nextSibling;
				this._slidesContainer.insertBefore(slideEl, refEl);
				this._slidesContainer.insertBefore(sepEl, refEl);
			}
			
		}
	};
	SlideshowDesigner.prototype.getModel = function() {
		return this._model;
	};
})(new Utils());
