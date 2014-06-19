
# configures epel and epel-rightscale repos
include_recipe "eventsd_dashboard::setup_epel"

# installs and configures httpd; sets up vhost
include_recipe "eventsd_dashboard::setup_vhost"

# create repo dir for both vagrant and production
directory node[:eventsd_dashboard][:vhost][:documentroot] do
	action :create
	recursive true
end

# create attachments dir
directory node[:eventsd_dashboard][:tmp_dir] do
	action :create
	recursive true
end

# disable ipv6
file "/etc/modprobe.d/ipv6.conf" do
	content <<-EOH
	alias ipv6 off
	alias net-pf-10 off
	EOH
	owner "root"
	mode 0644
end
