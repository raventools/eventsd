<?php

class Api extends CI_Controller {
	/** @var BrowserApi $browserApi */
	protected $browserApi;
	protected $package = array();

	public function __construct() {
		parent::__construct();
		$this->browserApi = new ApiService();
	}

	public function buckets() {
		$data = $this->browserApi->buckets();

		$this->output('buckets', $data);
	}

	public function events($bucket) {
		$data = $this->browserApi->events($bucket);

		$this->output('events', $data);
	}

	protected function output($info = '', $data = array(), $status = "ok") {
		$this->package = array(
			'status' => $status,
			'info' => $info,
			'data' => $data
		);

		$this->echoJson();
	}
	protected function echoJson() {
		header('Cache-Control: no-cache, must-revalidate');
		header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
		header('Content-type: application/json');

		$encoded = json_encode($this->package) . "\n";

		$jsonp_callback = $this->input->get("jsonp_callback");
		if(!empty($jsonp_callback)) {
			echo "{$jsonp_callback}($encoded)";
		} else {
			echo $encoded;
		}
	}
}