
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

app_path = node[:eventsd_dashboard][:deploy][:root]
deploy app_path do
    provider Chef::Provider::Deploy::Revision
    repo node[:eventsd_dashboard][:deploy][:repo]
    revision node[:eventsd_dashboard][:deploy][:branch]
    ssh_wrapper wrapper_path
    symlink_before_migrate      ({})
    symlinks                    ({})
    purge_before_symlink        ([])
    create_dirs_before_symlink  ([])
	notifies :restart, "service[supervisord], :delayed
end

include_recipe "eventsd_dashboard::setup_supervisord"

# installs and starts eventsd and pubsub
include_recipe "eventsd_dashboard::setup_eventsd"

# installs and starts node httpd
include_recipe "eventsd_dashboard::setup_application"
