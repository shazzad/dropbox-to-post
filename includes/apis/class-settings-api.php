<?php
/**
 * Settings API
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


class DBTP_Settings_Api
{
	public function update_settings($data)
	{
		$settings = new DBTP_Plugin_Settings();
		$old_job_recurrence = $settings->get('import_recurrence');

		foreach (['post_titles', 'post_contents'] as $field) {
			if (! empty($data[$field])) {
				foreach ($data[$field] as $k => $values) {
					if ('post_titles' == $field && empty($values['title'])) {
						unset($data[$field][$k]);
					}
					if ('post_contents' == $field && empty($values['content'])) {
						unset($data[$field][$k]);
					}
				}
				$data[$field] = array_values($data[$field]);
			}
		}

		foreach ($data as $key => $val) {
			$settings->set($key, $val);
		}

		$settings->save();

		flush_rewrite_rules();

		if ($old_job_recurrence != $settings->get('import_recurrence') || ! wp_next_scheduled('dbtp_importer_cron')) {
			$importManager = new DBTP_Import_Manager($settings->get('import_recurrence'));
			$importManager->reschedule_crons();
		}

		delete_option('dbtp_settings_error');
		delete_option('dbtp_root_folders');

		$dropboxApi = new DBTP_Dropbox_Api_Client(
			$settings->get('access_token')
		);
		$folders = $dropboxApi->getFolders();
		if (is_wp_error($folders)) {
			update_option('dbtp_settings_error', $folders->get_error_message());
		} else {
			update_option('dbtp_root_folders', $folders);
		}

		DBTP_Utils::log(sprintf(
			__( 'Settings updated by <a href="%s">%s</a>', 'dbtp' ),
			admin_url('user-edit.php?user_id='. get_current_user_id()),
			get_user_option('user_login')
		));

		return [
			'success' => true,
			'message' => __('Settings updated', 'dbtp')
		];
	}


	public function clear_cache()
	{
		if (! current_user_can('administrator')) {
			return [
			   'success' => false,
			   'message' => __('Sorry, you cant do this.', 'dbtp')
		   ];
		}

		global $wpdb;
		$options = $wpdb->get_col("SELECT option_name FROM $wpdb->options WHERE option_name LIKE '%\_dbtp\_%'");
		if (! empty($options)) {
			foreach($options as $option) {
				delete_option($option);
			}
		}

		// clear orphan postmeta
		$wpdb->query("DELETE pm FROM wp_postmeta pm LEFT JOIN wp_posts wp ON wp.ID = pm.post_id WHERE wp.ID IS NULL");

		// clear opcache
		if (function_exists('opcache_reset')) {
			opcache_reset();
		}

		return  [
			'success' => true,
			'message' => __('Cache cleaned', 'dbtp')
		];
	}
}
