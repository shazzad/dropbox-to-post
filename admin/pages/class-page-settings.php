<?php
/**
 * Settings Page
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


class DBTP_Admin_Page_Settings implements DBTP_Interface_Admin_Page
{
	public function __construct()
	{
		add_action('admin_menu'									, [$this, 'admin_menu']				, 10 );
	}

	public function handle_actions()
	{
		do_action('dbtp/admin_page/settings/handle_actions' );
	}
	public function load_page()
	{
		/*
		$dropboxApi = new DBTP_Dropbox_Api_Client(
			dbtp()->settings->get('access_token')
		);
	#	$data = $dropboxApi->getImages();
		$data = $dropboxApi->getFolders();
		DBTP_Utils::d($data);

		$postImporter = new DBTP_Post_Importer([
			'file_path' => '/bulk post scheduler/bulk post scheduler/2018-04-08 15.40.39.jpg',
			'file_id' => 'id:HIHv2uVhFTAAAAAAAAACcA'
		]);
		DBTP_Utils::d($postImporter->import());
		*/

		do_action('dbtp/admin_page/settings/load' );
	}

	public function render_page()
	{
		?><div class="wrap dbtp_wrap"><?php
			?><h1><?php printf(
				'%s - %s',
				__('Dropbox To Post', 'dbtp'),
				__('Settings', 'dbtp')
			); ?></h1><?php

			do_action('dbtp/admin_page/notices');
			$this->settings_notices();

			?><br>
            <div class="dbtp-admin-sidebar">
                <div class="dbtp-box">

	                <div class="dbtp-box-title">Cache</div>
	                <div class="dbtp-box-content">
                    	<?php _e('You can safely clear cached data to refresh with fresh content.', 'dbtp'); ?><br><br>
                        <button class="button wff_ajax_action_btn" data-url="<?php echo rest_url('dbtp/v2/settings/cache'); ?>" data-method="DELETE" data-alert="1"><?php _e('Clear Cache', 'dbtp'); ?></button>
						<h2><?php _e('Cron Updater', 'dbtp'); ?></h2>
						<p><?php
							if ($timestamp = wp_next_scheduled('dbtp_importer_cron')) {
								printf(
									__('Next update is scheduled to run in %s', 'dbtp'),
									human_time_diff($timestamp)
								);
							} else {
								_e('Update is not scheduled.', 'dbtp');
							}
						?><p>
					</div>
                </div>
			</div>
            <div class="dbtp-admin-content">
            	<div class="dbtp-box"><?php
					$settings = new DBTP_Plugin_Settings();
					include_once(DBTP_DIR . 'admin/views/form-settings.php');
				?></div>
			</div><?php

			do_action('dbtp/admin_page/template_after' );

		?></div><?php
	}

	public function settings_notices()
	{
		if ($message = get_option('dbtp_settings_error')) {
			printf(
				'<div class="error settings-error notice is-dismissible">
					<p><strong>%s</strong> %s</p>
				</div>',
				__('Dropbox Error:'),
				$message
			);
		}
	}

	public function admin_menu()
	{
		// access capability
		$access_cap = apply_filters('dbtp/admin_page/access_cap/settings', 'manage_options' );

		// register menu
		$admin_page = add_submenu_page(
			DBTP_SLUG,
			sprintf('%s - %s', __('Settings', 'dbtp'), __('Dropbox To Post', 'dbtp')),
			__('Settings', 'dbtp'),
			$access_cap,
			'dbtp',
			[$this, 'render_page']
		);

		add_action("admin_print_styles-{$admin_page}"	, [$this, 'print_scripts']);
		add_action("load-{$admin_page}"					, [$this, 'load_page']);
		add_action("load-{$admin_page}"					, [$this, 'handle_actions']);
	}

	public function print_scripts()
	{
		wp_localize_script('dbtp_admin', 'dbtp', [
			'ajaxUrl' => admin_url('admin-ajax.php'),
			'settingsUrl' => admin_url('admin.php?page=dbtp')
		]);

		wp_enqueue_editor();
		
		wp_enqueue_style(['dbtp_admin']);
		wp_enqueue_script(['dbtp_admin']);

		do_action('dbtp/admin_page/print_styles/settings' );
	}
}
