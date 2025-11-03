@rem https://www.guyrutenberg.com/2014/05/02/make-offline-mirror-of-a-site-using-wget/
@rem wget --mirror --convert-links --adjust-extension --page-requisites --no-parent http://example.org

@rem at a minimum, pass in website to mirror
wget -mkEpnp %*