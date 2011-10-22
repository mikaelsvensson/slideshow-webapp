/**
 * @author Mikael
 */

(function(U) {

	var DND_TRANSFERDATA_TEXTPLAIN = "text/plain";
	var DND_TYPE_MOVE = "MOVE";
	var DND_TYPE_ADD = "ADD";
	
	var ANNOTATION_TYPE_COMMENT = "comment";
	var ANNOTATION_TYPE_BALLOON = "balloon";
	var ANNOTATION_TYPE_MOSAIC = "mosaic";
	var ANNOTATION_TYPE_STAMP = "stamp";

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
				/*
				 * HTML5: CSS class list API
				 */
				prevSlideContainer.classList.remove("visible");
				setTimeout(function () {
					U.removeElement(prevSlideContainer);
				}, 1000);
			}
			
			var that = this;
			var img = new Image(/*imageData.width, imageData.height*/);
			img.onload = function (e) {
				
				var slideContainer = U.createElement("div");
				/*
				 * HTML5: Markup
				 */
				var div = U.createElement("figure");
				/*
				 * HTML5: CSS class list API
				 */
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
				
				div.style.marginLeft = -(this.width/*imageData.width*//2) + "px";
				that._currentSlideContainer.style.width = w + "px";
				that._currentSlideContainer.style.height = h + "px";
				that._canvasTools = canvasTools;
				
				that._currentSlideContainer.insertBefore(div, that._currentSlideContainer.firstChild);
				
				that._loadAnnotations();
				setTimeout(function () {
					/*
					 * HTML5: CSS class list API
					 */
					div.classList.add("visible");
					/*
					 * HTML5: Markup
					 */
					var caption = U.createElement("figcaption", slideData.title);
					/*
					 * HTML5: CSS class list API
					 */
					caption.classList.add("message");
					
					slideContainer.appendChild(caption);
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
		this._addAnnotation({type: ANNOTATION_TYPE_COMMENT, text: text, author: "Anonymous"});
	};
	SlideshowViewer.prototype.addMosaic = function() {
		this._canvasTools.enableRegionSelection( { fn: function (region) {
			this._addAnnotation({type: ANNOTATION_TYPE_MOSAIC, text: "", author: "Anonymous", region: region});
			this._canvasTools.disableRegionSelection();
		}, scope: this } );
	};
	SlideshowViewer.prototype.addBalloon = function() {
		this._canvasTools.enableCoordSelection( { fn: function (coord) {
			var text = prompt("Din kommentar:");
			this._addAnnotation({type: ANNOTATION_TYPE_BALLOON, text: text, author: "Anonymous", coord: coord});
			this._canvasTools.disableCoordSelection();
		}, scope: this } );
	};
	SlideshowViewer.prototype.addStamp = function(text) {
		this._canvasTools.enableRegionSelection( { fn: function (region) {
			this._addAnnotation({type: ANNOTATION_TYPE_STAMP, text: "", author: "Anonymous", region: region});
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
		if (annotation.type == ANNOTATION_TYPE_COMMENT) {
			this._loadCommentAnnotation(annotation);
			
		} else if (annotation.type == ANNOTATION_TYPE_BALLOON) {
			this._loadBalloonAnnotation(annotation);
			
		} else if (annotation.type == ANNOTATION_TYPE_MOSAIC) {
			this._loadMosaicAnnotation(annotation);
			
		} else if (annotation.type == ANNOTATION_TYPE_STAMP) {
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
		var addMosaicLink = this._createAnnotationButton("Censurera", "Censurera del av bild: Klicka först här och markera sedan området i bilden.", function(e) {
			that._onAddMosaicButtonClick(e);
		});
		var addBalloonLink = this._createAnnotationButton("Pratbubbla", "Lägga till pratbubbla: Klicka först här och sedan på önskad plats i bilden.", function(e) {
			that._onAddBalloonButtonClick(e);
		});
		var addStampLink = this._createAnnotationButton("Gloria", "Lägga till gul gloria: Klicka först här och markera sedan området i bilden som glorian ska läggas på.", function(e) {
			that._onAddStampButtonClick(e);
		});
		
		U.appendChildren(this._annotationButtonsContainer, /*addCommentLink,*/ addBalloonLink, addMosaicLink, addStampLink);
	};

	SlideshowViewer.prototype._createAnnotationButton = function(text, helpText, clickHandler) {
		var linkEl = U.createElement("a", "", "href", "#");
		var textEl = U.createElement("span", text);
		var helpTextEl = U.createElement("span", helpText);
		var helpTextWrapperEl = U.createElement("span");
		helpTextWrapperEl.appendChild(helpTextEl)
		textEl.appendChild(helpTextWrapperEl);
		linkEl.appendChild(textEl);
		linkEl.onclick = clickHandler;
		return linkEl;
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
