<?php
/**
 * Configuration
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


class DBTP_Config
{
	public static function cron_schedules()
	{
		$schedules = [];
		foreach (wp_get_schedules() as $key => $schedule) {
			$schedules[] = [
				'key' 	=> $key,
				'name' 	=> $schedule['display']
			];
		}
		return $schedules;
	}

	public static function post_categories()
	{
		$categories = [];
		foreach (get_categories(['hide_empty' => false]) as $cat) {
			$categories[] = [
				'key' 	=> $cat->term_id,
				'name' 	=> $cat->name
			];
		}
		return $categories;
	}
}
