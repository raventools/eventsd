
include_recipe "eventsd_dashboard::setup_supervisord"

eventsd_dir = "#{node[:eventsd_dashboard][:vhost][:documentroot]}/eventsd"

template "/etc/supervisor.d/eventsd.conf" do
    source "supervisor_program.conf.erb"
    variables ({
            :name => "eventsd",
            :command => "node eventsd.js",
            :directory => eventsd_dir,
            :numprocs => 1,
            :user => "root"
            })
    notifies :restart, "service[supervisord]", :delayed
end

template "/etc/supervisor.d/eventsd_pubsub.conf" do
    source "supervisor_program.conf.erb"
    variables ({
            :name => "eventsd_pubsub",
            :command => "node pubsub.js",
            :directory => eventsd_dir,
            :numprocs => 1,
            :user => "root"
            })
    notifies :restart, "service[supervisord]", :delayed
end
