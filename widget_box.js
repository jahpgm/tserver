/*Copyright 2015 Julian H., Inc. All rights reserved.*/
(function ($)
{
	//Prototype for flexbox widget.
	var oBoxProto =
	{
		options:
		{
			"display":"box",
			"direction": "row",
			"justify": "start",
			"alignItems": "start",
			"alignContent": "start", /*funky...in Chrome/Safari, takes precedence over alignitems.  In <FF28 no working at all because wrap no work.*/
			"wrap": "nowrap", /* funky...no work in <ff28*/
			"updated":null /*'boxupdated' event callback*/
		},

		_create: function()
		{
			var data = this.element.data();
			var options = this.options;
			options.direction = data.flexDirection || options.direction;
			options.justify = data.flexJustify || options.justify;
			options.alignItems = data.flexAlignItems || options.alignItems;
			options.alignContent = data.flexAlignContent || options.alignContent;
			options.wrap = data.flexWrap || options.wrap;
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
			//Remove existing classes.
			this._cleanup();
			
			//Apply the currently selected option css classes.
			var options = this.options;
			for(var key in options)
			{
				var classes = $.flex.flexbox._flexClasses[key];
				if(classes)
					this.element.addClass(classes[options[key]]);
			}

			//copy the new options so they can be removed next time.
			this.element.data("flexOptions", $.extend({}, options));

			//Emit event for interested parties to know when box has changed.
			this._trigger("updated", null, this.options);
		},

		_cleanup: function()
		{
			//Remove existing flex option classes.
			var oldOptions = this.element.data("flexOptions");
			for(var key in oldOptions)
			{
				var classes = $.flex.flexbox._flexClasses[key];
				if(classes)
					this.element.removeClass(classes[oldOptions[key]]);
			}
		},

		_destroy: function()
		{
			this._cleanup();
			//Call base Widget.
			this._super();
		}
	};
	$.widget("flex.flexbox", $.Widget, oBoxProto);
	$.flex.flexbox._flexClasses = 
	{
		"display":
		{
			"box":"flex-box",
			"boxInline":"flex-box-inline"
		},
		"direction":
		{
			"row":"flex-row",
			"rowReverse":"flex-row-reverse",
			"column":"flex-column",
			"columnReverse":"flex-column-reverse"
		},
		"wrap":
		{
			"nowrap":"flex-nowrap",
			"wrap":"flex-wrap",
			"wrapReverse":"flex-wrap-reverse"
		},
		"justify":
		{
			"start":"flex-justify-start",
			"end":"flex-justify-end",
			"center":"flex-justify-center",
			"spaceBetween":"flex-justify-space-between",
			"spaceAround":"flex-justify-space-around"
		},
		"alignItems":
		{
			"start":"flex-align-items-start",
			"end":"flex-align-items-end",
			"center":"flex-align-items-center",
			"stretch":"flex-align-items-stretch",
			"baseline":"flex-align-items-baseline"
		},
		"alignContent":
		{
			"start":"flex-align-content-start",
			"end":"flex-align-content-end",
			"center":"flex-align-content-center",
			"stretch":"flex-align-content-stretch",
			"spaceBetween":"flex-align-content-space-between",
			"spaceAround":"flex-align-content-space-around"
		}
	};
	
	//Prototype for flexitem widget.
	var oBoxChildProto =
	{
		options:
		{
			"grow": 0,
			"shrink":0,
			"basis":"auto",
			"order":0,
			"alignSelf":"auto",
			"updated":null /*boxchildupdated event callback*/
		},

		_create: function()
		{
			var data = this.element.data();
			var options = this.options;
			options.grow = data.flexGrow || options.grow;
			options.shrink = data.flexShrink || options.shrink;
			options.basis = data.flexBasis || options.basis;
			options.order = data.flexOrder || options.order;
			options.alignSelf = data.flexAlignSelf || options.alignSelf;
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
				"-webkit-align-self": options.alignSelf,
				"-ms-flex-item-align": (options.alignSelf == "flex-start") ? "start" : "end",
				"align-self": options.alignSelf,

				/*dummy*/
				"null": null
			}
		
			//Apply the css.
			this.element.css(cssOptions);

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
				"align-self": ""
			});

			//Call base Widget.
			this._superApply(arguments);
		}
	};
	$.widget("flex.flexitem", $.Widget, oBoxChildProto);

	/****
		Statically initialize any markup that has boxes defined "role='box'/'item'/etc
		Construct out widgets via the namespaces to avoid conflicts.
	****/
	$(function()
	{
		$("[data-role-flexbox *= 'box']").each(function(idx, elt)
		{
			var $this = $(this);
			$.flex.flexbox($this.data(), $this);
		});

		$("[data-role-flexbox *= 'item']").each(function(idx, elt)
		{
			var $this = $(this);
			$.flex.flexitem($this.data(), $this);
		});
	});
})(jQuery);

