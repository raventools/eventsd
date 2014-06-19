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

# generates php conf overrides
template "/etc/php.d/custom.ini" do
	source "php.ini.erb"
	user "root"
	mode 0644
	variables ({
			:parameters => node[:eventsd_dashboard][:php_conf]
			})
end
