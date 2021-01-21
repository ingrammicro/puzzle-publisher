    chcon -R -t httpd_sys_content_t .
    chcon -R -t httpd_sys_rw_content_t  .
    chown -R apache:apache config
