<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

abstract class DBTP_Settings
{
	protected $default_settings = [];
	protected $settings = [];

	public function __construct()
	{
		$this->default_settings = $this->settings;
	}

	/* get all settings */
	public function get_settings()
	{
		return $this->settings;
	}

	/* get setting value */
	public function get($name = '', $default = '')
	{
		if (array_key_exists($name, $this->settings)) {
			return $this->settings[$name];
		} elseif (array_key_exists($name, $this->default_settings)) {
			return $this->default_settings[$name];
		} else {
			return $default;
		}
	}

	/* store setting value into php cache */
	public function set($name = '', $value = '')
	{
		$this->settings[ $name ] = $value;
	}

	/* reset settings to default value */
	public function reset()
	{
		$this->settings = $this->default_settings;
	}

	abstract public function save();
}
