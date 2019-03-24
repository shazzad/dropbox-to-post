<?php
/**
 * Logs
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/

if (! defined('ABSPATH')) {
	die('Accessing directly to this file is not allowed');
}

class DBTP_Logger
{
	public static function log_file()
	{
		$upload_dir = wp_upload_dir();
		$dir = $upload_dir['basedir'] . '/logs';
		if (! file_exists($dir)) {
			wp_mkdir_p($dir);
		}
		return $dir . '/dbtp.log';
	}

	public static function log($str = '')
	{
		if (empty($str)) {
			return false;
		}

		$str = maybe_serialize($str);

		$fh = null;
		$file = self::log_file();

		if (! file_exists($file)) {
			if (! wp_mkdir_p(dirname($file))) {
				return false;
			}

			$fh = fopen($file, 'w+');
			fwrite($fh, current_time('[Y-M-d H:i:s]') .' '. $str . PHP_EOL);
			fclose($fh);
		} else {
			if (!is_writable($file)) {
				return false;
			}

			$fh = fopen($file, 'a+');
			fwrite($fh, current_time('[Y-M-d H:i:s]') .' '. $str . PHP_EOL);
			fclose($fh);
		}
	}

	public static function clear_logs()
	{
		if (file_exists(self::log_file())) {
			@unlink(self::log_file());
		}
	}
}

