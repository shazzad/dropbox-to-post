<?php
/**
 * The Plugin Class
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


class DBTP_Utils
{
	// log created by addming action
	public static function log($str = '')
	{
		if ('yes' == dbtp()->settings->get('enable_debugging')) {
			DBTP_Logger::log($str);
		}
	}

	public static function format_price($price)
	{
		return sprintf('%s%d', '$', $price);;
		$price = number_format($price, 2);
		return sprintf('%s%s', '$', $price);
	}

	public static function current_user_has_role($role)
	{
		if (! is_user_logged_in()) {
			return false;
		}

		$user = wp_get_current_user();
		if (is_array($role)) {
			$roles = $role;
			foreach ($roles as $role) {
				if (in_array($role, (array) $user->roles)) {
					return true;
				}
			}
		} else {
			if (in_array($role, (array) $user->roles)) {
				return true;
			}
		}
		return false;
	}

	public static function can_user_access_dahboard($user_id = 0)
	{
		if (! $user_id) {
			$user_id = get_current_user_id();
		}

		$dashboard_accessRoles = dbtp()->settings->get('dashboard_accessRoles');
		if (! empty($dashboard_accessRoles)) {
			foreach ($dashboard_accessRoles as $dashboard_access_role) {
				if (user_can($user_id, $dashboard_access_role)) {
					return true;
				}
			}
		}
		return false;
	}
	public static function choice_name($choice, $choices = [])
	{
		foreach($choices as $c) {
			if(isset($c['name'])) {
				if(isset($c['key']) && $choice == $c['key']) {
					return $c['name'];
				} elseif(isset($c['id']) && $choice == $c['id']) {
					return $c['name'];
				}
			}
		}
		return '';
	}
	public static function sanitize_url_for_display($url)
	{
		if (0 === strpos($url, home_url())) {
			$url = str_replace(home_url(), '', $url);
		}
		return $url;
	}
	public static function order_by_position($a, $b)
	{
		if (!isset($a['position']) || !isset($b['position'])) return -1;
		if ($a['position'] == $b['position']) return 0;
	    return ($a['position'] < $b['position']) ? -1 : 1;
	}
	public static function ajax_error($html, $args = array())
	{
		self::ajax_response(array_merge(array('status'=>'error','html' => $html), $args));
	}
	public static function ajax_ok($html, $args = array())
	{
		self::ajax_response(array_merge(array('status'=>'ok','html' => $html), $args));
	}
	public static function ajax_response($a)
	{
		@error_reporting(0);
		header('Content-type: application/json');
		echo json_encode($a);
		die('');
	}
	public static function d($a)
	{
		self::p($a);
		die();
	}
	public static function p($a)
	{
		echo '<pre>'; 
		print_r($a); 
		echo '</pre>';
	}
	public static function is_localhost()
	{
		return in_array($_SERVER['REMOTE_ADDR'], array('127.0.0.1', '::1', '192.168.0.2'));
	}
	public static function validate_cookie_user()
	{
		if (isset($_COOKIE[LOGGED_IN_COOKIE]) && $user_id = wp_validate_auth_cookie($_COOKIE[LOGGED_IN_COOKIE], 'logged_in')) {
			wp_set_current_user($user_id);
		}
	}
}

