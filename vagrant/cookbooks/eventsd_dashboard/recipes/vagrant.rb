
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

include_recipe "eventsd_dashboard::install_supervisord"
