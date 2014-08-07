
<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class API extends MY_Controller {

	public function __construct() {
		parent::__construct();
		$this->load->model("bucket_model");
	}

	public function buckets() {

		try {
			$buckets = $this->bucket_model->buckets();
			$this->OKResponse("buckets",$buckets);
		} catch(Exception $e) {
			$this->ErrorResponse("buckets",array("exception"=>$e->getMessage()));
		}
	}

	public function events($bucket,$limit=10) {

		try {
			$events = $this->bucket_model->events($bucket,$limit);
			$this->OKResponse("events",$events);
		} catch(Exception $e) {
			$this->ErrorResponse("events",array("exception"=>$e->getMessage()));
		}
	}

	public function clear($bucket) {
		try {
			$deleted = $this->bucket_model->clear($bucket);
			$this->OKResponse("clear",array("count"=>$deleted));
		} catch(Exception $e) {
			$this->ErrorResponse("clear",array("exception"=>$e->getMessage()));
		}
	}

	public function testevent() {
		EventsD::$host = "127.0.0.1";
		EventsD::$port = "6969";
		$sent = EventsD::send("api.test",array("test"=>1));
		$this->OKResponse("testevent",array("sent"=>$sent));
	}
}
