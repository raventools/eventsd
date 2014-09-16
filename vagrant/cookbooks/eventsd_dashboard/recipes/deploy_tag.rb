
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
end

include_recipe "eventsd_dashboard::setup_supervisord"
include_recipe "eventsd_dashboard::setup_application"
