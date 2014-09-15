
passwd_file = "#{node[:eventsd_dashboard][:vhost][:documentroot]}/.htpasswd"

file passwd_file do
	content `htpasswd -nbs #{node[:eventsd_dashboard][:admin][:username]} #{node[:eventsd_dashboard][:admin][:password]}`.strip
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
