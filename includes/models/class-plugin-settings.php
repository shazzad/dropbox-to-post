<?php

class DBTP_Plugin_Settings extends DBTP_Settings
{
	/* where we store the data */
	protected $option_name = 'dbtp_settings';

	/* default settings */
	protected $settings = [
		'import_recurrence'				=> 'daily',
		'import_size'					=> 2,
		'enable_debugging'				=> 'no'
	];

	public function __construct()
	{
		parent::__construct();
		$this->settings = get_option($this->option_name, $this->settings);
	}

	/* store data to database */
	public function save()
	{
		update_option($this->option_name, $this->settings);
	}
}
