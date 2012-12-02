/*
 *
 * Zoomy v1.0 - for jQuery 1.7.1+
 *
 * Copyright 2012, James Louis Thompson
 * http://codecanyon.net/user/jameslouiz
 *
 * You need to buy a license to use this script.
 * http://codecanyon.net/wiki/buying/howto-buying/licensing/
 *
 * Date: 20/06/2012
 *
 */
(function ($) {

    //used to fix method calling issues on un-instantiated objects
    $.bind = function (object, method) {
        var args = Array.prototype.slice.call(arguments, 2);
        return function () {
            var args2 = [this].concat(args, $.makeArray(arguments));
            return method.apply(object, args2);
        };
    };


    var zoomy = function () {};

    zoomy.prototype = {
        /**
         * Initializes zoomify
         *
         * @param string e The element to turn into a zoomy
         * @param obj config An object containing the configuration options for this instance of zoomify
         *
         */
        init: function (e, config) {
            this.e = $(e);

            var zoomy = this, //reference to object
            

                //default configuration
                defaults = {
                    popoverClassName: 'popover',
                    popoverHeight: $(e).find('img').height() * 1.5,
                    popoverWidth: $(e).find('img').width() * 1.5,
                    popoverPosition: 'right',
                    popoverOffsetX: 30,
                    popoverOffsetY: 0,
                    lensHeight: $(e).find('img').height() / 1.5,
                    lensWidth: $(e).find('img').width() / 1.5,
                    magnify: 1,
                    triggerEvent: 'hover',
                    innerZoom: false,
                    preload: true,
                    showPreloader: true,
                    duration: 200
                };

            this.dataOptions = this.e.data();

            if (typeof this.dataOptions == 'object' && !$.isEmptyObject(this.dataOptions)) {
                this.settings = $.extend(true, defaults, this.dataOptions);
            } else {
                this.settings = $.extend(true, defaults, config);
            }

            //Setup Vars 
            this.body = $('html body');
            this.popoverHtml = '<div class=' + this.settings.popoverClassName + '><img class=' + this.settings.popoverClassName + '_image' + ' src="" /></div>';
            this.sandboxHtml = '<div class=' + this.settings.popoverClassName + '_sandbox' + '></div>';
            this.lensHtml = '<div class="lens"></div>';
            this.preloaderHtml = '<div class="preloader"></div>';
            this.thumb = this.e.find('img');
            this.id = Math.floor(Math.random() * 999999999);
            this.zoomedImageSource = this.e.data('zoomed-image');
            this.useSelf = !this.zoomedImageSource ? true : false;
            this.loaded = false;//this.thumb.data('loaded');

            // Dimensioanl Vars
            this.popoverWidth = this.settings.popoverWidth;// || this.popoverHeight;
            this.popoverHeight = this.settings.popoverHeight;// || this.popoverWidth;
            this.lensWidth = this.settings.lensWidth;
            this.lensHeight = this.settings.lensHeight;

            //Inject Elements
            this.inject();

            //Setup vars of newly injected elements
            this.lens = this.e.find('.lens');
            this.popover = $('.' + this.settings.popoverClassName);
            this.sandbox = $('.' + this.settings.popoverClassName + '_sandbox');
            this.preloader = this.e.find('.preloader');

            //Add CSS to the elements
            this.popover.css({
                overflow: 'hidden',
                display: 'none',
                position: 'absolute',
                'z-index': 9999,
                padding: 0
            });

            this.e.css({
                position: 'relative',
                cursor: 'crosshair'
            });

            this.lens.css({
                height: 0,
                width: 0,
                position: 'absolute',
                top: -10000,
                left: -10000,
                overflow: 'hidden',
                'z-index': 9999,
                display: 'block'
            });

            this.lens.find('img').css({
                position: 'relative'
            });          

            this.sandbox.css({
                height: 1,
                width: 1,
                position: 'absolute',
                top: -5000,
                left: -5000,
                display: 'block',
                overflow: 'hidden'
            });

            this.sandbox.find('img').css({
                position: 'absolute',
                top: 0,
                left: 0
            });

            this.preloader.css({
                top: '50%',
                left: '50%',
                'margin-left': -(this.preloader.outerWidth() / 2),
                'margin-top': -(this.preloader.outerHeight() / 2),
                display: 'none',
                padding: 0,
                position: 'absolute'
            });
        

            //Makes the zoomed image source unique incase you want multipul instances of the same
            //image on the page but with different zoom levels or other options specified.
            this.thumb.attr({
                src: this.thumb.attr('src') + '?' + this.id
            });

            this.e.attr({
                'data-zoomed-image': this.e.attr('data-zoomed-image') + '?' + this.id
            });

            if (this.useSelf) {
                this.e.attr({'data-zoomed-image': this.thumb.attr('src')});
            }

            this.zoomedImageSource = this.e.attr('data-zoomed-image');

            if (this.thumb.attr('data-status') !== 'error') {
                if (this.settings.preload) {            
                    this.loadImages();          
                } else {
                    this.eventBindings();
                }
            }
        },
        // Inject Elements
        inject: function () 
        {
            this.e.append(this.lensHtml);
            this.e.append(this.preloaderHtml);
            //inject Popover only once
            if ($("." + this.settings.popoverClassName).length < 1) {
                this.body.append(this.popoverHtml); //change container back to this.body
            }
            // inject sandbox only once
            if ($('.' + this.settings.popoverClassName + '_sandbox').length < 1) {
                this.body.append(this.sandboxHtml); //change container back to this.body
            }
        },
        /**
         *
         *  loadImages - loads the zoomed images and appends to sandbox
         *
         */
        loadImages: function () 
        {
            var self = this,
                element = this.e,
                thumb = this.thumb,
                showPreloader = this.settings.showPreloader,
                preloader = this.preloader,
                zoomedImageSource = this.zoomedImageSource,
                loaded = this.thumb.data('loaded'),
                sandboxZoomedImageSource = this.sandbox.find('img').attr('src'),
                img = new Image();

            
            if (!loaded && zoomedImageSource) {

                if (this.settings.showPreloader) {
                    preloader.fadeIn(200);
                }


                    $(img).load(function () {
                        var thisImg = $(this),
                            platform;                   

                        self.injectImages(thisImg);         

                    }).attr({
                        src: zoomedImageSource
                    }).error(function () {
                        thumb.data('loaded', 'failed');
                        // Callbacks for when elements shown
                        self.callHook('loadFail');
                    });

            } else {
                this.grabData();
            }

        },
        /**
         *
         * FetchImage - Gets the image from the sandbox and puts it in the popover
         *
         */
        grabData: function() 
        {

            var zoomedImageSource = this.zoomedImageSource,
                zoomedImage = this.sandbox.find('img[src="'+zoomedImageSource+'"]'),
                el, source;
            

            this.lens.hide();

            if (this.useSelf) {
                source = this.thumb.attr('src');
                el = this.sandbox.find('img[src="'+source+'"]');    
            } else {
                el = zoomedImage;
                source = zoomedImageSource; 
            }
            
            if (this.settings.innerZoom) { // appends the large image to lens if the option is true
                if (this.lens.find('img').length < 1) {
                    this.lens.append(el.clone()); 
                }
            } else { // else append to popover
                if (zoomedImageSource !== this.popover.find('img').attr('src')) {
                    this.popover.html(el.clone());
                }
            }

              
            //this.lensSize(this.sandbox.find('img[src="'+source+'"]')); //set size of lens for this thumb

            this.showElems();

        },
        /**
         *
         * Event Bindings - Bind all the mouse vents to elements
         *
         */
        eventBindings: function () 
        {
            var self = this,
                elem = this.e,
                popover = this.popover,
                lens = this.lens,
                preloadOnInit = this.settings.preload,
                trigger;

            switch (this.settings.triggerEvent) {
                case 'click':
                    trigger = 'click';
                break;

                default:
                    trigger = 'mouseenter';
                break;
            }

            elem.on(trigger, function () {
                
                if (preloadOnInit) {
                    self.grabData();
                } else {
                    self.loadImages();
                }


                 
                $('body').on('mousemove.zoomy', lens, function (e) {
                    self.lensPos(e);
                }); 

            });

            elem.on('mouseleave', function () {
                $('body').off('mousemove.zoomy');
                self.hideElems();
            });
        },
        /**
         *
         * injectImages - Injects imagaes to the relevant container. If not innerzoom - append to snadbox.
         *
         * @param append - DOM Object you want to append to the lens or popover
         * 
         */
        injectImages: function(append)
        {   

            var loaded = this.thumb.data('loaded'),
                platform, freshImage;

            if (this.settings.innerZoom) {
                platform = this.lens;
            } else {
                platform = this.sandbox;
            }

            if (this.zoomedImageSource != platform.find('img').attr('src')) {
                append.css({position:'absolute'});
                platform.append(append);
            }   

            this.magnify(append);

            if (this.settings.preload && !loaded) {
                this.eventBindings(); //if the zoomed image loads, bind the events to this
            } else {
                this.grabData(append);
            }

            this.preloader.fadeOut(200);            

            this.thumb.data('loaded', true);

        },
        /**
         *
         * Lens Size - Sets the size of the lens 
         * 
         * @param zoomedImage - DOM Object of the large image you need to calcaulate lens with
         *
         */
        lensSize: function (zoomedImage) {


            var popover = this.popver,
                lens = this.lens,
                thumb = this.thumb,
                popoverHeight = this.popoverHeight,
                popoverWidth = this.popoverWidth,
                thumbHeight = thumb.height(),
                thumbWidth = thumb.width(),
                lensHeight, lensWidth, lensHeight1, lensWidth1, ex, ey;


            if (this.settings.innerZoom) {
                lensHeight = this.lensHeight;
                lensWidth = this.lensWidth;
            } else {
                //lensHeight1 = (popoverHeight / (zoomedImage.height() / thumbHeight)) ;
                //lensWidth1 = (popoverWidth / (zoomedImage.width() / thumbWidth)) ;
                
                //ey = thumbHeight / lensHeight1;
                //ex = thumbWidth / lensWidth1;

                //console.log(ey);

                //lensHeight = thumbHeight / ( (zoomedImage.height()+ey) / popoverHeight); //lensHeight + (lensHeight / 100 * 3.5);
                //lensWidth = thumbWidth / ( (zoomedImage.width()+ex) / popoverWidth) ; //lensWidth + (lensWidth / 100 * 3.5);
                
                lensHeight = popoverHeight / (zoomedImage.height() / thumbHeight);
                lensWidth = popoverWidth / (zoomedImage.width() / thumbWidth);
            }  


           
            //console.log(lensHeight);

            lensDims = {
                height: lensHeight + 0,
                width: lensWidth + 0
            };

            lens.css(lensDims);
        },
        /**
         *
         * Lens Position - Sets the position of lens on mouse move
         *
         * @param e - event
         *
         */
        lensPos: function (e) 
        {
            var self = this,
                lens = this.lens,
                thumb = this.thumb,
                thumbLeft = thumb.offset().left,
                thumbTop = thumb.offset().top,
                mouseY = e.pageY,
                mouseX = e.pageX,
                lensWidth = lens.outerWidth(),
                lensHeight = lens.outerHeight(),
                lensLeft = 0,
                lensTop = 0;


            lensTop = mouseY - lensHeight / 2;
            lensLeft = mouseX - lensWidth / 2;

            
            function limitLeft() {
                return mouseX - (lensWidth) / 2 < thumbLeft;
            }

            function limitRight() {
                return mouseX + (lensWidth) / 2 > (thumbLeft + thumb.width());
            }

            function limitTop() {
                return mouseY - (lensHeight) / 2 < thumbTop;
            }

            function limitBottom() {
                return mouseY + (lensHeight) / 2 > (thumbTop + thumb.height());
            }


            if (limitLeft(lens)) {
                lensLeft = thumbLeft;
            } else if (limitRight(lens)) {
                lensLeft = thumbLeft + thumb.width() - lensWidth;
            }
            if (limitTop(lens)) {
                lensTop = thumbTop
            } else if (limitBottom(lens)) {
                lensTop = thumbTop + thumb.height() - lensHeight;
            }


            lens.offset({
                top: lensTop,
                left: lensLeft
            });

            self.zoomedPosition();

        },
        /**
         *
         * Popover Position - Sets the position of popover on mouse move
         *
         */
        popoverPos: function () 
        {   

            if (!this.settings.innerZoom){
                var self = this,
                    lens = this.lens,
                    element = this.thumb,
                    popover = this.popover;


                var popoverTop, popoverLeft;

                switch (this.settings.popoverPosition) {
                case 'right':
                    popoverTop = element.offset().top + this.settings.popoverOffsetY;
                    popoverLeft = element.offset().left + element.outerWidth() + this.settings.popoverOffsetX;
                    break;

                case 'top':
                    popoverTop = element.offset().top - this.popoverHeight - this.settings.popoverOffsetY;
                    popoverLeft = element.offset().left + this.settings.popoverOffsetX;
                    break;

                case 'bottom':
                    popoverTop = element.offset().top + element.outerHeight() + this.settings.popoverOffsetY ;
                    popoverLeft = element.offset().left + this.settings.popoverOffsetX;
                    break;

                case 'left': // defaults fixed left
                    popoverTop = element.offset().top + this.settings.popoverOffsetY;
                    popoverLeft = element.offset().left - this.popoverWidth - this.settings.popoverOffsetX;
                    break;
                }
                
                popover.show();

                popover.css({
                    height: this.popoverHeight,
                    width: this.popoverWidth
                });

                popoverPos = {
                    top: popoverTop,
                    left: popoverLeft
                };

                popover.offset(popoverPos);

                popover.hide();
            }

        },
        /**
         *
         * Sets the position of the zoomed image in the popover in relation to the lens
         *
         */
        zoomedPosition: function () 
        {

            var el = this.settings.innerZoom ? this.lens.find('img') : this.popover.find('img'),
                thumb = this.thumb,
                lens = this.lens,
                borderTop = (lens.css('border-top-width') > 0) ? parseFloat(lens.css('border-top-width')) : 0,
                borderLeft = (lens.css('border-left-width') > 0) ? parseFloat(lens.css('border-left-width')) : 0,
                lensHeight = lens.outerHeight(),
                lensWidth = lens.outerWidth(),
                thumbHeight = thumb.height(),
                thumbWidth = thumb.width(),
                largeImgHeight = el.height(),
                largeImgWidth = el.width(),
                refYY = (thumb.offset().top) - (lens.offset().top + borderTop),
                refXX = (thumb.offset().left) - (lens.offset().left + borderLeft);


            if (this.settings.innerZoom) {
                hr = (largeImgHeight - lensHeight) / (thumbHeight - lensHeight);
                wr = (largeImgWidth - lensWidth) / (thumbWidth - lensWidth);
            } else {
                hr = largeImgHeight / thumbHeight;
                wr = largeImgWidth / thumbWidth;
            }


            el.css({
                top: (refYY) * hr,//0(thumbHeight / lensHeight),
                left: (refXX) * wr  //(thumbWidth / lensWidth)
            });

        },
        /**
         *
         * maginify - Magnifies the large image
         *
         * @param img DOM Object - The image you want to magnify
         *
         */
        magnify: function(img)
        {
            var imgHeight = img.height(),
                imgWidth = img.width(),
                magnify = this.settings.magnify;


            //if (img.height != imgHeight * this.settings.magnify) {
                img.css({
                    height: imgHeight * magnify,
                    width:  imgWidth * magnify
                });
            //}

            this.lensSize(img);
        },
        /**
         *
         * showElems - Shows the popover and lens when required. Popover doesnt show if innerZoom is enabled
         *
         */
        showElems: function()
        {   
            
 
            if (!this.settings.innerZoom) {
               // if ( this.popover.is(':hidden') || (this.popover.is(':visible') && popover.is(':animated')) ) {
                this.popoverPos();
                this.popover.stop().fadeTo(this.settings.duration, 1);
               // }
            }

            // if ( this.lens.is(':hidden') || this.lens.css('opacity') < 1 || (this.lens.is(':visible') && this.lens.is(':animated')) ) {
                this.lens.stop(true, true).fadeTo(this.settings.duration, 1);
            //}

        },
        /**
         *
         * hideElems - Hides the popover and lens when required.
         *
         */
        hideElems: function()
        {

            if ( this.popover.is(':visible') || (this.popover.is(':hidden') && this.popover.is(':animated')) ) {
                this.popover.stop().fadeOut(this.settings.duration);
            }

            if ( this.lens.is(':visible') || (this.lens.is(':hidden') && this.lens.is(':animated')) ) {
                this.lens.stop().fadeOut(this.settings.duration);
            }

        }
    },


 //jQuery function to access / instantiate zoomify
    $.fn.zoomy = function (config) {
        
        var el = this,
            $el = $(this);

        function runIt()
        {
            //if nothing is passed to the function and this IS a Zoomy, return instance of Zoomy
            if (!config && el[0].zoomy) {
                return $el.get(0).zoomy;
            }
            //otherwise instantiate Zoomy
            else {
                return el.each(function () {

                    if (!this.zoomy) {
                        this.zoomy = new zoomy();
                        this.zoomy.init(this, config);
                    } else {
                        $(this).get(0).zoomy;
                    }

                });
            }
        }
        

        if (!$.browser.msie){

            var elems = el.find('img'),
                len = elems.length,
                blank = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
                error = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

            elems.bind('load.imgloaded',function(){
                if ((--len <= 0 && this.src !== blank) || this.src == error){
                    elems.unbind('load.imgloaded');
                    runIt();
                }
            }).each(function(){
                var curSrc = $(this).attr('src');
                // cached images don't fire load sometimes, so we reset src.
                if (this.complete || this.complete === undefined){
                    var src = this.src;
                    this.src = blank;
                    this.src = src;
                }

                $(this).error(function()
                {
                    $(this).attr('data-status', 'error');
                    this.src = error;
                }).attr({
                    src: this.src
                });


            }); 
        } else {
            runIt();
        }

        
    };


})(jQuery); 