
key_path = "/tmp/dashboard_deploy.key"
file key_path do
	content node[:eventsd_dashboard][:deploy][:key]
	action :create
	owner "root"
	mode 0600
end

wrapper_path = "/tmp/ssh_wrapper.sh"
template wrapper_path do
	user "root"
	source "ssh_wrapper.sh.erb"
	mode 0700
	variables ({
			:key_path => key_path
			})
end

package "git"

git node[:eventsd_dashboard][:vhost][:documentroot] do
	repository node[:eventsd_dashboard][:deploy][:repo]
	reference node[:eventsd_dashboard][:deploy][:branch]
	action :sync
	ssh_wrapper wrapper_path
end

include_recipe "eventsd_dashboard::setup_rightscale"
include_recipe "eventsd_dashboard::setup_supervisord"
