# php from rightscale-epel repo
package "php53u"
package "php53u-mysql"
package "php53u-mcrypt"
package "php53u-gd"
package "php53u-imap"
package "php53u-pecl-memcache"
package "php53u-mbstring"
package "php53u-pecl-imagick"
package "php53u-xml"
package "php53u-xmlrpc"

# PECL redis
redis_rpm="php53u-pecl-redis-2.2.4-1.x86_64.rpm"
remote_path="http://raven-opensource.s3.amazonaws.com/#{redis_rpm}"
local_path="/tmp/#{redis_rpm}"

remote_file local_path do
	source remote_path 
end

rpm_package "php53u-pecl-redis" do
    source local_path
end


# generates php conf overrides
template "/etc/php.d/custom.ini" do
	source "php.ini.erb"
	user "root"
	mode 0644
	variables ({
			:parameters => node[:eventsd_dashboard][:php_conf]
			})
end
