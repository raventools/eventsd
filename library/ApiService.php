<?php

/**
 * Class ApiService
 *
 * Yes, I realize this is devoid of try/catches and other error handling. That's cuz this is getting rewritten
 * in Node. CI is too big just for a fairly lightweight API (imo).
 */
class ApiService extends Redis {
	protected $ignore = array('EventsD:bucket_scores:sorted_set');

	public function __construct() {
		$this->connect("127.0.0.1");
	}

	public function delete($bucket) {
		return $this->del(self::keyName($bucket));
	}

	public function buckets() {
		$keys = $this->keys("*");
		$hits = $this->counters();

		foreach ($keys as $key) {
			if (in_array($key, $this->ignore)) {
				continue;
			}

			$latest = $this->zRevRange($key,0,1);
			$datetime = false;

			if (is_array($latest) && !empty($latest[0])) {
				$bucket_data = json_decode($latest[0]);
				if (is_object($bucket_data)) {
					$datetime = $bucket_data->datetime;
				}
			}

			$key_data[] = array(
				'name' => self::bucketName($key),
				'hits' => (array_key_exists(self::bucketName($key), $hits)) ? $hits[self::bucketName($key)] : 0,
				'time' => strtotime($datetime) * 1000
			);
		}
		return $key_data;
	}

	public function events($bucket, $limit = 1000) {
		$events = $this->zrevrange(self::keyName($bucket),0,($limit - 1));

		$table_data = array();
		$hour_data = array();

		foreach(range(0,23) as $hour) {
			$hour_data[$hour] = array(
				'count' => 0,
				'display' => ($hour < 9) ? '0'.$hour : (string) $hour
			);
		}
		foreach($events as $ev) {
			$event = json_decode($ev, true);
			$date = date('Y-m-d', strtotime($event['datetime']));
			if (!isset($month_data[$date])) {
				$month_data[$date] = 0;
			}
			$month_data[$date]++;

			$hour = date('H', strtotime($event['datetime']));
			$hour_data[(int)$hour]['count']++;

			$table_data[] = array(
				'name' => $bucket,
				'size' => $this->getSize($ev),
				'time' => strtotime($event['datetime']) * 1000,
				'data' => $event['data']
			);
		}

		return array(
			'month_data' => array_reverse($month_data),
			'hour_data' => $hour_data,
			'table_data' => $table_data
		);
	}

	public function getSize($string) {
		$size = mb_strlen($string, 'latin1');
		if($size >= 1024) {
			$size = round($size / 1024, 2).' KB';
		}
		else {
			$size = $size.' bytes';
		}
		return $size;
	}

	public function counters() {
		return $this->zrevrangebyscore(
			"EventsD:bucket_scores:sorted_set",
			"+inf",
			"-inf",
			array(
				"withscores" => true
			)
		);
	}

	public static function bucketName($key) {
		return str_replace("EventsD:", "", $key);
	}

	public static function keyName($bucket) {
		return "EventsD:$bucket";
	}
}