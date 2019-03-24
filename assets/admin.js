/**
 * Admin JS
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


(function($, dbtp) {
	"use strict";

	var setUrlParameter = function(url, key, value) {
		var baseUrl = url.split('?').length === 2 ? url.split('?')[0] : url,
			urlQueryString = url.split('?').length === 2 ? '?' + url.split('?')[1] : '',
			newParam = key + '=' + value,
			params = '?' + newParam;

		// If the "search" string exists, then build params from it
		if (urlQueryString) {
			var updateRegex = new RegExp('([\?&])' + key + '[^&]*');
			var removeRegex = new RegExp('([\?&])' + key + '=[^&;]+[&;]?');

			if (typeof value === 'undefined' || value === null || value === '') { // Remove param if value is empty
				params = urlQueryString.replace(removeRegex, "$1");
				params = params.replace(/[&;]$/, "");

			} else if (urlQueryString.match(updateRegex) !== null) { // If param exists already, update it
				params = urlQueryString.replace(updateRegex, "$1" + newParam);

			} else { // Otherwise, add it to end of query string
				params = urlQueryString + '&' + newParam;
			}
		}

		// no parameter was set so we don't need the question mark
		params = params === '?' ? '' : params;
		return baseUrl + params;
	},
	initEditors = function(editorConfig){
		$('.content-editor:visible:not(.editor-loaded)').each(function(i, el) {
			var editorId = $(el).attr('id');
			wp.editor.initialize(editorId, editorConfig);
		});
	};

	$(document).ready(function(){
		/* confirm action */
		$(document.body).on('click', '.dbtp_ca', function(){
			var d = $(this).data('confirm') || 'Are you sure you want to do this ?';
			if(! confirm(d)){
				return false;
			}
		});

		/* project forms */
		$(document.body).on('dbtp_settings_form/done', function($form, r){
			if (r.success) {
				window.location.href = setUrlParameter(dbtp.settingsUrl, 'message', r.message);
			}
		});

		var editorConfig = {
		    tinymce: {
		      wpautop:true,
		      plugins : 'charmap colorpicker compat3x directionality fullscreen hr image lists media paste tabfocus textcolor wordpress wpautoresize wpdialogs wpeditimage wpemoji wpgallery wplink wptextpattern wpview',
		      toolbar1: 'formatselect bold italic | alignleft aligncenter alignright | link unlink',
			  toolbar2: "strikethrough hr forecolor removeformat charmap undo redo wp_help"
		    },
		    quicktags: true
		};
		initEditors(editorConfig);

		$(document.body).on('dbtp/row_cloned', function(){
			initEditors(editorConfig);
		});
		$(document.body).on('dbtp_settings_form/submit', function(){
			tinyMCE.triggerSave();
		});
	});

})(jQuery, dbtp);
