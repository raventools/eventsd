# vhost
default[:eventsd_dashboard][:vhost][:name] = "eventsddashboard"
default[:eventsd_dashboard][:vhost][:servername] = "eventsddashboard.site"
default[:eventsd_dashboard][:vhost][:serveraliases] = []
default[:eventsd_dashboard][:vhost][:documentroot] = "/home/webapps/eventsddashboard"

# deploy
default[:eventsd_dashboard][:deploy][:repo] = "git@github.com:raventools/eventsd-dashboard.git"
default[:eventsd_dashboard][:deploy][:branch] = "master"
default[:eventsd_dashboard][:deploy][:key] = ""

# supervisord
default[:eventsd_dashboard][:supervisord][:username] = "super"
default[:eventsd_dashboard][:supervisord][:password] = "" # blank password disables auth
default[:eventsd_dashboard][:supervisord][:port] = "9110"

# php config tuning
default[:eventsd_dashboard][:php_conf] = [
	"log_errors = On",
	"error_log = /var/log/httpd/php_error_log",
	"date.timezone = US/Eastern"
	]

# attachments
default[:eventsd_dashboard][:tmp_dir] = "/tmp/attachments"
default[:eventsd_dashboard][:attachment_url] = "http://raven-opensource.s3.amazonaws.com"

# application / api
default[:eventsd_dashboard][:application][:port] = "8000"
default[:eventsd_dashboard][:application][:auth_system] = "open"
default[:eventsd_dashboard][:application][:client_id] = ""
default[:eventsd_dashboard][:application][:client_secret] = ""
default[:eventsd_dashboard][:application][:client_redirect] = ""
default[:eventsd_dashboard][:application][:db_file] = "database.sqlite"
