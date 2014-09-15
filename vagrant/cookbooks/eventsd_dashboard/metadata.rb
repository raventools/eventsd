name             'eventsd_dashboard'
maintainer       'YOUR_COMPANY_NAME'
maintainer_email 'YOUR_EMAIL'
license          'All rights reserved'
description      'Installs/Configures eventsd_dashboard'
long_description IO.read(File.join(File.dirname(__FILE__), 'README.md'))
version          '0.1.0'

depends "yum"
depends "yum-epel"

recipe "eventsd_dashboard::default", "includes all needed recipes to bootstrap the dashboard"
recipe "eventsd_dashboard::deploy_tag", "deploys/updates application"
recipe "eventsd_dashboard::setup_vhost", "installs and configures apache and php"
recipe "eventsd_dashboard::setup_php", "installs and configures apache and php"
recipe "eventsd_dashboard::setup_epel", "includes redhat and rightscale's epel repositories"
recipe "eventsd_dashboard::setup_supervisord", "configures supervisord authentication parameters in app"
recipe "eventsd_dashboard::setup_htauth", "sets up basic http authentication"

attribute "eventsd_dashboard",
	:display_name => "eventsd Dashboard",
	:type => "hash"

attribute "eventsd_dashboard/vhost/name",
    :display_name => "Vhost Name",
    :description => "Vhost Name",
    :required => "recommended",
    :type => "string",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::setup_vhost"]

attribute "eventsd_dashboard/vhost/servername",
    :display_name => "Vhost ServerName",
    :description => "Vhost ServerName",
    :required => "recommended",
    :type => "string",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::setup_vhost"]

attribute "eventsd_dashboard/vhost/serveraliases",
    :display_name => "Vhost ServerAliases",
    :description => "Vhost ServerAliases",
    :required => "recommended",
    :type => "array",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::setup_vhost"]

attribute "eventsd_dashboard/vhost/documentroot",
    :display_name => "Vhost DocRoot",
    :description => "Vhost DocRoot",
    :required => "recommended",
    :type => "string",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::setup_vhost"]

attribute "eventsd_dashboard/supervisord/username",
    :display_name => "Supervisord username",
    :description => "Supervisord username",
    :required => "recommended",
    :type => "string",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::setup_supervisord"]

attribute "eventsd_dashboard/supervisord/password",
    :display_name => "Supervisord password",
    :description => "Supervisord password",
    :required => "recommended",
    :type => "string",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::setup_supervisord"]

attribute "eventsd_dashboard/supervisord/port",
    :display_name => "Supervisord port",
    :description => "Supervisord port",
    :required => "recommended",
    :type => "string",
	:default => "9110",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::setup_supervisord"]

attribute "eventsd_dashboard/deploy/repo",
    :display_name => "Git Repository URL",
    :description => "Git Repository URL",
    :required => "recommended",
    :type => "string",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::deploy_tag"]

attribute "eventsd_dashboard/deploy/branch",
    :display_name => "Git Branch",
    :description => "Git Branch",
    :required => "recommended",
    :type => "string",
	:default => "master",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::deploy_tag"]

attribute "eventsd_dashboard/deploy/key",
    :display_name => "Git Deploy Key",
    :description => "Git Deploy Key",
    :required => "optional",
    :type => "string",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::deploy_tag"]

attribute "eventsd_dashboard/admin/username",
    :display_name => "Admin Username",
    :description => "Admin Username",
    :required => "optional",
    :type => "string",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::deploy_tag","eventsd_dashboard::setup_htauth"]

attribute "eventsd_dashboard/admin/password",
    :display_name => "Admin Password",
    :description => "Admin Password",
    :required => "optional",
    :type => "string",
    :recipes => ["eventsd_dashboard::default","eventsd_dashboard::deploy_tag","eventsd_dashboard::setup_htauth"]
