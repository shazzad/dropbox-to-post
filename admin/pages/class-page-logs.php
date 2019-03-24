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

class DBTP_Admin_Page_Logs implements DBTP_Interface_Admin_Page
{
	public function __construct()
	{
		add_action('admin_menu' 								, [$this, 'admin_menu'], 200);
		add_action('wp_ajax_dbtp_clear_logs'					, [$this, 'clear_logs_ajax']);
		add_action('wp_ajax_dbtp_logs_template'					, [$this, 'logs_template_ajax']);
		add_action('dbtp_daily_cron'							, 'DBTP_Logger::clear_logs');
	}
	public function handle_actions()
	{
	}

	public function clear_logs_ajax()
	{
		DBTP_Logger::clear_logs();
		DBTP_Utils::ajax_ok("Logs cleaned");
	}

	public function logs_template_ajax()
	{
		if (file_exists(DBTP_Logger::log_file())) {
			DBTP_Utils::ajax_ok($this->log_template());
		} else {
			DBTP_Utils::ajax_error(__('No logs available :)', 'dbtp'));
		}
	}

	public function load_page()
	{
		if (! wp_next_scheduled('dbtp_daily_cron')) {
			wp_schedule_event(time() + 2, 'daily', 'dbtp_daily_cron');
		}
		do_action('dbtp/admin_page/logs/load');
	}

	public function render_page()
	{
		?><style>
			#dbtp_logs_wrap{ max-height:340px; overflow:hidden; overflow-y:scroll;}
			#dbtp_logs_wrap ul li{ padding:8px 5px 8px 120px; margin:0; font-size:12px; border-bottom:1px solid #e5e5e5; position:relative; }
			#dbtp_logs_wrap > ul > li > time{ position:absolute; top: auto; left:10px; }
			#dbtp_logs_wrap ul ul > li{ padding:5px;  border-bottom:none; }
			#dbtp_logs_wrap ul ul > li:before{ content:"- "}
			@media (min-width:480px){
				.dbtp-box-title .wff_ajax_action_btn{float:right;}
			}
			@media (max-width:480px){
				.dbtp-box-title span{display:block;}
				.dbtp-box-title .wff_ajax_action_btn{margin-top:20px;}
			}
		</style>
		<div class="wrap dbtp-wrap">
			<h1><?php _e('Dropbox To Post Logs', 'dbtp'); ?></h1><br>
			<div class="dbtp-admin-content">
				<div class="dbtp-box">
					<div class="dbtp-box-title">
	                    <span><?php _e('Logs refreshes automatically.', 'dbtp'); ?></span>
                    	<a class="button wff_ajax_action_btn" data-target="#dbtp_logs_wrap" data-url="<?php echo admin_url('admin-ajax.php?action=dbtp_clear_logs'); ?>" data-action="dbtp_clear_logs"><?php _e('Clear logs', 'dbtp'); ?></a>
                    </div>
					<div class="dbtp-box-content">
                        <div id="dbtp_logs_wrap"><?php
                        if (file_exists(DBTP_Logger::log_file())) {
                            echo $this->log_template();
                        } else {
                            echo '<div class="_error"><p>'. __('No logs available :)', 'dbtp') .'</p></div>';
                        }
                    ?></div>
                </div>
			</div>
		</div>

		<script type="text/javascript">
		(function($){ 
			$(document).ready(function(){
				setTimeout(refreshLog, 5000);
				$(window).on('dbtp_clear_logs/done', function(obj, r){
					if('ok' == r.status){
						$('#dbtp_logs_wrap').html('<div class="_ok"><p><?php _e('logs cleared', 'dbtp'); ?></p></div>');
					}
				});
			});
			function refreshLog(){
				$('.dbtp_admin_widget h2').next('.dbtp_desc').addClass('ld');
				$.post(ajaxurl + '?action=dbtp_logs_template', function(r){
					if(r.status == 'ok'){
						$('#dbtp_logs_wrap').html(r.html);
						setTimeout(refreshLog, 5000);
					}
					else if (r.status == 'error'){
						$('#dbtp_logs_wrap').html('<div class="_error"><p>' + r.html + '</p></div>');
						setTimeout(refreshLog, 20000);
					}
					$('.dbtp_admin_widget h2').next('.dbtp_desc').removeClass('ld');
				});
			}
		})(jQuery);
		</script>
		<?php
	}

	public function log_template()
	{
		$buff = '';
		$lines = file(DBTP_Logger::log_file());

		if(! empty($lines))
		{
			$lines = array_reverse($lines);

			$buff .= '<ul>';
			foreach($lines as $line)
			{
				$date = substr($line,1, 19);
				$line = substr($line, 19 + 3);
				$line = maybe_unserialize(trim($line));

				if (is_array($line)) {
					$line = implode('</li><li>', $line);

					$buff .= '<li><ul>';
					$buff .= sprintf('<li>%s</li>', $line);
					$buff .= '</ul></li>';
				} else {
					$time = strtotime($date);
					$curr_time = current_time('timestamp');
					$date_str = date('d/M H:i A', $time);
					
					if ($time > $curr_time - HOUR_IN_SECONDS) {
						$buff .= sprintf('<li><time title="%s">'.__('%s ago', 'dbtp').'</time><span>%s</span></li>', $date_str, human_time_diff($time, $curr_time), $line);
					} else {
						$buff .= sprintf('<li><time title="%s">%s</time><span>%s</span></li>', $date_str, $date_str, $line);
					}
				}
			}
			$buff .= '</ul>';
		}

		return $buff;
	}

	public function admin_menu()
	{
		// access capability
		$access_cap = apply_filters('dbtp/access_cap/logs', 'manage_options');

		// register menu
		$admin_page = add_submenu_page(
			DBTP_SLUG, 
			sprintf('%s - %s', __('Logs', 'dbtp'), __('Dropbox To Post', 'dbtp')),
			__('Logs', 'dbtp'),
			$access_cap,
			'dbtp-logs',
			[$this, 'render_page']
		);

		add_action("admin_print_styles-{$admin_page}"	, [$this, 'print_scripts']);
		add_action("load-{$admin_page}"					, [$this, 'load_page']);
		add_action("load-{$admin_page}"					, [$this, 'handle_actions']);
	}

	public function print_scripts()
	{
		wp_localize_script('dbtp_admin', 'dbtp', [
			'apiUrl' 		=> rest_url('dbtp/v2/'),
			'logsUrl'		=> admin_url('admin.php?page=dbtp-logs')
		]);

		wp_enqueue_style(['dbtp_admin']);
		wp_enqueue_script(['dbtp_admin']);
	}
}
