# puppeteer-cluster-spike
To run the server: 
1. npm install
2. node app-cluster-boreas.js

Url to generate PDF:  http://localhost:3200/pdf?target=https://app.k8s.development.boreas.cloud
PDF is generated for the "target" request param

Tools used to do concurrent testing: Apache benchmark and/or JMeter

Using Apache benchmark:
1) Download https://www.apachelounge.com/download/VS16/binaries/httpd-2.4.50-win64-VS16.zip
2) Extract the zip
3) Add the <AB-path>/bin to the PATH environment variable
4) Open command prompt, type "ab". Check that the command works
5) Command to test: ab -n 20 -c 10  http://localhost:3200/pdf?target=https://app.k8s.development.boreas.cloud

Using JMeter:
1) Install JMeter
2) Run JMeter.bat to open JMeter in GUI mode
3) Open the ./JMeter/puppeteer-cluster.jmx in JMeter



