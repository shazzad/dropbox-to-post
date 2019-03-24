<?php
/**
 * Admin Environment
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


class DBTP_Admin
{
	function __construct()
	{
		add_action('admin_menu'								, [$this, 'admin_menu']);
		add_filter('plugin_action_links_' . DBTP_BASENAME	, [$this, 'plugin_action_links']);
		add_action('dbtp/admin_page/notices'				, [$this, 'admin_page_notices']);
	}

	/* Setup Admin Menu */
	public function admin_menu()
	{
		// access capability
		$access_cap = apply_filters('dbtp/admin_page/access_cap', 'manage_options');

		// menu position
		$menu_position = 34.9;

		$admin_page = add_menu_page(
			__('Dropbox To Post', 'dbtp'),
			__('Dropbox To Post', 'dbtp'),
			$access_cap,
			DBTP_SLUG,
			'__return_false',
			'dashicons-admin-settings',
			$menu_position
		);
	}

	public function plugin_action_links($links)
	{
		$links['settings'] = '<a href="'. admin_url('admin.php?page=dbtp') .'">' . __('Settings', 'dbtp'). '</a>';
		return $links;
	}

	public function admin_page_notices()
	{
		?><div id="dbtp_admin_notes">
			<?php if( isset($_GET['error']) && !empty($_GET['error']) ){ ?><div class="_error"><p><?php
				echo stripslashes(urldecode($_GET['error'])); ?></p></div><?php
			} ?>
			<?php if( isset($_GET['ok']) && !empty($_GET['ok']) ){ ?><div class="_ok"><p><?php
				echo stripslashes(urldecode($_GET['ok'])); ?></p></div><?php
			} ?>
			<?php if( isset($_GET['message']) && !empty($_GET['message']) ){ ?><div class="_ok"><p><?php
				echo stripslashes(urldecode($_GET['message'])); ?></p></div><?php
			} ?>
			<?php if( isset($_GET['m']) && 'dbtprp_su' == $_GET['m'] ){ ?><div class="updated"><p><?php
				_e('Settings updated'); ?></p></div><?php
			} ?>
		</div><?php
	}
}
