
bash "flush-iptables" do
    code <<-EOH
        iptables -F
    EOH
end

bash "fix-dns" do
    code <<-EOH
        echo "options single-request-reopen" >> /etc/resolv.conf
    EOH
end

release_path = node[:eventsd_dashboard][:vhost][:documentroot]
eval(File.read("#{release_path}/deploy/before_symlink.rb"))
