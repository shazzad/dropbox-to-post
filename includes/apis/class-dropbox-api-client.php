<?php
class DBTP_Dropbox_Api_Client
{
	protected $apiEndpoint = 'https://api.dropboxapi.com/2/';
	protected $accessToken;
	protected $appKey;
	protected $appSecret;
	protected $httpClient;

	function __construct($accessToken = '', $appKey = '', $appSecret = '')
	{
		$this->accessToken 		= $accessToken;
		$this->appKey 			= $appKey;
		$this->appSecret 		= $appSecret;
		$this->httpClient 		= _wp_http_get_object();
	}

	function isReady()
	{
		return ! empty($this->accessToken) || (! empty($this->appKey) && ! empty($this->appSecret));
	}

	function getCurrentAccount()
	{
		return $this->post('users/get_current_account', [], 'getCurrentAccount');
	}

	function getFolders($path = '', $cursor = false, $folders = [], $recursion = 0)
	{
		$args = compact(['path', 'cursor']);
		$return = $this->getFolder($args);
		if (is_wp_error($return)) {
			return $return;
		}

		$newFolders = wp_list_filter($return['entries'], ['.tag' => 'folder']);
		$folders = array_merge($folders, $newFolders);

		// enough
		if ($recursion > 20) {
			return $folders;
		}

		if (! empty($return['cursor']) && $return['has_more']) {
			++ $recursion;
			return $this->getFolders($path, $cursor, $folders, $recursion);
		}

		return $folders;
	}

	function getImages($path = '', $cursor = false, $images = [], $recursion = 0)
	{
		$args = compact(['path', 'cursor']);
		$return = $this->getFolder($args);
		if (is_wp_error($return)) {
			return $return;
		}

		$newImages = [];
		foreach ($return['entries'] as $file) {
			if (! isset($file['media_info'])
			|| ! isset($file['media_info']['metadata'])
			|| ! isset($file['media_info']['metadata']['.tag'])
			|| 'photo' != $file['media_info']['metadata']['.tag']) {
				continue;
			}

			$newImages[] = $file;
		}


		$images = array_merge($images, $newImages);

		// enough
		if ($recursion > 20) {
			return $images;
		}

		if (! empty($return['cursor']) && $return['has_more']) {
			++ $recursion;
			return $this->getImages($path, $cursor, $images, $recursion);
		}

		return $images;
	}

	function getFolder($args = [])
	{
		if (! empty($args['cursor'])) {
			return $this->post('files/list_folder/continue', ['cursor' => $args['cursor']], 'getFolder');
		} else {
			$args = wp_parse_args($args, [
				'path' 									=> '',
				'recursive'								=> false,
				'include_media_info' 					=> true,
				'include_deleted' 						=> false,
				'include_has_explicit_shared_members' 	=> false,
				'include_mounted_folders' 				=> false,
				'limit' 								=> 2000
			]);
			unset($args['cursor']);

			return $this->post('files/list_folder', $args, 'getFolder');
		}
	}

	function getTemporaryLink($path)
	{
		return $this->post('files/get_temporary_link', ['path' => $path], 'getTemporaryLink');
	}

	private function post($path, $data = [], $context = '')
	{
		if (empty($data)) {
			$data = 'null';
		} else {
			$data = json_encode($data);
		}

		$response = $this->httpClient->post(
			$this->apiEndpoint . $path,
			[
				'body' => $data,
				'headers' => [
					'Content-type' 				=> 'application/json',
					'Authorization' 			=> 'Bearer '. $this->accessToken
				],
				'timeout' => 90,
				'ssl_verify' => false,
				'verify' => false
			]
		);

		return $this->formatResponse($response, $context);
	}

	private function formatResponse($response, $context = '')
	{
		if (is_wp_error($response)) {
			$return = $response;
		} else {
			if ($response['response']['code'] > 399) {
				$data = json_decode($response['body'], true);
				if (isset($data['error_summary'])) {
					$return = new WP_Error('apiError', $data['error_summary'] . '. Code: '. $response['response']['code']);
				} else {
					$return = new WP_Error('apiError', $response['body'] . '. Code: '. $response['response']['code']);
				}
			} else {
				$return = json_decode($response['body'], true);
			}
		}

		if (is_wp_error($return)) {
			DBTP_Utils::log('Dropbox API Error: '. $return->get_error_message());
		} else {
			if ($context) {
				DBTP_Utils::log('Dropbox API Request: '. $context);
			}
		}

		return $return;
	}
}
