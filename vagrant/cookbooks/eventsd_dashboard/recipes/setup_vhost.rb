
# install apache & php
package "httpd"

include_recipe "eventsd_dashboard::setup_php"

service "httpd" do
	supports :restart => true, :reload => true
	action :enable
end

template "/etc/httpd/conf.d/listen.conf" do
	source "apache_listen.conf.erb"
	mode 0644
	user "root"
	notifies :restart, "service[httpd]", :delayed
end

file "/etc/httpd/conf.d/welcome.conf" do
    action :delete
	notifies :restart, "service[httpd]", :delayed
end

# configure vhost
vhost = node[:eventsd_dashboard][:vhost]

template "/etc/httpd/conf.d/#{vhost[:name]}.conf" do
	source "vhost.conf.erb"
	variables ({
			:servername => vhost[:servername],
			:serveraliases => vhost[:serveraliases],
			:documentroot => vhost[:documentroot]
			})
	notifies :restart, "service[httpd]", :delayed
end

