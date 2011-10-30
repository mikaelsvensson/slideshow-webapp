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
	
	SlideshowViewer = function(slideImageId,  prevButtonId, nextButtonId, annotationButtonsContainerId, closeButtonId, commentsListId) {
		this._slideImage = U.$(slideImageId)
		this._prevButton = U.$(prevButtonId);
		this._nextButton = U.$(nextButtonId);
		this._annotationButtonsContainer = U.$(annotationButtonsContainerId);
		this._closeButton = U.$(closeButtonId);
		this._commentsList = U.$(commentsListId);
		this._canvasTools = null;
		
		this._currentSlideContainer = U.$("viewer-slide-container");
	};

	SlideshowViewer.prototype.setSlideshow = function(slideshowModel) {
		this._initSlide();
		this._initSlideButtons();
		this._initNavigationButtons();
	};
	
	SlideshowViewer.prototype.setSlide = function (slideIndex, slide) {
		this._model.slides[slideIndex] = slide;
		if (this._currentSlideIndex == slideIndex) {
			this.reloadAnnotations();
		}		
	};
	
	SlideshowViewer.prototype.init = function() {
		this._initSlide();
		this._initSlideButtons();
		this._initNavigationButtons();
	};

	SlideshowViewer.prototype._onCloseButtonClick = function(e) {
		this.end();
	};
	SlideshowViewer.prototype._onNextButtonClick = function(e) {
		if (this._isController) {
			this.gotoNextSlide();
		}
	};
	SlideshowViewer.prototype._onPrevButtonClick = function(e) {
		if (this._isController) {
			this.gotoPreviousSlide();
		}
	};

	SlideshowViewer.prototype.end = function(silent) {
		/*
		 * HTML5: CSS class list API
		 */
		document.body.classList.remove("mode-viewer");
		document.body.classList.add("mode-designer");
		
		if (this._isController) {
			document.body.classList.remove("mode-viewer-controller");
			if (!silent) {
				socket.emit("slideshow-end");
			}
		} else {
			if (!silent) {
				socket.emit("slideshow-leave", this._presenterId);
			}
		}
	};
	SlideshowViewer.prototype.start = function(slideshowModel, initialSlideIndex, presenterId /*isController*/) {
		/*
		 * HTML5: CSS class list API
		 */
		document.body.classList.add("mode-viewer");
		document.body.classList.remove("mode-designer");
		
		this._currentSlideIndex = -1;
		this._model = slideshowModel;
		this._presenterId = presenterId;
		this._isController = !(presenterId > 0);
		if (this._isController) {
			document.body.classList.add("mode-viewer-controller");
			socket.emit("slideshow-start", this._model, initialSlideIndex);
		}
		
		if (initialSlideIndex >= 0) {
			this.gotoSlide(initialSlideIndex);
		};
	};
	SlideshowViewer.prototype.gotoSlide = function(slideIndex) {
		if (slideIndex >= 0 && slideIndex < this._model.slides.length)
		{
			this._currentSlideIndex = slideIndex;
			
			if (this._isController) {
				socket.emit("slideshow-gotoslide", this._currentSlideIndex);
			}
			
			var slideData = this._model.slides[this._currentSlideIndex];
			
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
			var img = new Image();
			img.onload = function (e) {
				
				var audioEl = U.$("viewer-slidechangeaudio");
				audioEl.currentTime = 0;
				audioEl.play();
				
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
				var annotationContainer = U.createElement("div");
				slideContainer.appendChild(annotationContainer); /* generic annotation container */
				
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
				
				that._loadAnnotations(annotationContainer);
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
	SlideshowViewer.prototype._onRemoveAnnotationsButtonClick = function(e) {
		this.removeAnnotations();
	};
	
	SlideshowViewer.prototype.addComment = function(text) {
		this.addAnnotation({type: ANNOTATION_TYPE_COMMENT, text: text, author: "Anonymous"});
	};
	SlideshowViewer.prototype.addMosaic = function() {
		this._canvasTools.enableRegionSelection( { fn: function (region) {
			this.addAnnotation({type: ANNOTATION_TYPE_MOSAIC, text: "", author: "Anonymous", region: region});
			this._canvasTools.disableRegionSelection();
		}, scope: this } );
	};
	SlideshowViewer.prototype.addBalloon = function() {
		this._canvasTools.enableCoordSelection( { fn: function (coord) {
			var text = prompt("Din kommentar:");
			this.addAnnotation({type: ANNOTATION_TYPE_BALLOON, text: text, author: "Anonymous", coord: coord});
			this._canvasTools.disableCoordSelection();
		}, scope: this } );
	};
	SlideshowViewer.prototype.addStamp = function(text) {
		this._canvasTools.enableRegionSelection( { fn: function (region) {
			this.addAnnotation({type: ANNOTATION_TYPE_STAMP, text: "", author: "Anonymous", region: region});
			this._canvasTools.disableRegionSelection();
		}, scope: this } );
	};
	
	SlideshowViewer.prototype.addAnnotation = function(annotation) {
		if (this._isController) {
			var annotations = this._model.slides[this._currentSlideIndex].annotations;
			if (!annotations) {
				annotations = [];
				this._model.slides[this._currentSlideIndex].annotations = annotations;
			}
			annotations.push(annotation);
			
			this.reloadAnnotations();
			
			socket.emit("slide-update", this._currentSlideIndex, this._model.slides[this._currentSlideIndex]);
		} else {
			socket.emit("slideshow-addannotation-request", this._presenterId, this._currentSlideIndex, annotation);
		}
	};
	
	SlideshowViewer.prototype.removeAnnotations = function() {
		if (this._isController) {
			if (confirm("Är du säker på att du vill ta bort alla kommentarer från bilden?")) {
				this._model.slides[this._currentSlideIndex].annotations = [];
				
				this.reloadAnnotations();
				
				socket.emit("slide-update", this._currentSlideIndex, this._model.slides[this._currentSlideIndex]);
			}
		} else {
			alert("Tyvärr kan bara presentatören ta bort kommentarer. Ledsen.");
		}
	};
	
	SlideshowViewer.prototype._loadCommentAnnotation = function(annotation) {
		this._commentsList.appendChild(U.createElement("li", annotation.text));
	};
	
	SlideshowViewer.prototype._loadMosaicAnnotation = function(annotation) {
		this._canvasTools.applyMosaicFilter(annotation.region);
	};
	
	SlideshowViewer.prototype._loadBalloonAnnotation = function(annotation, container) {
		var balloon = U.createElement("blockquote");
		balloon.style.left = annotation.coord.x + "px";
		balloon.style.top = annotation.coord.y + "px";
		var balloonText = U.createElement("span", annotation.text);
		balloon.appendChild(balloonText);
		container.appendChild(balloon);
	};
	
	SlideshowViewer.prototype._loadStampAnnotation = function(annotation, container) {
		this._addSvgStar(annotation.region, container);
	};
	
	SlideshowViewer.prototype._addSvgCircle = function(region, container) {
		var x = region.x + (region.width / 2);
		var y = region.y + (region.height / 2);
		var r = Math.min(region.height, region.width) / 2;
		var SVG_NS = "http://www.w3.org/2000/svg";
		
		/*
		 * SVG
		 */
		var el = U.createElementNS(SVG_NS, "svg", 
				"version", "1.1");
		var defs = U.createElementNS(SVG_NS, "defs"); 
		var radGrad = U.createElementNS(SVG_NS, "radialGradient", "id", "bg", "cx", "50%", "cy", "50%", "fx", "50%", "fy", "50%");
		var colorStop1 = U.createElementNS(SVG_NS, "stop", "offset", "60%", "style", "stop-color: rgba(253, 208, 23, 0.0)");
		var colorStop2 = U.createElementNS(SVG_NS, "stop", "offset", "100%", "style", "stop-color: rgba(253, 208, 23, 0.5)");
		U.appendChildren(radGrad, colorStop1, colorStop2);
		defs.appendChild(radGrad);
		var circle = U.createElementNS(SVG_NS, "circle", 
				"cx", x, 
				"cy", y, 
				"r", r, 
				"style", "fill: url(#bg); stroke-width: 0.1em; stroke: rgba(253, 208, 23, 1.0)");
		U.appendChildren(el, defs, circle);
		container.appendChild(el);
	};
	
	SlideshowViewer.prototype._addSvgStar = function(region, container) {
		var SVG_NS = "http://www.w3.org/2000/svg";
		var STAR_POINT_COUNT = 9;
		
		var coords = [];
		
		var origoX = region.x + (region.width / 2);
		var origoY = region.y + (region.height / 2);
		var radiusOuter = Math.min(region.width, region.height) / 2;
		var radiusInner = radiusOuter * 0.7;
		var offsetRad = 2 * Math.PI / STAR_POINT_COUNT;
		var angle = -Math.PI / 2;
		
		for (var i = 0; i <= STAR_POINT_COUNT * 2; i++) {
			var radius = (i % 2 == 0 ? radiusOuter : radiusInner);
			var x = origoX + Math.cos(angle) * radius;
			var y = origoY + Math.sin(angle) * radius;
			coords.push(x + "," + y);
			angle += (offsetRad / 2);
		}
		
		/*
		 * SVG
		 */
		var el = U.createElementNS(SVG_NS, "svg", 
				"version", "1.1");
		var circle = U.createElementNS(SVG_NS, "polygon", 
				"points", coords.join(" "), 
				"style", "fill: none; stroke-width: 1em; stroke: rgba(253, 208, 23, 0.7)");
		el.appendChild(circle);
		container.appendChild(el);
	};
	
	SlideshowViewer.prototype._loadAnnotation = function(annotation, container) {
		if (annotation.type == ANNOTATION_TYPE_COMMENT) {
			this._loadCommentAnnotation(annotation);
			
		} else if (annotation.type == ANNOTATION_TYPE_BALLOON) {
			this._loadBalloonAnnotation(annotation, container);
			
		} else if (annotation.type == ANNOTATION_TYPE_MOSAIC) {
			this._loadMosaicAnnotation(annotation);
			
		} else if (annotation.type == ANNOTATION_TYPE_STAMP) {
			this._loadStampAnnotation(annotation, container);
		}
	};
	
	SlideshowViewer.prototype.reloadAnnotations = function() {
		var container = this._currentSlideContainer.children[0].children[0].children[2];
		this._clearAnnotations(container);
		this._loadAnnotations(container);
	};
	
	SlideshowViewer.prototype._clearAnnotations = function(container) {
		var childCount = container.children.length;
		while (childCount-- > 0) {
			container.children[0].parentNode.removeChild(container.children[0]);
		}
		this._canvasTools.clear();
	};
	
	SlideshowViewer.prototype._loadAnnotations = function(container) {
		var annotations = this._model.slides[this._currentSlideIndex].annotations;
		
		if (annotations && annotations.length > 0) {
			for (var i=0; i < annotations.length; i++) {
				this._loadAnnotation(annotations[i], container);
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
		var addMosaicLink = this._createAnnotationButton("Censurera", false, "Censurera del av bild: Klicka här och markera sedan området i bilden.", function(e) {
			that._onAddMosaicButtonClick(e);
		});
		var addBalloonLink = this._createAnnotationButton("Pratbubbla", false, "Lägga till pratbubbla: Klicka här och sedan på önskad plats i bilden.", function(e) {
			that._onAddBalloonButtonClick(e);
		});
		var addStampLink = this._createAnnotationButton("Stjärna", false, "Lägg till guldstjärna: Klicka här och markera sedan området som stjärnan ska ritas inom.", function(e) {
			that._onAddStampButtonClick(e);
		});
		var removeAnnotationsLink = this._createAnnotationButton("Ta bort", true, "Ta bort alla censueringar, pratbubblor och stjärnor i aktuell bild.", function(e) {
			that._onRemoveAnnotationsButtonClick(e);
		});
		
		U.appendChildren(this._annotationButtonsContainer, /*addCommentLink,*/ addBalloonLink, addMosaicLink, addStampLink, removeAnnotationsLink);
	};

	SlideshowViewer.prototype._createAnnotationButton = function(text, isDimmed, helpText, clickHandler) {
		var linkEl = U.createElement("a", "", "href", "#");
		var textEl = U.createElement("span", text);
		var helpTextEl = U.createElement("span", helpText);
		var helpTextWrapperEl = U.createElement("span");
		helpTextWrapperEl.appendChild(helpTextEl)
		textEl.appendChild(helpTextWrapperEl);
		linkEl.appendChild(textEl);
		linkEl.onclick = clickHandler;
		if (isDimmed) {
			linkEl.classList.add("dimmed");
		}
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
