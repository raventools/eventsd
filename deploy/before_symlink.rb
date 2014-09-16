if File.exists?("/vagrant") then
	run_as = "vagrant"
	run_env = {"HOME" => "/home/vagrant"}
else
	run_as = "root"
	run_env = {}
end

bash "eventsd-npm-install" do
	cwd "#{release_path}/eventsd"
	user run_as
	environment run_env
	code <<-EOH 
	npm install
	EOH
end

bash "api-npm-install" do
	cwd "#{release_path}/api"
	user run_as
	environment run_env
	code <<-EOH 
	npm install
	EOH
end
