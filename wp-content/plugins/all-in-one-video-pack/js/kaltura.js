/*
 * Opens modal box with iframe 
 */
KalturaModal = {
	currentModalId: null,

	openModal: function (id, url, options) {
		var width = options.width;
		var height = options.height;


		var jqBody = jQuery("body");

		// create overlay div
		var jqOverlay = jQuery("<div>");
		jqOverlay.attr("id", "kalturaOverlay");
		jqBody.append(jqOverlay);

		// create modalbox div
		var jqModalbox = jQuery("<div>");
		jqModalbox.attr("id", id);
		jqModalbox.attr("class", "kalturaModal");
		jqModalbox.css("display", "block");
		jqModalbox.css("margin-top", "-" + (height / 2) + "px");
		jqModalbox.css("margin-left", "-" + (width / 2) + "px");
		jqModalbox.css("width", width + "px");

		// create content div inside objModalbox
		var jqModalboxContent = jQuery("<div>");
		var jqIframe = jQuery("<iframe>");
		jqIframe.attr("scrolling", "no");
		jqIframe.attr("width", width);
		jqIframe.attr("height", height);
		jqIframe.attr("frameborder", "0");
		jqIframe.attr("src", url);
		jqModalboxContent.append(jqIframe);
		jqModalbox.append(jqModalboxContent);

		jqBody.append(jqModalbox);

		this.currentModalId = id;
	},

	closeModal: function () {
		jqOverlay = jQuery("#kalturaOverlay");
		jqOverlay.remove();
		jqModalbox = jQuery("#" + this.currentModalId);
		jqModalbox.remove();

		this.currentModalId = null;
	}
}

Kaltura = {
	Delegate: {
		create: function (/*Object*/ scope, /*Function*/ method) {
			var f = function () {
				return method.apply(scope, arguments);
			}
			return f;
		}
	},

	animateModalSize: function (width, height, callback) {
		if (!callback)
			var callback = function () {
			};

		// if its not found, just run the callback
		if (jQuery("#TB_window").size() == 0) {
			callback();
			return;
		}

		this.originalWidth = Number(jQuery("#TB_window").css("width").replace("px", ""));
		this.originalHeight = Number(jQuery("#TB_iframeContent").css("height").replace("px", "")); // take the height of the iframe, because we ignore the height of the dark gray header (it's outside of the iframe)

		// no need to animate if dimensions are the same
		if ((width == this.originalWidth) && (height == this.originalHeight)) {
			callback();
			return
		}

		jQuery("#TB_window").animate(
			{
				width     : width + "px",
				marginTop : "-" + ((height + 27) / 2) + "px",
				marginLeft: "-" + (width / 2) + "px"
			},
			600
		);

		jQuery("#TB_iframeContent").animate(
			{
				width : width + "px",
				height: (height + 27) + "px"
			},
			600,
			null,
			callback
		);
	},

	restoreModalSize: function (callback) {

		// the original modal dimensions
		//var origWidth = 669;
		//var origHeight = 512;

		Kaltura.animateModalSize(
			this.originalWidth,
			this.originalHeight,
			function () {
				Kaltura.restoreModalBoxWp26();
				callback();
			}
		);
	},

	getTopWindow: function () {
		return (window.opener) ? window.opener : (window.parent) ? window.parent : window.top;
	},

	hackSimpleEditorModal: function () {
		var topWindow = Kaltura.getTopWindow();

		// hide the header
		topWindow.jQuery("#TB_title").hide();

		// restore top border
		topWindow.jQuery("#TB_iframeContent").css("margin-top", "0px");
	},

	restoreSimpleEditorHack: function () {
		var topWindow = Kaltura.getTopWindow();

		// restore the header
		topWindow.jQuery("#TB_title").show();

		// this will remove 1px of top border
		topWindow.jQuery("#TB_iframeContent").css("margin-top", null);
	},

	hackModalBoxWp26: function () {
		// IMPORTANT: this code must run from the top window and not from the thickbox iframe

		// don't run twice
		if (typeof(tb_positionKalturaBackup) == "function")
			return;

		// run tb_position to set the default thick box dimensions
		tb_position();

		var height = jQuery("#TB_window").css("height");
		height = height.replace("px", "");
		height = Number(height);
		if (isNaN(height))
			height = 0;

		jQuery("#TB_window").css("top", '');
		jQuery("#TB_window").css("margin-top", "-" + (height / 2) + "px");
		jQuery("#TB_window").css("height", '');
		jQuery("#TB_window").css("width", '900');
		jQuery("#TB_window").show(); // fixes compatibility with wordpress 3.1+, see: http://www.kaltura.org/pop-video-embed-dashboard-broken

		// backup and temporary remove the tb_position function
		tb_positionKalturaBackup = tb_position;
		tb_position = function () {
		};

		// init interval to restore tb_position function when the thickbox is closed
		Kaltura.modalBoxWp26Interval = setInterval(Kaltura.modalBoxWp26IntervalFunction, 100);
	},

	modalBoxWp26IntervalFunction: function () {
		// if thickbox was closed
		if (jQuery("#TB_window").css("display") != "block") {
			Kaltura.restoreModalBoxWp26();
		}
	},

	restoreModalBoxWp26: function () {
		// clear the interval
		clearInterval(Kaltura.modalBoxWp26Interval);

		// restore the position of the thickbox
		tb_position = tb_positionKalturaBackup;
		tb_positionKalturaBackup = null;
		tb_position();
	},

	activatePlayer: function (thumbnailDivId, playerDivId) {
		jQuery('#' + playerDivId).show();
		jQuery('#' + thumbnailDivId).hide();
	},

	isMacFF: function () {
		var userAgent = navigator.userAgent.toLowerCase();
		if (userAgent.indexOf('mac') != -1 && userAgent.indexOf('firefox') != -1) {
			return true;
		}
		return false;
	},

	hideTinyMCEToolbar: function () {
		var topWindow = Kaltura.getTopWindow();
		topWindow.jQuery("#content_tbl tr.mceFirst").hide();
	},

	showTinyMCEToolbar: function () {
		var topWindow = Kaltura.getTopWindow();
		topWindow.jQuery("#content_tbl tr.mceFirst").show();
	},

	switchSidebarTab: function (sender, type, page) {
		var menu = jQuery("#kaltura-sidebar-menu");
		if (menu.find("a.selected").get(0) == sender)
			return; // so we won't load the selected tab

		menu.find("a").removeClass("selected"); // unselect all
		jQuery(sender).addClass("selected"); // select the current


		jQuery("#kaltura-sidebar-container").empty();
		jQuery("#kaltura-loader").show();

		var url = KalturaSidebarWidget.ajaxurl + "?action=kaltura_widget_ajax&kaction=" + type + "&page=" + page;
		jQuery.get(
			url,
			null,
			function (data, status) {
				jQuery("#kaltura-loader").hide();
				jQuery("#kaltura-sidebar-container").append(data);
			},
			"html"
		);
	},

	unbindOverlayClick: function () {
		jQuery("#TB_overlay").unbind("click");
	},

	bindOverlayClick: function () {
		jQuery("#TB_overlay").bind("click", tb_remove);
	}
}