/*Copyright 1996-20141 Information Builders, Inc. All rights reserved.*/

/******************************************************************************
	General Notes:
		It appears that all modern browsers support the single line flex
		notation:
			flex: nGrow nShrink basis;
		EXCEPT safari (desktop) which uses...ummm...something else :(
******************************************************************************/
(function ($)
{
	/**** Platform checks ****/
	var ua = navigator.userAgent;
	var PlatformCheck = 
	{
		"isIE": (ua.match(".*Trident.*") != null),
		"isFirefox": (ua.match(".*Firefox.*") != null),
		"isAndroid": (ua.match(".*Andoid.*") != null),
		"isChrome": (ua.match(".*Chrome.*") != null),
		"isiPad": (ua.match(".*iPad.*") != null),
		"isiPhone": (ua.match(".*iPhone.*") != null)
	}
	$.extend(PlatformCheck, 
	{
		"isSafari":(ua.match(".*Safari.*") && !PlatformCheck.isChrome),
		"isIOS": (PlatformCheck.isiPad || PlatformCheck.isiPhone),
		"isMobile": (PlatformCheck.isIOS || PlatformCheck.isAndroid)
	});

	var oBoxProto =
	{
		options:
		{
			"inline": false,
			"reverse": false,
			"direction": "row",
			"justifycontent": "flex-start",
			"alignitems": "stretch",
			"aligncontent": "flex-start", /*funky...in Chrome/Safari, takes precedence over alignitems.  In <FF28 no working at all because wrap no work.*/
			"wrap": "nowrap", /* funky...no work in <ff28*/
			"updated":null, /*'boxupdated' event callback*/

			"null": null
		},

		_create: function()
		{
			this._updateOptions();
		},

		_setOptions: function()
		{
			this._superApply(arguments);
		},

		_setOption: function(key, value)
		{
			this._super(key, value);
			this._updateOptions();
		},

		_updateOptions: function()
		{
			var options = this.options;
			var direction = (options.direction == "column") ? "column" : "row";
			direction += options.reverse ? "-reverse" : "";

			var justify = options.justifycontent;
			if (justify == "flex-start")
				justify = "start"
			else
			if (justify == "flex-end")
				justify = "end"
			else
			if (justify == "space-between" || justify == "space-around")
				justify = "justify"

			var align = options.alignitems;
			if (align == "flex-start")
				align = "start"
			else
			if (align == "flex-end")
				align = "end"

			var aligncontent = options.justifycontent;
			if (aligncontent == "flex-start")
				aligncontent = "start"
			else
			if (aligncontent == "flex-end")
				aligncontent = "end"
			else
			if (aligncontent == "space-between")
				aligncontent = "justify";
			else
			if (aligncontent == "space-around")
				aligncontent = "distribute";

			var cssOptions = 
			{
				/* box (for Apple see after this call...it has to be handled differently. */
				"display": "-moz-box",
				"display": options.inline ? "-ms-inline-flexbox" : "-ms-flexbox",
				"display": options.inline ? "inline-flex" : "flex",

				/* direction/orientation */
				"-webkit-box-orient": (options.direction == "column") ? "vertical" : "horizontal",
				"-moz-box-orient": (options.direction == "column") ? "vertical" : "horizontal",
				"-webkit-flex-direction": direction,
				"-ms-flex-direction": direction,
				"flex-direction": direction,

				/* moz/webkit orientation direction (normal/reverse) */
				"-webkit-box-direction": (options.reverse) ? "reverse" : "normal",
				"-moz-box-direction": (options.reverse) ? "reverse" : "normal",

				/* can the content wrap */
				"-webkit-flex-wrap": options.wrap,
				"-ms-flex-wrap": options.wrap,
				"flex-wrap": options.wrap,
    
				/* justification */
				"-webkit-box-pack": justify,
				"-moz-box-pack": justify,
				"-webkit-justify-content": options.justifycontent,
				"-ms-flex-pack": (options.justifycontent == "space-around") ? "distribute" : justify,
				"justify-content": options.justifycontent,

				/* alignment */
				"-webkit-box-align": align,
				"-moz-box-align": align,
				"-webkit-align-items": options.alignitems,
				"-ms-flex-align": align,
				"align-items": options.alignitems,

				/* content alignment */
				"-webkit-align-content": options.aligncontent,
				"-ms-flex-line-pack": aligncontent,
				"align-content": options.aligncontent,

				/*dummy*/
				"null": "null"
			};

			/*Setup box display for Apple*/
			if(PlatformCheck.isIOS)
				cssOptions.display = options.inline ? "-webkit-inline-flex" : "-webkit-flex";
			else
			if(PlatformCheck.isSafari)
				cssOptions.display = "-webkit-box";

			//Apply the css.
			this.element.css(cssOptions);

			//Emit event for interested parties to know when box has changed.
			this._trigger("updated", null, this.options);
		},

		_destroy: function()
		{
			//Remove all box specific styling.
			this.element.css(
			{
				/* remove flexing */
				"display": "",

				/* direction/orientation */
				"-webkit-box-orient": "",
				"-moz-box-orient": "",
				"-webkit-flex-direction": "",
				"-ms-flex-direction": "",
				"flex-direction": "",

				/* moz/webkit orientation direction (normal/reverse) */
				"-webkit-box-direction": "",
				"-moz-box-direction": "",

				/* justification */
				"-webkit-box-pack": "",
				"-moz-box-pack": "",
				"-webkit-justify-content": "",
				"-ms-flex-pack": "",
				"justify-content": "",

				/* alignment */
				"-webkit-box-align": "",
				"-moz-box-align": "",
				"-webkit-align-items": "",
				"-ms-flex-align": "",
				"align-items": "",

				/* content alignment */
				"-webkit-align-content": "",
				"-ms-flex-line-pack": "",
				"align-content": "",

				/*dummy*/
				"null": "null"
			});
		
			//Call base Widget.
			this._super();
		}
	};
	$.widget("flex.box", $.Widget, oBoxProto);
	
	var oBoxChildProto =
	{
		options:
		{
			"grow": 0,
			"shrink":0,
			"basis":"auto",
			"order":0,
			"alignself":"auto",
			"updated":null, /*boxchildupdated event callback*/

			"null": null
		},

		_create: function()
		{
			/****
				We make this positioned relative so you can have child divs that work as scroll containers...
				(position:absolute;width:100%;height:100%;overflow:auto;-webkit-overflow-scrolling:touch)
			****/
			this.element.css("position", "relative");
			this._updateOptions();
		},

		_setOption: function(key, value)
		{
			$.Widget.prototype._setOption.apply(this, arguments);
			this._super("_setOption", key, value);
			this._updateOptions();
		},

		_updateOptions: function()
		{
			var options = this.options;
			var flex = options.grow + " " + options.shrink + " " + options.basis;
			
			var cssOptions = 
			{
				/*How are we flexing */
				"-webkit-box-flex": options.grow,
				"-moz-flex": flex,
				"-webkit-flex": flex,
				"-ms-flex": flex,
				"flex": flex,
				
				"-webkit-box-ordinal-group": options.order + 1,
				"-moz-box-ordinal-group": options.order + 1,
				"-webkit-order": options.order,
				"-ms-flex-order": options.order,
				"order": options.order,

				/*we can override the parent's align option*/
				"-webkit-align-self": options.alignself,
				"-ms-flex-item-align": (options.alignself == "flex-start") ? "start" : "end",
				"align-self": options.alignself,

				/*dummy*/
				"null": null
			}
		
			//If we are safari (desktop) and our parent element is an ibi-box we have to set the height/width?...I think?...maybe?
			var parentBox = this.element.parent().data("ibi-box");
			if(parentBox && PlatformCheck.isSafari && !PlatformCheck.isIOS)
			{
				var dimension = (parentBox.options.direction == "row") ? "width" : "height";
				cssOptions[dimension] = options.basis;
			}

			//Apply the css.
			this.element.css(cssOptions);

			//If we are safari and our parent element is an ibi-box.
			var parentBox = this.element.parent().data("ibi-box");
			if(parentBox && PlatformCheck.isSafari)
			{
				var dimension = (parentBox.options.direction == "row") ? "width" : "height";
				this.element.css({dimension : options.basis});
			}

			//Emit event for interested parties to know when boxchild has changed.
			this._trigger("updated", null, this.options);
		},

		_destroy: function()
		{
			//Remove all box specific styling.
			this.element.css(
			{
				"-webkit-box-flex": "",
				"-moz-flex": "",
				"-webkit-flex": "",
				"-ms-flex": "",
				"flex": "",
				"width":"",
				"height": "",
				
				"-webkit-box-ordinal-group": "",
				"-moz-box-ordinal-group": "",
				"-webkit-order": "",
				"-ms-flex-order": "",
				"order": "",

				"-webkit-align-self": "",
				"-ms-flex-item-align": "",
				"align-self": "",

				/*dummy*/
				"null": null
			});

			//If we are safari and our parent element is an ibi-box.
			var parentBox = this.element.parent().data("ibi-box");
			if(parentBox && PlatformCheck.isSafari)
			{
				var dimension = (parentBox.options.direction == "row") ? "width" : "height";
				this.element.css({dimension : ""});
			}
		
			//Call base Widget.
			this._superApply(arguments);
		}
	};
	$.widget("flex.boxchild", $.Widget, oBoxChildProto);

	/****
		Statically initialize any markup that has boxes defined "role='ibi-box'/'ibi-boxchild'/etc
		Construct out widgets via the namespaces to avoid conflicts.
	****/
	$(function()
	{
		$("[data-role-ibi *= 'box-parent']").each(function(idx, elt)
		{
			var $this = $(this);
			$.flex.box($this.data(), $this);
		});

		$("[data-role-ibi *= 'box-child']").each(function(idx, elt)
		{
			var $this = $(this);
			$.flex.boxchild($this.data(), $this);
		});
	});
})(jQuery);

