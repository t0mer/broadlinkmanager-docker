*Please :star: this repo if you find it useful*

<p align="left"><br>
<a href="https://www.paypal.com/paypalme/techblogil?locale.x=he_IL" target="_blank"><img src="http://khrolenok.ru/support_paypal.png" alt="PayPal" width="250" height="48"></a>
</p>




# BroadlinkManager

BroadlinkManager is a [Flask](https://flask.palletsprojects.com/en/1.1.x/) powerd, easy to use system that hepls you to work with Broadlink Devices.
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
 #### sp2:  
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
   
### rm:
     0x2712,  # RM2
     0x2737,  # RM Mini
     0x273d,  # RM Pro Phicomm
     0x2783,  # RM2 Home Plus
     0x277c,  # RM2 Home Plus GDT
     0x272a,  # RM2 Pro Plus
     0x2787,  # RM2 Pro Plus2
     0x279d,  # RM2 Pro Plus3
     0x27a9,  # RM2 Pro Plus_300
     0x278b,  # RM2 Pro Plus BL
     0x2797,  # RM2 Pro Plus HYC
     0x27a1,  # RM2 Pro Plus R1
     0x27a6,  # RM2 Pro PP
     0x278f,  # RM Mini Shate
     0x27c2,  # RM Mini 3
     0x27d1,  # new RM Mini3
     0x27de  # RM Mini 3 (C)
    
### rm4:
    0x51da,  # RM4 Mini
    0x5f36,  # RM Mini 3
    0x6026,  # RM4 Pro
    0x6070,  # RM4c Mini
    0x61a2,  # RM4 Pro
    0x610e,  # RM4 Mini
    0x610f,  # RM4c
    0x62bc,  # RM4 Mini
    0x62be  # RM4c Mini
           
### a1:
    0x2714,  # A1
        
### mp1:
    0x4EB5,  # MP1
    0x4EF7  # Honyar oem mp1
            
### hysen:
    0x4EAD,  # Hysen controller

### S1C:
    0x2722   # S1 (SmartOne Alarm Kit)

### dooya:
    0x4E4D,  # Dooya DT360E (DOOYA_CURTAIN_V2)
        
### bg1:
    0x51E3, # BG Electrical Smart Power Socket
        
### lb1:
    0x60c8,    # RGB Smart Bulb

## Usage
### Run from hub

#### docker-compose from hub
```yaml
version: "3.6"
services:
  broadlinkmanager:
    image: techblog/broadlinkmanager
    network_mode: host
    container_name: broadlinkmanager
    restart: always
    restart: unless-stopped
    volumes:
      - ./broadlinkmanager:/opt/broadlinkmanager/data

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
