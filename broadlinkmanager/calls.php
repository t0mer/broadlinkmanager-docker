<?php
$userid;
$token;
$timestamp;
$loginsession;
$nickname;
$id;



function aes128_cbc_encrypt($key, $data, $iv) { $data = str_pad($data, ceil(strlen($data) / 16) * 16, chr(0), STR_PAD_RIGHT); return openssl_encrypt($data, 'AES-128-CBC', $key, OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, $iv);
}

function aes128_cbc_decrypt($key, $data, $iv) { return rtrim(openssl_decrypt($data, 'AES-128-CBC', $key, OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, $iv), chr(0));
}

function byte($array){

		return implode(array_map("chr", $array));
	}


function get_token($timestamp) { return md5(base64_encode(sha1("\x42\x72\x6F\x61\x64\x6C\x69\x6E\x6B\x3A290".$timestamp,true)));
	}


function str2hex_array($str){

		$str_arr = str_split(strToUpper($str), 2); $str_hex = array(); for ($i=0; $i < count($str_arr); $i++){ $ord1 = ord($str_arr[$i][0])-48; $ord2 = ord($str_arr[$i][1])-48; if ($ord1 > 16) $ord1 = $ord1 - 7; if ($ord2 
			> 16) $ord2 = $ord2 - 7; $str_hex[$i] = $ord1 * 16 + $ord2;
		}
		return $str_hex;
	}

function geturi($host, $post, $headers, $request = 0) {

		$url = "https://".$host.$post; $timeout = 7; $curl = curl_init(); curl_setopt($curl, CURLOPT_URL, $url); if (preg_match("/\bPOST\b/i", $headers[0])) curl_setopt($curl, CURLOPT_POST, true); curl_setopt($curl, 
		CURLOPT_HTTPHEADER, $headers); curl_setopt($curl, CURLOPT_RETURNTRANSFER, true); curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, $timeout); curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, FALSE); curl_setopt($curl, 
		CURLOPT_SSL_VERIFYPEER, FALSE); if ($request) curl_setopt($curl, CURLOPT_POSTFIELDS, $request); $result["msg"] = curl_exec($curl); $result["error"] = curl_errno($curl); if ($result["error"]) {
			$result["msg"] = curl_error($curl);
		}
		return $result;
	}



function Auth($email = "", $password = "") {
    
global $userid, $token,$timestamp,$loginsession,$nickname;
		if (($email === "") || (strlen($password) < 6)) { $result["error"] = -1005; $result["msg"] = "Data Error"; 
            echo(1);
            return $result;
		}

		$authiv = array(-22, -86, -86, 58, -69, 88, 98, -94, 25, 24, -75, 119, 29, 22, 21, -86); $password = sha1($password."4969fj#k23#"); $data_str = str_pad('{"email":"'.$email.'","password":"'.$password.'"}', 112, 
		"\0"); $token = md5('{"email":"'.$email.'","password":"'.$password.'"}'."xgx3d*fe3478\$ukx");
		


		$host = "account.ibroadlink.com"; $post = "/v1/account/login/api?email=".$email."&password=".$password."&serialVersionUID=2297929119272048467"; $headers = array( "GET ".$post." HTTP/1.1", "language: zh_cn", 
			"serialVersionUID: -6225108491617746123", "Host: ".$host, "Connection: Keep-Alive"
		); $result = geturi($host, $post, $headers); if ($result["error"]) { return $result;
		}
		$result = json_decode($result["msg"], true);

		if (($result["error"] != 0) || ($result["msg"] != "ok")) { return $result;
		}

		$timestamp = $result["timestamp"]; $key = byte(str2hex_array($result["key"])); $request = aes128_cbc_encrypt($key, $data_str, byte($authiv)); $post = "/v2/account/login/info"; $host = "secure.ibroadlink.com"; 

                $headers = array(
			"POST ".$post." HTTP/1.1", "Timestamp: ".$timestamp, "Token: ".$token, "language: zh_cn", "serialVersionUID: -6225108491617746123", "Content-Length: 112", "Host: ".$host, "Connection: Keep-Alive", "Expect: 
			100-continue"
		); $result = geturi($host, $post, $headers, $request); if ($result["error"]) { return $result;
		}
        
             
        
        $data = json_decode($result["msg"],true);
                $loginsession = $data["loginsession"];
                $nickname = $data["nickname"];
                $userid = $data["userid"];
        //    echo json_encode($result);

           
        $result = array("loginsession"=>$data["loginsession"], "nickname"=>$data['nickname'],"userid"=>$data["userid"],"timestamp"=>$timestamp,"token"=>$token);
        echo json_encode($result);
	}



function GetUserInfo() {
global $userid, $token,$timestamp,$loginsession,$nickname;


		$post = "/v1/account/userinfo/get";
		$host = "account.ibroadlink.com";
		$headers = array(
			"GET ".$post." HTTP/1.1",
			"LOGINSESSION: ".$loginsession,
			"USERID: ".$userid,
			"language: zh_cn",
			"serialVersionUID: -6225108491617746123",
			"Host: ".$host,
			"Connection: Keep-Alive"
		);
		$result = geturi($host, $post, $headers);
		if ($result["error"]) {
			return $result;
		}
		return $result;
	}



function GetListBackups($userid,$loginsession,$nickname) {
// global $userid, $token,$timestamp,$loginsession,$nickname;

		$timestamp = round(microtime(true) * 1000);
		$post = "/rest/1.0/backup?method=list&user=".$nickname."&id=".$userid."&timestamp=".$timestamp."&token=".get_token($timestamp);
		$host = "ebackup.ibroadlink.com";
		$headers = array(
			"GET ".$post." HTTP/1.1",
			"accountType: bl",
			"reqUserId: ".$userid,
			"reqUserSession: ".$loginsession,
			"serialVersionUID: -855048957473660878",
			"Host: ".$host,
			"Connection: Keep-Alive"
		);
                // echo("         ".$post."    ");
        	$result = geturi($host, $post, $headers, 0);
		if ($result["error"]) {
			return $result;
		}
		$result = json_decode($result["msg"], true);
		$result["error"] = 0;
                echo json_encode($result);
		return $result;
	}


function GetTimeStemp(){
echo round(microtime(true) * 1000);
}


// echo Auth(getenv("email"),getenv("password"));
// GetUserInfo();
// GetListBackups();
#GetTimeStemp();


?>
