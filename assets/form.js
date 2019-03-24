/**
 * Form JS
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


(function($){
	'use strict';

	function register_listen_on_trigger( $parent ){
		$parent.find('.listen_on_trigger').each(function(){
			var $wrap = $(this);
			if( ! $wrap.data('listen_on_trigger_init') ){
				$(document.body).on( $wrap.data('listen_on_trigger_name'), function( e, value ){
					var key = $wrap.data('listen_on_trigger_key') || 'field';
					var data = $wrap.data('listen_on_trigger_args') || '{}';
					if( 'string' === typeof(data) ){
						data = JSON.parse( ''+ data);
					}
					if( typeof(value) !== 'undefined' ){
						data[key] = value;
					}
					// console.log(data);

					if( 'ajax_fetch' === $wrap.data('listen_on_trigger_action') ){
						$wrap.addClass('ld');

						var ajaxurl = $wrap.data('listen_on_ajaxurl') ? $wrap.data('listen_on_ajaxurl') : dbtp.ajaxurl;

						$.post( ajaxurl, data, function(r){
							$wrap.removeClass('ld');
							if( r.status == 'ok' ) {
								$wrap.html( r.html );
								register_listen_on_trigger( $wrap );
								register_ajax_forms( $wrap );
							}

							$(document.body).trigger( data.action, [r, data, $wrap] );
						});
					}
					else if( 'set_value' == $wrap.data('listen_on_trigger_action') ){
						if( typeof(value[key]) !== 'undefined' ){
							$wrap.val( value[key] );
						}
					}
					else if( 'set_visibility' == $wrap.data('listen_on_trigger_action') ){
						// console.log(data);
						// console.log($wrap);
						if( data[key] == data.visible_if_value ){
							$wrap.show();
						} else {
							$wrap.hide();
						}
					}
					else if( 'set_html' == $wrap.data('listen_on_trigger_action') ){
						if( typeof(value[key]) !== 'undefined' ){
							$wrap.html( value[key] );
						}
					}
					else if( 'remove' == $wrap.data('listen_on_trigger_action') ){
						$wrap.remove();
					}
				});
				$wrap.data( 'listen_on_trigger_init', true );
			}
		});
	}
	function register_trigger_on_change( $parent ){
		$parent.find('.trigger_on_change').each(function(){
			var $wrap = $(this);
			if( ! $wrap.data('trigger_on_change_init') ){
				$wrap.on( 'change', function(){
					$(document.body).trigger( $wrap.data('on_change_trigger_name'), [$wrap.val()] );
				});
				if( 'radio' === $wrap.attr('type') ) {
					if( $wrap.is(':checked') ) {
						$wrap.trigger( 'change' );
					}
				} else if( 'SELECT' === $wrap.prop("tagName") ) {
					if( $wrap.val() ) {
						$wrap.trigger( 'change' );
					}
				} else {
					$wrap.trigger( 'change' );
				}

				$wrap.data('trigger_on_change_init', true);
			}
		});
	}
	function register_ajax_forms( $parent ){
		var dbtp = dbtp || {};
		var ajaxurl = ajaxurl || '';

		$parent.find('.wff_ajax_form').each(function(){
			var
			$form 		= $(this),
			$button 	= $form.find('.form_button'),
			method 		= $form.attr('method') || 'POST',
			name 		= $form.attr('name') || '',
			url 		= $form.attr('action') || '';

			if (! url) {
				if (ajaxurl) {
					url = ajaxurl;
				} else if (typeof(dbtp.ajaxUrl) !== 'undefined') {
					url = dbtp.ajaxUrl;
				}
			}

			$form.find('.wffwt_submit').append( '<div class="wf_notes"></div>' );
			var $notes = $form.find('.wf_notes');

			if (name) {
				$(document.body).trigger(name + '/init', [$form]);
			}

			$button.click(function(e){
				if (name) {
					$(document.body).trigger(name + '/submit', [$form]);
				}

				e.preventDefault();
				var data = $form.serialize();

				$notes.removeClass('_error _ok').empty();
				if ($button.hasClass('ld')) {
					$notes.html('Please hold on till the last request completes').addClass('_error');
					return false;
				}

				$button.addClass('ld').attr('disabled', 'disabled');
				if (typeof($form.data('loading_text')) !== undefined) {
					$notes.html( $form.data('loading_text') ).addClass('_note ld');
				}

				$.ajax({
					method: method,
					url: url,
					data: data
				})
				.done(function(r) {
					if ('0' === r) {
						$notes.html('Invalid form response.').addClass('_error');
					} else if( typeof(r.message) !== 'undefined' ){
						if (r.success) {
							$notes.html(r.message).addClass('_success');
						} else {
							$notes.html(r.message).addClass('_error');
						}
					} else {
						$notes.html(r.html).addClass('_'+ r.status);
					}

					if (name) {
						var _data = data.split("&").reduce(function(prev, curr) {
							var p = curr.split("=");
							prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
							return prev;
						}, {});

						$(document.body).trigger(name + '/done', [r, _data, $form]);
					}

					if( typeof(r.urlReplace) !== 'undefined' ){
						window.history.pushState("", "", r.urlReplace);
					}
					if( typeof(r.urlRedirect) !== 'undefined' ){
						window.location.replace(r.urlRedirect);
					}
					if( typeof(r.urlReload) !== 'undefined' ){
						document.location.reload();
					}
				})
				.fail(function(jqXHR){
					if (typeof(jqXHR.responseJSON) === 'undefined') {
						$notes.html('Internal Server Error. Errors were logged.').removeClass('_note _ok').addClass('_error');
					} else if (jqXHR.responseJSON.message) {
						$notes.html(jqXHR.responseJSON.message).removeClass('_note _ok').addClass('_error');
					} else if (jqXHR.status === 404) {
						$notes.html('Could not complete the request. Please try reloading the page.').removeClass('_note _ok').addClass('_error');
					}
				})
				.complete(function(){
					$button.removeClass('ld').removeAttr('disabled');
					$notes.removeClass('ld');
				});
			});
		});
	}
	function action_button_click_event( $button ){
		var
			url 		= $button.data('url'),
			method 		= $button.data('method') || 'POST',
			target 		= $button.data('target') || '',
			do_confirm 	= $button.data('confirm') || '',
			do_alert 	= $button.data('alert'),
			action 		= $button.data('action') || '',
			data;

		if( $button.hasClass('ld') || url === '' ){
			return false;
		}

		if( do_confirm && ! confirm(do_confirm) ){
			return false;
		}

		if ($button.data('form')) {
			data = $( $button.data('form') ).serialize();
			if (action) {
				data += '&action='+ action;
			}
		} else {
			data = $button.data();
			delete data.url;
			delete data.method;
			delete data.action;
		}

		$button.addClass('ld').attr('disabled', 'disabled');
		$.ajax({
			method: method,
			url: url,
			data: data
		})
		.done(function(r){
			if( typeof(r.urlReplace) !== 'undefined' ){
				window.history.pushState("", "", r.urlReplace);
			}
			if( typeof(r.urlRedirect) !== 'undefined' ){
				window.location.replace(r.urlRedirect);
			}
			if( typeof(r.urlReload) !== 'undefined' ){
				document.location.reload();
			}

			if (r.success) {
				if (target){
					$(target).html( r.message );
				} else if (do_alert == '1') {
					alert(r.message);
				}
			} else if (! r.success) {
				if( target ){
					$(target).html( r.message );
				} else if( do_alert === '1' ){
					alert( r.message );
				}
			}

			if (action) {
				$(document.body).trigger(action + '/done', [r, data, $button]);
			}
		})
		.complete(function(){
			$button.removeClass('ld').removeAttr('disabled');
		});
	}
	function guid() {
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
	}
	function s4() {
	  return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	}

	$(document).ready(function(){

		register_listen_on_trigger( $('body') );
		register_trigger_on_change( $('body') );
		register_ajax_forms( $('body') );

		$(document.body).on('dbtp/listen_on_trigger', function(e, $wrap){
			register_listen_on_trigger( $wrap );
		});
		$(document.body).on('dbtp/trigger_on_change', function(e, $wrap){
			register_trigger_on_change( $wrap );
		});
		$(document.body).on('dbtp/ajax_form', function(e, $wrap){
			register_ajax_forms( $wrap );
		});

		/* handle button click action */
		/* very useful and important as used on a lot of elements*/
		$(document.body).on('click', '.wff_ajax_action_btn', function(e){
			e.preventDefault();
			action_button_click_event( $(this) );
		});

		/* clone table */
		$(document.body).on('click', '.wf_repeater_add', function(e){
			e.preventDefault();
			var
				$button 	= $(this),
				$form		= $(this).closest('form'),
				key			= $button.data('parent'),
				$to			= $form.find('#wf_repeated_'+ key + ' tbody'),
				$html		= $form.find('#wf_repeater_'+ key + ' tbody').html();


			if( $html.indexOf('KEY') ){
				var uid = guid();
				$html = $html.replace(/KEY/g, uid);
			}
			$to.append($html);

			$(document.body).trigger( 'dbtp/row_cloned' );
			return false;
		});

		/* remove matchday row */
		$(document).on('click', '.wf_repeater_remove', function(e){
			e.preventDefault();
			var $button = $(this), $item = $button.closest('.wf_row');
			if( $button.data('action') ) {
				$(document).trigger( $button.data('action'), [$item] );
			} else {
				$item.remove();
			}
			$(document).trigger( 'dbtp/row_removed' );
			return false;
		});

		$(document).on('click', '.wff_image_btn', function(e){
			e.preventDefault();

			var _that = $(this),
			field = _that.data('field'),
			$wrap = _that.closest('.wffew'),
			file_frame = wp.media.frames.file_frame = wp.media({
				title: 'Upload or Select Image',
				multiple: false
			});
			file_frame.on( 'select', function() {
				var selected = file_frame.state().get('selection').toJSON();
				var file = selected[0], _file;

				if( typeof(file.sizes) !== 'undefined' ){
					var size = $( '#'+ _that.attr('rel') + '_img' ).data('size');
					if( file.sizes.hasOwnProperty(size) ) {
						_file = file.sizes[size];
					} else if( file.sizes.hasOwnProperty('thumbnail') ) {
						_file = file.sizes.thumbnail;
					} else {
						_file = file.sizes.full;
					}
				} else if( typeof(file.icon) !== 'undefined' ){
					_file = {url: file.icon};
				}

				$wrap.find( '#'+ _that.attr('rel') + '_input' ).val( file[field] );
				$wrap.find( '#'+ _that.attr('rel') + '_img' ).html( '<img src="'+ _file.url +'" class="image_preview" />' );
			});
			file_frame.open();
		});

		$('.wff_image_remove_btn').on('click', function(event){
			var _that = $(this);
			event.preventDefault();
			$( '#'+ _that.attr('rel') + '_input').val('');
			$( '#'+ _that.attr('rel') + '_img' ).empty();
		});
	});
})(jQuery);


(function($){
	'use strict';

	var
	formatBytes = function(bytes,decimals) {
		if (bytes === 0) {
			return '0 Bytes';
		}
		var k = 1024,
		   dm = decimals <= 0 ? 0 : decimals || 2,
		   sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		   i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
	},
	positional_hidden = function(el){
		el.css({'position':'absolute', 'left':-9999, 'opacity': 0});
	},
	reposition_hidden = function(el){
		el.css({'position':'relative', 'left':'auto', 'opacity': 1});
	},
	uploaderInit = function(obj){
		// Vars
		var
		field_name 		= obj.field_name,
		id 				= obj.id,
		uploadDiv 		= $('#plupload-upload-ui-'+ id),
		dragDrop 		= $('#drag-drop-area_'+ id),
		wrapDiv			= $('#dbtp-uploader-'+ id),
		processDiv 		= wrapDiv.find('.process-upload'),
		uploadCancel 	= wrapDiv.find('.cancel-upload'),
		uploadList 		= wrapDiv.find('.upload-list'),
		statusBtn 		= wrapDiv.find('.upload-status');

		// Create Uploader
		var uploader = new plupload.Uploader(obj);



		// Bind
		uploader.bind('Init', function(up) {
			if ( up.features.dragdrop && ! $(document.body).hasClass('mobile') ) {
				uploadDiv.addClass('drag-drop');

				dragDrop.bind('dragover.wp-uploader', function(){ // dragenter doesn't fire right :(
					uploadDiv.addClass('drag-over');

				}).bind('dragleave.wp-uploader, drop.wp-uploader', function(){
					uploadDiv.removeClass('drag-over');
				});
			} else {
				uploadDiv.removeClass('drag-drop');
				dragDrop.unbind('.wp-uploader');
				uploadDiv.find('.drag-drop-info').hide().next('p').hide();
			}

			// Reupload, clear image/file upload error and show form again
			$('.dbtp-uploader')
			.on('click', '.remove-file', function(){
				up.removeFile($(this).data('id'));
				$(this).parent('li').remove();
				return false;
			});
			wrapDiv.on('dbtp/start_upload', function(){
				// up.refresh();
				up.start();
			});
		});


		// Intialize
		uploader.init();


		// Bind
		uploader.bind('FilesAdded', function(up, files) {
			var hundredmb = 100 * 1024 * 1024, max = parseInt(up.settings.max_file_size, 10);

			plupload.each( files, function(file){
				if ( max > hundredmb && file.size > hundredmb && up.runtime != 'html5' ){
					processDiv.html('File is too large').show();
					uploadCancel.hide();
				} else {
					uploadList.append('<li class="file-queued" id="'+ file.id +'"><span class="file-name">'+ file.name +'</span><span class="file-size">'+ formatBytes(file.size) +'</span><span class="upload-progress"></span><button class="remove-file" data-id="'+ file.id +'" title="Remove file"><span class="dashicons dashicons-no-alt"></span></button></li>');
				}
			});
		});


		uploader.bind('BeforeUpload', function(up, file){
			// hide upload div
			positional_hidden(uploadDiv);

			// Create loading bar
			processDiv.html('<i class="loading"> Uploading file, Please wait..</i>').fadeIn();
		});

		uploader.bind('UploadFile', function(up, file) {
			var hundredmb = 100 * 1024 * 1024, max = parseInt(up.settings.max_file_size, 10);
			if ( max > hundredmb && file.size > hundredmb ){
				setTimeout(function(){
					if ( file.status < 3 && file.loaded === 0 ) { // not uploading
						up.stop();
						up.removeFile(file);
						up.start();
					}
				}, 10000);
			}
		});


		// Prgress loading bar
		uploader.bind('UploadProgress', function(up, file){
			$('#'+ file.id)
				.addClass('file-uploading')
				.removeClass('file-queued')
				.find('.upload-progress').html(file.percent +'%');
		});


		// After file has been uploaded
		uploader.bind('FileUploaded', function(up, file, xhr) {
			// console.log(xhr);
			if (xhr.response !== '') {
				var r = $.parseJSON(xhr.response);
				// console.log(r);
				if (! r.success){
					processDiv.fadeOut('fast',function(){
						$(this).html(r.message).fadeIn();
						uploadCancel.show();
					});
				} else {
					$('#'+ file.id)
						.addClass('file-uploaded')
						.removeClass('file-uploading');
					$('#'+ file.id).append('<input type="hidden" name="'+ field_name +'[]" value="'+ r.file.name +'" />');
				}
			}
		});
		uploader.bind('Error', function(up, err) {
			console.log(err);
			processDiv.html('Can not use selected file. Please upload another.').show();
			up.refresh();
		});

		uploader.bind('UploadComplete', function(up, files) {
			console.log('UploadComplete');
			processDiv.html('All files uploaded').show();
			wrapDiv.trigger('dbtp/upload_complete', [up, files]);
		});
	};

	$(document).ready(function($){

		$('.plupload-browse-button').bind('click', function(e) {
			var target = $(e.target), tr, c;

			if ( target.is('input[type="radio"]') ) { // remember the last used image size and alignment
				tr = target.closest('tr');
				if ( tr.hasClass('align') ) {
					setUserSetting('align', target.val());
				} else if ( tr.hasClass('image-size') ) {
					setUserSetting('imgsize', target.val());
				}

			} else if ( target.is('button.button') ) { // remember the last used image link url
				c = e.target.className || '';
				c = c.match(/url([^ '"]+)/);

				if ( c && c[1] ) {
					setUserSetting('urlbutton', c[1]);
					target.siblings('.urlfield').val( target.data('link-url') );
				}
			} else if ( target.is('a.dismiss') ) {
				target.parents('.media-item').fadeOut(200, function(){
					$(this).remove();
				});
			} else if ( target.is('.upload-flash-bypass a') || target.is('a.uploader-html') ) { // switch uploader to html4
				$('#media-items, p.submit, span.big-file-warning').css('display', 'none');
				switchUploader(0);
				e.preventDefault();
			} else if ( target.is('.upload-html-bypass a') ) { // switch uploader to multi-file
				$('#media-items, p.submit, span.big-file-warning').css('display', '');
				switchUploader(1);
				e.preventDefault();
			} else if ( target.is('a.describe-toggle-on') ) { // Show
				target.parent().addClass('open');
				target.siblings('.slidetoggle').fadeIn(250, function(){
					var S = $(window).scrollTop(), H = $(window).height(),
					top = $(this).offset().top, h = $(this).height(), b, B;

					if ( H && top && h ) {
						b = top + h;
						B = S + H;

						if ( b > B ) {
							if ( b - B < top - S )
								window.scrollBy(0, (b - B) + 10);
							else
								window.scrollBy(0, top - S - 40);
						}
					}
				});
				e.preventDefault();
			} else if ( target.is('a.describe-toggle-off') ) { // Hide
				target.siblings('.slidetoggle').fadeOut(250, function(){
					target.parent().removeClass('open');
				});
				e.preventDefault();
			}
		});


		// Loop through all fields
		if(typeof(uploaderInstances) != 'undefined'){
			for(var i=0; i < uploaderInstances.length; i++){
				if (! uploaderInstances[i].late_init) {
					uploaderInit(uploaderInstances[i]);
				}
			}
		}

		/*
		$(window).keypress(function(event) {
			if (!(event.which == 115 && event.ctrlKey) && !(event.which == 19)) return true;
			alert("Ctrl-S pressed");
			event.preventDefault();
			return false;
		});
		*/
		$(document.body).on('dbtp/uploader_init', function(a, uploader){
			uploaderInit(uploader);
		});
	});
})(jQuery);
