# BroadlonkManager

BroadlonkManager is a [Flask](https://github.com/joemccann/dillinge) powerd, easy to use system that hepls you to work with Broadlink Devices.
With Broadlink manager you can:
- Scan your network for devices.
- Lean and Send IR or RF Codes
- Random generate RF Codes
- Change Repeats for Exisiting codes (IR/EF)

<br>
#### Credits:
=======

- [Matthew Garrett](https://github.com/mjg59)
  * [python-broadlink](https://github.com/mjg59/python-broadlink)
  * [broadlink_cli](https://github.com/mjg59/python-broadlink/tree/master/cli)
  
- [Dima Goltsman](https://github.com/dimagoltsman)
  * [Random-Broadlink-RM-Code-Generator](https://github.com/dimagoltsman/Random-Broadlink-RM-Code-Generator)

- [AdminLTE](https://adminlte.io/themes/AdminLTE/index2.html)

- [clipboard.js](https://clipboardjs.com/)

<br><br>


## Usage
### Run from hub

#### docker-compose from hub
```yaml
version: "3.6"
services:
  broadlonkmanager:
    image: techblog/broadlonkmanager
    network_mode: host
    container_name: broadlonkmanager
    restart: always
    restart: unless-stopped

```


# Screenshots
<br>
[![Device Listing](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Devices%20List.png?raw=true "Device Listing")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Devices%20List.png?raw=true "Device Listing")
<br>
[![RF Code Generator](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Random%20RF%20Code%20Generator.PNG?raw=true "RF Code Generator")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Random%20RF%20Code%20Generator.PNG?raw=true "RF Code Generator")
<br>
[![Learn and Send IR/RF Codes](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Learn%20and%20Send%20commands.png?raw=true "Learn and Send IR/RF Codes")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Learn%20and%20Send%20commands.png?raw=true "Learn and Send IR/RF Codes")
<br>
[![Base64 and Hex Conversation](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Hex-Base64-Hex%20converting.PNG?raw=true "Base64 and Hex Conversation")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Hex-Base64-Hex%20converting.PNG?raw=true "Base64 and Hex Conversation")
# Donation
<br>
If you find this project helpful, you can give me a cup of coffee :) 

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8CGLEHN2NDXDE)
