<?php

class EventsD
{
	public static $host = "eventsd.r4v3n5e0.com";
	public static $port = 6969;
	public static $fragment_size = "1400";

	/**
	  * Sends backtrace event
	  *
	  * @param string $bucket the event bucket
	  **/
	public static function backtrace($bucket)
	{
		self::send($bucket,array(),array("backtrace"=>true));
	}

	/**
	  * Sends generic event
	  *
	  * @param string $bucket the event bucket
	  * @param array|object $data custom event data to log
	  * @param array|object $params parameters to include other optional generic event data
	  **/
	public static function send($bucket, $data=array(), $params=array())
	{
		if(empty($bucket)) return;

		$data = (object)$data;
		$params = (object)$params;

		$event['bucket'] = $bucket;
		$event['datetime'] = date("Y-m-d H:i:s");
		/**
		 * add these things:
		 * memory usage
		 * instance name
		 * public ip
		 * ... whatever rightscale/aws info we can get on the current instance
		 */


		if(!empty($data)) $event['data'] = $data;

		$params = (object)$params;
		if(isset($params->backtrace) && $params->backtrace === true) {
			$event['backtrace'] = debug_backtrace();
		}
		if(isset($params->servervars) && $params->servervars === true) {
			$event['servervars'] = $_SERVER;
		}
		if(isset($params->requestvars) && $params->requestvars === true) {
			$event['requestvars'] = $_REQUEST;
		}
		if(isset($params->getvars) && $params->getvars === true) {
			$event['getvars'] = $_GET;
		}
		if(isset($params->postvars) && $params->postvars === true) {
			$event['postvars'] = $_POST;
		}
		if(isset($params->instance_info) && $params->instance_info === true) {
			$event['instance'] = self::collect_instance_info();
		}

        try {
			$data_array = self::encode_and_fragment($event);
            $host = self::$host;
            $port = self::$port;
            $fp = fsockopen("udp://$host", $port, $errno, $errstr);
            if (! $fp) { return false; }
			foreach($data_array as $msg) {
				fwrite($fp, $msg);
			}
            fclose($fp);
        } catch (Exception $e) {
			/* fucks caught: 1, fucks given: 0 */

			return false;
        }

        /* sometimes, we care about the result. just not now. or most times. */
        return true;
	}

	/**
	 * json_encode()s the event object, and if it exceeds self::$fragment_size, 
	 * fragments it
	 */
	private static function encode_and_fragment($ev_obj)
	{
		$encoded = json_encode($ev_obj);
		if(strlen($encoded) > self::$fragment_size) {
			$hash = uniqid()."_".sprintf("%010s",rand());
			$index = 1;
			$pieces = ceil(strlen($encoded) / self::$fragment_size);
			$fragments = array();

			// do/whiles are so awesome
			do {
				$part = substr($encoded,0,self::$fragment_size);
				$encoded = substr_replace($encoded,null,0,self::$fragment_size);

				$msg = new StdClass();
				$msg->hash = $hash;
				$msg->index = $index++;
				$msg->pieces = $pieces;
				$msg->body = $part;

				$fragments[] = json_encode($msg);	
			} while(strlen($encoded) > 0);

			return $fragments;
		} else {
			// small enough, don't need to fragment
			return array($encoded);
		}
	}

	private static function collect_instance_info()
	{
		$info = new StdClass();
		if(($type = self::get_metadata("instance-type")) !== false) {
			$info->type = $type;
			$info->public = self::get_metadata("public-ipv4");
			$info->local = self::get_metadata("local-ipv4");
			$info->id = self::get_metadata("instance-id");
			return $info;
		}
		return null;
	}

	private static function get_metadata($node)
	{
		$path = "/var/spool/ec2/meta-data/{$node}";
		if(is_file($path)) {
			return file_get_contents($path);
		} else {
			return false;
		}
	}
}
