<?php

class MY_Controller extends CI_Controller {

	protected function Response($status,$detail,$data) {
		$response = array(
				"status" => $status,
				"detail" => $detail,
				"data" => $data
				);
		$this->PrintJSON($response);
	}

	protected function OKResponse($detail,$data=null) {
		$this->Response("OK",$detail,$data);
	}

	protected function ErrorResponse($detail,$data=null) {
		$this->Response("ERROR",$detail,$data);
	}

	protected function PrintJSON($data) {
        header('Cache-Control: no-cache, must-revalidate');
        header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
        header('Content-type: application/json');

		$encoded = json_encode($data) . "\n";

		$jsonp_callback = $this->input->get("jsonp_callback");
		if(!empty($jsonp_callback)) {
			echo "{$jsonp_callback}($encoded)";
		} else {
			echo $encoded;
		}
	}
}
