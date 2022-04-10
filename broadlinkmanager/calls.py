import subprocess, json, os, time
userid = None
nickname = None
loginsession = None
timestamp = None
token = None


data = str_pad(data, math.ceil(len(data) / 16) * 16, chr(0), STR_PAD_RIGHT)
# # if the script don't need output. 
# subprocess.call("php /path/to/your/script.php") 
 
def login():
    global userid, nickname, loginsession, timestamp, token
    proc = subprocess.Popen("php -r \"require 'calls.php';Auth('tomer.klein@gmail.com','tklk@2301');\"", shell=True, stdout=subprocess.PIPE) 
    response = proc.stdout.read()
    data = json.loads(response)

    userid = data["userid"]
    nickname = data ["nickname"]
    loginsession = data["loginsession"]
    timestamp = data["timestamp"]
    token = data["token"]

def GetBackupsList():
    global userid, nickname, loginsession, timestamp, token
    proc = subprocess.Popen("php -r \"require 'calls.php';GetListBackups('" + userid + "','" + loginsession + "','" + nickname + "');\"", shell=True, stdout=subprocess.PIPE) 
    response = proc.stdout.read()
    data = json.loads(response)
    print(data['list'][0])

def GetTimeStamp():
    return round(time.time() * 1000)


if __name__ == '__main__':
    login()
    GetBackupsList()