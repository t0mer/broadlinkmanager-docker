# BroadlonkManager

BroadlonkManager is a [Flask](https://github.com/joemccann/dillinge) powerd, easy to use system that hepls you to work with Broadlink Devices.
With Broadlink manager you can:
- Scan your network for devices.
- Lean and Send IR or RF Codes
- Random generate RF Codes
- Change Repeats for Exisiting codes (IR/EF)


#### Credits:
=======

- [Matthew Garrett](https://github.com/mjg59)
  * [python-broadlink](https://github.com/mjg59/python-broadlink)
  * [broadlink_cli](https://github.com/mjg59/python-broadlink/tree/master/cli)
  
- [Dima Goltsman](https://github.com/dimagoltsman)
  * [Random-Broadlink-RM-Code-Generator](https://github.com/dimagoltsman/Random-Broadlink-RM-Code-Generator)

- [AdminLTE](https://adminlte.io/themes/AdminLTE/index2.html)

- [clipboard.js](https://clipboardjs.com/)


## Supported Devices and Models
 #### - sp2:  
          0x2711,  # SP2
          0x2719, 0x7919, 0x271a, 0x791a,  # Honeywell SP2
          0x2720,  # SPMini
          0x753e,  # SP3
          0x7D00,  # OEM branded SP3
          0x947a, 0x9479,  # SP3S
          0x2728,  # SPMini2
          0x2733, 0x273e,  # OEM branded SPMini
          0x7530, 0x7546, 0x7918,  # OEM branded SPMini2
          0x7D0D,  # TMall OEM SPMini3
          0x2736  # SPMiniPlus

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
Now open your browser and enter your docker container ip with port 7020:
http://docker-ip:7020

# Screenshots

[![Device Listing](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Devices%20List.png?raw=true "Device Listing")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Devices%20List.png?raw=true "Device Listing")

[![RF Code Generator](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Random%20RF%20Code%20Generator.PNG?raw=true "RF Code Generator")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Random%20RF%20Code%20Generator.PNG?raw=true "RF Code Generator")

[![Learn and Send IR/RF Codes](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Learn%20and%20Send%20commands.png?raw=true "Learn and Send IR/RF Codes")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Learn%20and%20Send%20commands.png?raw=true "Learn and Send IR/RF Codes")

[![Base64 and Hex Conversation](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Hex-Base64-Hex%20converting.PNG?raw=true "Base64 and Hex Conversation")](https://github.com/t0mer/broadlinkmanager-docker/blob/master/screenshots/Hex-Base64-Hex%20converting.PNG?raw=true "Base64 and Hex Conversation")
# Donation
<br>
If you find this project helpful, you can give me a cup of coffee :) 

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8CGLEHN2NDXDE)
