
# create attachments dir
directory node[:eventsd_dashboard][:tmp_dir] do
	action :create
	recursive true
end

include_recipe "yum-epel"

package "nodejs"
package "npm"

# configures epel and epel-rightscale repos
include_recipe "eventsd_dashboard::setup_epel"

# installs and starts redis
include_recipe "eventsd_dashboard::setup_redis"

# installs and starts supervisord
include_recipe "eventsd_dashboard::setup_supervisord"

# disable ipv6
file "/etc/modprobe.d/ipv6.conf" do
	content <<-EOH
	alias ipv6 off
	alias net-pf-10 off
	EOH
	owner "root"
	mode 0644
end
