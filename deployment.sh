shopt -s extglob
rm -rf !("deployment.sh")
git clone https://github.com/Infinite-Compute/b4d-speedtest

if dpkg -s apache2 &> /dev/null; then
    echo "Apache2 is installed."

    # Now we need to copy the folders to /var/www/html or the apache2 folder
    cp -r b4d-speedtest/assets /var/www/html
    cp -r b4d-speedtest/index.html /var/www/html
    cp -r b4d-speedtest/styles /var/www/html
    cp -r b4d-speedtest/scripts /var/www/html
    cp -r b4d-speedtest/styles/main_style.css /var/www/html

    echo "Done copying to /var/www/html. Initialization complete."

    sudo service apache2 start
else
    echo "Apache2 is not installed."
fi
