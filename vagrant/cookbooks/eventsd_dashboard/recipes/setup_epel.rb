
template "/etc/yum.repos.d/Epel.repo" do
	source "Epel.repo.erb"
end

template "/etc/pki/rpm-gpg/RPM-GPG-KEY-EPEL" do
	source "RPM-GPG-KEY-EPEL.erb"
end

template "/etc/yum.repos.d/Rightscale-epel.repo" do
	source "Rightscale-epel.repo.erb"
end

template "/etc/pki/rpm-gpg/RPM-GPG-KEY-RightScale" do
	source "RPM-GPG-KEY-RightScale.erb"
end
