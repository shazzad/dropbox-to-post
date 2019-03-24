<?php
/**
 * Main Plugin Class
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


final class Dropbox_To_Post
{
	// plugin name
	public $name = 'Dropbox To Post';

	// plugin version
	public $version = '1.0';

	// class instance
	protected static $_instance = null;

	// class instance
	public $settings = null;

	// static instance
	public static function instance()
	{
		if (is_null(self::$_instance)) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}

	public function __construct()
	{
		$this->define_constants();
		$this->include_files();
		$this->initialize();
		$this->init_hooks();

		do_action('dbtp/loaded');
	}

	private function define_constants()
	{
		define('DBTP_NAME'				, $this->name);
		define('DBTP_VERSION'			, $this->version);
		define('DBTP_DIR'				, plugin_dir_path(DBTP_PLUGIN_FILE));
		define('DBTP_URL'				, plugin_dir_url(DBTP_PLUGIN_FILE));
		define('DBTP_BASENAME'			, plugin_basename(DBTP_PLUGIN_FILE));
		define('DBTP_SLUG'				, 'dbtp');
	}

	private function include_files()
	{
		// core
		include_once(DBTP_DIR . 'includes/class-logger.php');
		include_once(DBTP_DIR . 'includes/class-config.php');
		include_once(DBTP_DIR . 'includes/class-utils.php');
		include_once(DBTP_DIR . 'includes/functions-form.php');
		include_once(DBTP_DIR . 'includes/class-post-importer.php');
		include_once(DBTP_DIR . 'includes/class-import-manager.php');

		// abstract classes
		foreach (glob(DBTP_DIR . 'includes/abstracts/*.php') as $file) {
			include_once($file);
		}

		// models
		foreach (glob(DBTP_DIR . 'includes/models/*.php') as $file) {
			include_once($file);
		}

		// apis
		foreach (glob(DBTP_DIR . 'includes/apis/*.php') as $file) {
			include_once($file);
		}

		// rest api controllers
		foreach (glob(DBTP_DIR . 'includes/rest-api-controllers/*.php') as $file) {
			include_once($file);
		}

		// admin
		if (is_admin()) {
			foreach (glob(DBTP_DIR . 'admin/*.php') as $file) {
				include_once($file);
			}
			foreach (glob(DBTP_DIR . 'admin/interfaces/*.php') as $file) {
				include_once($file);
			}
			foreach (glob(DBTP_DIR . 'admin/pages/*.php') as $file) {
				include_once($file);
			}
		}
	}

	private function init_hooks()
	{
		add_action('rest_api_init'					, [$this, 'rest_api_init'] 			, 5 );
		add_action('wp_enqueue_scripts'				, [$this, 'register_scripts'] 		, 2);
		add_action('admin_enqueue_scripts'			, [$this, 'register_scripts'] 		, 2);
		add_action('dbtp_importer_cron'				, [$this, 'importer_cron']			, 10);
		add_action('dbtp_import_post'				, [$this, 'import_post']			, 10);
	}

	// fan count updater cronjob handler
	public function importer_cron()
	{
		DBTP_Utils::log('Importer started');

		$importManager = new DBTP_Import_Manager();
		$schedule = $importManager->schedule_imports();

		if (is_wp_error($schedule)) {
			DBTP_Utils::log('Importer error: '. $schedule->get_error_message());
		} else {
			DBTP_Utils::log('Imported has been scheduled');
		}
	}

	// fan count updater cronjob handler
	public function import_post($args)
	{
		DBTP_Utils::log('Post Import started');
		DBTP_Utils::log(json_encode($args));

		$postImporter = new DBTP_Post_Importer($args);
		$import = $postImporter->import();

		if (is_wp_error($import)) {
			DBTP_Utils::log('Post import error: '. $import->get_error_message());
		} else {
			DBTP_Utils::log('Post import completed.');
		}
	}

	private function initialize()
	{
		$this->settings = new DBTP_Plugin_Settings();

		if (is_admin()) {
			new DBTP_Admin();
			new DBTP_Admin_Page_Settings();

			/* render admin logs page if debuggin is enabled */
			if ('yes' == $this->settings->get('enable_debugging')) {
				new DBTP_Admin_Page_Logs();
			}
		}
	}

	public function rest_api_init()
	{
		$rest_api_classes = [
			'DBTP_Settings_Rest_Api_Controller'
		];

		foreach ($rest_api_classes as $rest_api_class) {
			$controller = new $rest_api_class();
			$controller->register_routes();
		}
	}

	public function register_scripts()
	{
		// form
		wp_register_style('dbtp_form'				, DBTP_URL . 'assets/form.css'				, [], DBTP_VERSION);
		wp_register_script('dbtp_form'				, DBTP_URL . 'assets/form.js'				, ['jquery'], DBTP_VERSION);

		// admin
		wp_register_style('dbtp_admin'				, DBTP_URL . 'assets/admin.css'				, [
			'dbtp_form'
		], DBTP_VERSION);
		wp_register_script('dbtp_admin'				, DBTP_URL . 'assets/admin.js'				, [
			'jquery',
			'dbtp_form'
		], DBTP_VERSION);
	}
}
