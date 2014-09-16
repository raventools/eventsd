bash "eventsd-npm-install" do
	cwd "#{release_path}/eventsd"
	code <<-EOH 
	npm install
	EOH
end

bash "api-npm-install" do
	cwd "#{release_path}/api"
	code <<-EOH 
	npm install
	EOH
end
