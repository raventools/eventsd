
passwd_file = "#{node[:eventsd_dashboard][:vhost][:documentroot]}/.htpasswd"
hashed_password = Digest::SHA1.base64digest node[:eventsd_dashboard][:admin][:password]
file passwd_file do
	content <<-EOH
#{node[:eventsd_dashboard][:admin][:username]}:{SHA}#{hashed_password}
	EOH
end

file "#{node[:eventsd_dashboard][:vhost][:documentroot]}/.htaccess" do
	content <<-EOH
AuthType basic
AuthName "EventsD Browser'
AuthUserFile #{passwd_file}
Require valid-user

# block .htaccess and .htpasswd if default apache confi didn't
<Files ~ "^\.ht.*$">
	Order allow,deny
	Deny from all
</Files>
	EOH
end
