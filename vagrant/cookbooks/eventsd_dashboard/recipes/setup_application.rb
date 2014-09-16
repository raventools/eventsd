
include_recipe "eventsd_dashboard::setup_supervisord"

application_dir = "#{node[:eventsd_dashboard][:vhost][:documentroot]}/application"

template "/etc/supervisor.d/application.conf" do
    source "supervisor_program.conf.erb"
    variables ({
            :name => "application",
            :command => "node app.js",
            :directory => application_dir,
            :numprocs => 1,
            :user => "root"
            })
    notifies :restart, "service[supervisord]", :delayed
end

browser_path = "#{application_dir}/public"
template "#{application_dir}/app_config.json" do
	source "app_config.json.erb"
	variables ({
			:api_port => node[:eventsd_dashboard][:application][:api_port],
			:browser_port => node[:eventsd_dashboard][:application][:browser_port],
			:api_key => node[:eventsd_dashboard][:application][:api_key],
			:browser_path => browser_path,
			:browser_user => node[:eventsd_dashboard][:admin][:username],
			:browser_pass => node[:eventsd_dashboard][:admin][:password],
			:db_file => node[:eventsd_dashboard][:application][:db_file]
			})
end

template "#{browser_path}/assets/js/angular/config.js" do
	source "config.js.erb"
	variables ({
			:api_host => node[:eventsd_dashboard][:vhost][:servername],
			:api_port => node[:eventsd_dashboard][:application][:api_port],
			:api_key => node[:eventsd_dashboard][:application][:api_key]
			})
end
