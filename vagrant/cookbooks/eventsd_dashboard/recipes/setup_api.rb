

include_recipe "eventsd_dashboard::setup_supervisord"

api_dir = "#{node[:eventsd_dashboard][:vhost][:documentroot]}/api"

template "/etc/supervisor.d/api.conf" do
    source "supervisor_program.conf.erb"
    variables ({
            :name => "api",
            :command => "node app.js",
            :directory => api_dir,
            :numprocs => 1,
            :user => "root"
            })
    notifies :restart, "service[supervisord]", :delayed
end
