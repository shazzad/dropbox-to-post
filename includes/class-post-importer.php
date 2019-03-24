<?php
/**
 * Main Plugin Class
 * @package WordPress
 * @subpackage Dropbox To Post
 * @author Shazzad Hossain Khan
 * @url https://w4dev.com
**/


class DBTP_Post_Importer
{
	// plugin name
	public $filePath;

	// plugin name
	public $fileId;

	// plugin name
	public $fileUrl;

	public function __construct($args)
	{
		$this->filePath = $args['file_path'];
		$this->fileId = $args['file_id'];
	}

	public function import()
	{
		$dropboxApi = new DBTP_Dropbox_Api_Client(
			dbtp()->settings->get('access_token')
		);
		$data = $dropboxApi->getTemporaryLink($this->filePath);

		if (is_wp_error($data)) {
			return $data;
		}

		$this->fileUrl = $data['link'];

		$mediaId = $this->download_media($this->fileUrl, basename($this->filePath));
		if (is_wp_error($mediaId)) {
			return $mediaId;
		}

		update_post_meta($mediaId, '_dbtp_file_id', $this->fileId);
		update_post_meta($mediaId, '_dbtp_file_path', $this->filePath);

		$postId = $this->create_post($mediaId);
		if (is_wp_error($postId)) {
			wp_delete_post($mediaId, true);
		}

		return $postId;
	}

	public function download_media($url, $fileName)
	{
		// date
		$date = current_time('mysql');

		// get placeholder file in the upload dir with a unique, sanitized filename
		$upload = wp_upload_bits( $fileName, 0, '', $date );
		if ( ! empty($upload['error']) ) {
			return new WP_Error( 'upload_dir_error', $upload['error'] );
		}

		// fetch the remote url and write it to the placeholder file
		$response = wp_safe_remote_get( $url, array('timeout' => 300, 'stream' => true, 'filename' => $upload['file']) );
		if ( is_wp_error( $response ) ) {
			@unlink( $upload['file'] );
			return $response;
		}

		// make sure the fetch was successful
		if( 200 != wp_remote_retrieve_response_code( $response ) ) {
			@unlink( $upload['file'] );
			return new WP_Error( 'dbtp_import_file_error', sprintf(
				__('Remote server returned error response %1$s', 'wordpress-importer'),
				get_status_header_desc( $response['response'] )
			));
		}

		$fileType = wp_check_filetype( $upload['file'] );
		$attachment = array(
			'post_mime_type' 	=> $fileType['type'],
			'guid' 				=> $upload['url'],
			'post_title' 		=> $fileName
		);

		$attachmentId = wp_insert_attachment( $attachment, $upload['file'] );

		include_once( ABSPATH . 'wp-admin/includes/image.php' );
		wp_update_attachment_metadata( $attachmentId, wp_generate_attachment_metadata($attachmentId, $upload['file']) );

		return $attachmentId;
	}

	public function create_post($mediaId)
	{
		$postTitlesData = dbtp()->settings->get('post_titles');
		if (! empty($postTitlesData)) {
			shuffle($postTitlesData);
			$postTitleData = array_shift($postTitlesData);
			$postTitle = $postTitleData['title'];
		} else {
			$postTitle = 'Demo post';
		}

		$postContentsData = dbtp()->settings->get('post_contents');
		if (! empty($postContentsData)) {
			shuffle($postContentsData);
			$postContentData = array_shift($postContentsData);
			$postContent = $postContentData['content'];
		} else {
			$postContent = 'Demo post';
		}

		$postCategories = dbtp()->settings->get('post_categories');
		if (empty($postCategories)) {
			$postCategories = [];
		} else {
			$postCategories = array_map('intval', $postCategories);
		}

		return wp_insert_post([
			'post_type' 	=> 'post',
			'post_status' 	=> 'publish',
			'post_title' 	=> $postTitle,
			'post_content' 	=> $postContent,
			'post_category'	=> $postCategories,
			'_thumbnail_id' => $mediaId
		]);
	}
}
