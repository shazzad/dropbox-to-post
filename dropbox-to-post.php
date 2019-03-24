<?php
/*
 * Plugin Name: Dropbox To Post
 * Plugin URI: https://w4dev.com
 * Description: Dropbox To WordPress Post Scheduler
 * Version: 1.0
 * Author: Shazzad Hossain Khan
 * Author URI: https://w4dev.com
*/


/* Define current file as plugin file */
if (! defined('DBTP_PLUGIN_FILE')) {
	define('DBTP_PLUGIN_FILE', __FILE__);
}

/* Plugin instance caller */
function dbtp() {
	/* Require the main plug class */
	if (! class_exists('Dropbox_To_Post')) {
		require plugin_dir_path(__FILE__) . 'includes/class-dropbox-to-post.php';
	}

	/* Here comes the instance */
	return Dropbox_To_Post::instance();
}

/* Initialize */
add_action('plugins_loaded', 'dbtp_init');
function dbtp_init() {
	dbtp();
}
