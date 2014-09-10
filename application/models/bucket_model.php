<?php

class Bucket_model extends CI_Model {

	public function __construct() {
		parent::__construct();
		$this->redis = new Redis();
		$this->redis->connect("127.0.0.1");
	}

	public function buckets($filter = "*") {
		$filter = self::keyName($filter);
		$keys = $this->redis->keys($filter);
		sort($keys);
		return array_map(function($a) {
					return str_replace("EventsD:","",$a);
				},$keys);
	}

	public function counters() {
		return $this->redis->zrevrangebyscore("EventsD:bucket_scores:sorted_set","+inf","-inf",array("withscores"=>true));
	}

	public function events($bucket,$limit) {
		$events = $this->redis->zrevrange(self::keyName($bucket),0,($limit - 1));
		return array_map(function($s) {
					return json_decode($s);
				},$events);
	}

	public function clear($bucket) {
		$name = self::keyName($bucket);
		$count = $this->redis->zcard($name);
		$this->redis->del($name);
		return (int)$count;
	}

	public static function keyName($bucket) {
		return "EventsD:$bucket";
	}
}
