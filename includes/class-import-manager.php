<?php
/**
 * Main Plugin Class
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


class DBTP_Import_Manager
{
	private $dropboxApi;
	private $importRecurrence;

	public function __construct($importRecurrence = '')
	{
		$this->dropboxApi = new DBTP_Dropbox_Api_Client(
			dbtp()->settings->get('access_token')
		);
		if (! empty($importRecurrence)) {
			$this->importRecurrence = $importRecurrence;
		} else {
			$this->importRecurrence = dbtp()->settings->get('import_recurrence', 'daily');
		}
	}

	public function reschedule_crons()
	{
		$this->remove_crons();
		$this->schedule_crons();
	}
	public function remove_crons()
	{
		$hooks = [
			'dbtp_importer_cron'
		];
		foreach ($hooks as $hook) {
			$timestamp = wp_next_scheduled($hook);
			wp_unschedule_event($timestamp, $hook);
			wp_clear_scheduled_hook($hook);
		}
	}
	public function schedule_crons()
	{
		if ($this->importRecurrence) {
			wp_schedule_event(time(), $this->importRecurrence, 'dbtp_importer_cron');
		}
	}

	public function schedule_imports()
	{
		$account = $this->dropboxApi->getCurrentAccount();
		if (is_wp_error($account)) {
			return $account;
		}

		$importSize = (int) dbtp()->settings->get('import_size');
		if ($importSize < 1) {
			return new WP_Error('dbtp_import_size_error', __('Import size is less that 1. Ignoring import.'));
		}

		$importPath = dbtp()->settings->get('import_path');
		if (! $importPath) {
			return new WP_Error('dbtp_import_path_error', __('Import path is not set. Ignoring import.'));
		}

		$images = $this->dropboxApi->getImages($importPath);
		if (! $images) {
			return new WP_Error('dbtp_import_folder_empty', __('Import is empty. Ignoring import.'));
		}

		$importRemains = $importSize;
		foreach ($images as $image) {
			if (! $this->alreay_imported($image)) {
				$this->schedule_import($image);
				-- $importRemains;
			}
			if ($importRemains < 1) {
				break;
			}
		}

		if ($importRemains == $importSize) {
			return new WP_Error('dbtp_import_no_new_files', __('There is no new files to import. Ignoring import.'));
		}
	}

	public function alreay_imported($file)
	{
		$posts = get_posts([
			'post_type' => 'attachment',
			'meta_key' => '_dbtp_file_id',
			'meta_value' => $file['id']
		]);

		return ! empty($posts);
	}

	public function schedule_import($file)
	{
		wp_schedule_single_event(time() + 10, 'dbtp_import_post', [[
			'file_id' => $file['id'],
			'file_path' => $file['path_lower']
		]]);
	}
}
