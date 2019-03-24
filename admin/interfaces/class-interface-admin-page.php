<?php
/**
 * Admin Environment
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


interface DBTP_Interface_Admin_Page
{
	public function load_page();
	public function handle_actions();
	public function print_scripts();
	public function render_page();
}
