
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
			:port => node[:eventsd_dashboard][:application][:port],
			:auth_system => node[:eventsd_dashboard][:application][:auth_system],
			:client_id => node[:eventsd_dashboard][:application][:client_id],
			:client_secret => node[:eventsd_dashboard][:application][:client_secret],
			:client_redirect => node[:eventsd_dashboard][:application][:client_redirect],
			:browser_path => browser_path,
			:db_file => node[:eventsd_dashboard][:application][:db_file]
			})
end
