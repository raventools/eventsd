bash "eventsd-npm-install" do
	cwd node[:eventsd_dashboard][:vhost][:documentroot]
	code <<-EOH 
	npm install
	EOH
end
