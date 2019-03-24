<?php
/**
 * Plugin Settings Form
**/

$options = $settings->get_settings();

$fields = [];

$pos = 10;

++ $pos;
$fields[] = [
	'position'		=> $pos,
	'html' 			=> '<div class="wf_field_group_title">'. __('Dropbox Settings', 'dbtp') . '</div>'
];
++ $pos;
$fields['access_token'] = [
	'position'		=> $pos,
	'label'    		=> __('Access token', 'tvc'),
	'name'			=> 'access_token',
	'type'    		=> 'text',
	'desc_after'			=> sprintf(
		__('Your dropbox <a href="%s">app access token</a>. if you dont have an app, <a href="%s">create one from here</a>.
		<br/>while creating an app, set the follow settings -
		<br/>1. Choose an API: Dropbox API
		<br/>2. Choose the type of access you need: Full Dropbox.
		<br/>once the app is created, go to app settings, scroll down to section "OAuth 2" and click on "Generate Access Token" button.
		<br/>Copy the token, paste it in the above field & update this settings. Then you will be able to select your dropbox folder in the next field.', 'dbtp'),
		'https://www.dropbox.com/developers/apps',
		'https://www.dropbox.com/developers/apps/create'
	)
];

if ($folders = get_option('dbtp_root_folders')) {
	$source_folders_choices = [];
	foreach ($folders as $folder) {
		$source_folders_choices[$folder['path_lower']] = str_replace('/', ' > ', trim($folder['path_display'], '/'));
	}
} else {
	$source_folders_choices = ['' => 'Please set and update access token first'];
}

++ $pos;
$fields['import_path'] = [
	'position'		=> $pos,
	'label'    		=> __('Dropbox folder', 'tvc'),
	'name'			=> 'import_path',
	'type'    		=> 'select',
	'option'		=> $source_folders_choices
];

++ $pos;
$fields[] = [
	'position'		=> $pos,
	'html' 			=> '<div class="wf_field_group_title">'. __('Post Settings', 'dbtp') . '</div>'
];

++ $pos;
$fields[] = [
	'position'		=> $pos,
	'label'    		=> __( 'Post titles', 'fbpf' ),
	'id'	  		=> 'post_titles',
	'name'	  		=> 'post_titles',
	'type'    		=> 'repeater',
	'fields'		=> [
		[
			'name'	  		=> 'title',
			'type'    		=> 'text',
			'label'			=> __('Title', 'fbpf')
		]
	],
	'values'		=> ! empty($options['post_titles']) ? $options['post_titles'] : [],
	'desc'			=> 'the post will be created using one of the title from the list.'
];
++ $pos;
$fields[] = [
	'position'		=> $pos,
	'label'    		=> __( 'Post contents', 'fbpf' ),
	'id'	  		=> 'post_contents',
	'name'	  		=> 'post_contents',
	'type'    		=> 'repeater',
	'fields'		=> [
		[
			'name'	  		=> 'content',
			'id'    		=> 'content',
			'input_class'	=> 'content-editor',
			'input_attr'	=> ' style="height:300px;"',
			'type'    		=> 'textarea',
			'label'			=> __('Content', 'fbpf')
		]
	],
	'values'		=> ! empty($options['post_contents']) ? $options['post_contents'] : [],
	'desc'			=> 'the post will be created using one of the content from the list.'
];
++ $pos;
$fields[] = [
	'position'		=> $pos,
	'label'    		=> __( 'Post categories', 'fbpf' ),
	'id'	  		=> 'post_categories',
	'name'	  		=> 'post_categories',
	'type'    		=> 'checkbox',
	'option'		=> DBTP_Config::post_categories(),
];


++ $pos;
$fields[] = [
	'position'		=> $pos,
	'html' 			=> '<div class="wf_field_group_title">'. __('Schedule Settings', 'dbtp') . '</div>'
];

++ $pos;
$fields[] = [
	'position'		=> $pos,
	'label'    		=> __( 'Cron Recurrence', 'fbpf' ),
	'name'	  		=> 'import_recurrence',
	'type'    		=> 'select',
	'option'		=> DBTP_Config::cron_schedules(),
	'desc'			=> __('How frequently the script should run ?', 'fbpf')
];

++ $pos;
$fields['import_size'] = [
	'position'		=> $pos,
	'label'    		=> __('How many items to import ?', 'dbtp'),
	'name'			=> 'import_size',
	'type'    		=> 'text',
];

++ $pos;
$fields['enable_debugging'] = [
	'position'		=> $pos,
	'label'    		=> __('Enable debugging ?', 'dbtp'),
	'name'			=> 'enable_debugging',
	'type'    		=> 'radio',
	'option'		=> ['yes' => 'Yes', 'no' => 'No'],
	'desc'			=> __('By enabling debugging, you will be able to see process logs and trace errors', 'dbtp')
];


$form_args 	= [
	'id' 			=> 'dbtp_settings_form',
	'name' 			=> 'dbtp_settings_form',
	'ajax' 			=> true,
	'action' 		=> rest_url('dbtp/v2/settings'),
	'loading_text'	=> __('Updating', 'dbtp')
];

// allow filters
$fields = apply_filters('dbtp/settings_page/form_fields', $fields, $options, $form_args);

// order by position
uasort($fields, 'DBTP_Utils::order_by_position');

echo dbtp_form_fields($fields, $options, $form_args);
