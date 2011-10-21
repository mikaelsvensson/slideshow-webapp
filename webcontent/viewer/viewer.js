/**
 * @author Mikael
 */

(function(U) {

	var DND_TRANSFERDATA_TEXTPLAIN = "text/plain";
	var DND_TYPE_MOVE = "MOVE";
	var DND_TYPE_ADD = "ADD";

	var URL_TO_SLIDE_TITLE_PATTERN = /\/?(\w+)\.\w{2,5}$/;
	SlideshowViewer = function(slideshowModel, imageCollection, slideImageId,  prevButtonId, nextButtonId, annotationButtonsContainerId, closeButtonId, commentsListId) {
		this._currentSlideIndex = -1;
		this._model = slideshowModel;
		this._imageCollection = imageCollection;
		this._slideImage = U.$(slideImageId)
		this._prevButton = U.$(prevButtonId);
		this._nextButton = U.$(nextButtonId);
		this._annotationButtonsContainer = U.$(annotationButtonsContainerId);
		this._closeButton = U.$(closeButtonId);
		this._commentsList = U.$(commentsListId);
		this._canvasTools = null;
		
		this._currentSlideContainer = U.$("viewer-slide-container");
	};

	SlideshowViewer.prototype.init = function() {
		this._initSlide();
		this._initSlideButtons();
		this._initNavigationButtons();
	};

	SlideshowViewer.prototype._onCloseButtonClick = function(e) {
		this.hide();
	};
	SlideshowViewer.prototype._onNextButtonClick = function(e) {
		this.gotoNextSlide();
	};
	SlideshowViewer.prototype._onPrevButtonClick = function(e) {
		this.gotoPreviousSlide();
	};

	SlideshowViewer.prototype.hide = function() {
		/*
		 * HTML5: CSS class list API
		 */
		document.body.classList.remove("mode-viewer");
		document.body.classList.add("mode-designer");
	};
	SlideshowViewer.prototype.show = function(initialSlideIndex) {
		/*
		 * HTML5: CSS class list API
		 */
		document.body.classList.add("mode-viewer");
		document.body.classList.remove("mode-designer");
		
		if(initialSlideIndex >= 0) {
			this.gotoSlide(initialSlideIndex);
		};
	};
	SlideshowViewer.prototype.gotoSlide = function(slideIndex) {
		if (slideIndex >= 0 && slideIndex < this._model.slides.length)
		{
			this._currentSlideIndex = slideIndex;
			
			var slideData = this._model.slides[this._currentSlideIndex];
			var imageData = this._imageCollection.get(slideData.url);
			
			if (this._currentSlideContainer.children.length > 0) {
				var prevSlideContainer = this._currentSlideContainer.children[0];
				prevSlideContainer.classList.remove("visible");
				setTimeout(function () {
					U.removeElement(prevSlideContainer);
				}, 1000);
			}
			
			var that = this;
			var img = new Image(imageData.width, imageData.height);
			img.onload = function (e) {
				
				var div = U.createElement("figure");
				var slideContainer = U.createElement("div");
				slideContainer.classList.add("transition-wrapper");
				div.appendChild(slideContainer);
				
				this.onload = null;
				slideContainer.appendChild(this);
				
				var canvasTools = new CanvasTools(this);
				slideContainer.onmousedown = function(e) {
					canvasTools.onMouseDown(e);
				};
				slideContainer.onmousemove = function(e) {
					canvasTools.onMouseOver(e);
				};
				slideContainer.onmouseup = function (e) {
					canvasTools.onMouseUp(e);
				};
				
				var w = U.$("boink").offsetWidth - 16 /* scrollbar width */;
				var h = U.$("boink").offsetHeight;
				
				div.style.marginLeft = -(imageData.width/2) + "px";
				that._currentSlideContainer.style.width = w + "px";
				that._currentSlideContainer.style.height = h + "px";
				that._canvasTools = canvasTools;
				
				that._currentSlideContainer.insertBefore(div, that._currentSlideContainer.firstChild);
				
				that._loadAnnotations();
				setTimeout(function () {
					div.classList.add("visible");
					slideContainer.appendChild(U.createElement("figcaption", slideData.title));
				}, 100);
			};
			img.src = slideData.url;
		}
	};

	SlideshowViewer.prototype.gotoNextSlide = function() {
		this.gotoSlide(this._currentSlideIndex + 1);
	};
	SlideshowViewer.prototype.gotoPreviousSlide = function() {
		this.gotoSlide(this._currentSlideIndex - 1);
	};
	
	SlideshowViewer.prototype._onAddCommentButtonClick = function(e) {
		var text = prompt("Din kommentar:");
		this.addComment(text);
	};
	SlideshowViewer.prototype._onAddMosaicButtonClick = function(e) {
		this.addMosaic();
	};
	SlideshowViewer.prototype._onAddBalloonButtonClick = function(e) {
		this.addBalloon();
	};
	SlideshowViewer.prototype._onAddStampButtonClick = function(e) {
		this.addStamp();
	};
	
	SlideshowViewer.prototype.addComment = function(text) {
		this._addAnnotation(new CommentAnnotation(text, "Anonymous"));
	};
	SlideshowViewer.prototype.addMosaic = function() {
		this._canvasTools.enableRegionSelection( { fn: function (region) {
			this._addAnnotation(new MosaicAnnotation("", "Anonymous", region));
			this._canvasTools.disableRegionSelection();
		}, scope: this } );
	};
	SlideshowViewer.prototype.addBalloon = function() {
		this._canvasTools.enableCoordSelection( { fn: function (coord) {
			var text = prompt("Din kommentar:");
			this._addAnnotation(new BalloonAnnotation(text, "Anonymous", coord));
			this._canvasTools.disableCoordSelection();
		}, scope: this } );
	};
	SlideshowViewer.prototype.addStamp = function(text) {
		this._canvasTools.enableRegionSelection( { fn: function (region) {
			this._addAnnotation(new StampAnnotation("", "Anonymous", region));
			this._canvasTools.disableRegionSelection();
		}, scope: this } );
	};
	
	SlideshowViewer.prototype._addAnnotation = function(annotation) {
		var annotations = this._model.slides[this._currentSlideIndex].annotations;
		if (!annotations) {
			annotations = [];
			this._model.slides[this._currentSlideIndex].annotations = annotations;
		}
		annotations.push(annotation);
		this._loadAnnotations();
	};
	
	SlideshowViewer.prototype._loadCommentAnnotation = function(annotation) {
		this._commentsList.appendChild(U.createElement("li", annotation.text));
	};
	
	SlideshowViewer.prototype._loadMosaicAnnotation = function(annotation) {
		this._canvasTools.applyMosaicFilter(annotation.region);
	};
	
	SlideshowViewer.prototype._loadBalloonAnnotation = function(annotation) {
		var balloon = U.createElement("blockquote");
		balloon.style.left = annotation.coord.x + "px";
		balloon.style.top = annotation.coord.y + "px";
		var balloonText = U.createElement("span", annotation.text);
		balloon.appendChild(balloonText);
		this._currentSlideContainer.children[0].childNodes[0].appendChild(balloon);
	};
	
	SlideshowViewer.prototype._loadStampAnnotation = function(annotation) {
		this._canvasTools.addSvgCircle(annotation.region);
	};
	
	SlideshowViewer.prototype._loadAnnotation = function(annotation) {
		if (annotation instanceof CommentAnnotation) {
			this._loadCommentAnnotation(annotation);
		} else if (annotation instanceof BalloonAnnotation) {
			this._loadBalloonAnnotation(annotation);
		} else if (annotation instanceof MosaicAnnotation) {
			this._loadMosaicAnnotation(annotation);
		} else if (annotation instanceof StampAnnotation) {
			this._loadStampAnnotation(annotation);
		}
	};
	
	SlideshowViewer.prototype._loadAnnotations = function(annotation) {
		var annotations = this._model.slides[this._currentSlideIndex].annotations;
		
		//this._commentsList.innerHTML = "";
		
		if (annotations && annotations.length > 0) {
			for (var i=0; i < annotations.length; i++) {
				this._loadAnnotation(annotations[i]);
			}
		}
	};
	
	SlideshowViewer.prototype._initSlide = function() {
	};

	SlideshowViewer.prototype._initSlideButtons = function() {
		
		var that = this; 
		
		/*var addCommentLink = U.createElement("a", "Kommentera");
		addCommentLink.onclick = function(e) {
			that._onAddCommentButtonClick(e);
		};*/
		var addMosaicLink = U.createElement("a", "Censurera", "href", "#");
		addMosaicLink.onclick = function(e) {
			that._onAddMosaicButtonClick(e);
		};
		var addBalloonLink = U.createElement("a", "Pratbubbla", "href", "#");
		addBalloonLink.onclick = function(e) {
			that._onAddBalloonButtonClick(e);
		};
		var addStampLink = U.createElement("a", "Stämpla", "href", "#");
		addStampLink.onclick = function(e) {
			that._onAddStampButtonClick(e);
		};
		
		U.appendChildren(this._annotationButtonsContainer, /*addCommentLink,*/ addBalloonLink, addMosaicLink, addStampLink);
	};

	SlideshowViewer.prototype._initNavigationButtons = function() {
		var that = this;
		this._closeButton.onclick = function(e) {
			that._onCloseButtonClick(e);
		};
		this._prevButton.onclick = function(e) {
			that._onPrevButtonClick(e);
		};
		this._nextButton.onclick = function(e) {
			that._onNextButtonClick(e);
		};
	};

	SlideshowViewer.prototype.getModel = function() {
		return this._model;
	};
})(new Utils());
