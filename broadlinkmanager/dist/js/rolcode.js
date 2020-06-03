
var startHeader = "0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c89";

function startDecode() {

  var b64 = $("#usercode").val();
  var hex = base64ToHex(b64)
  var hexArr = hex.split(" ");
  var strippedBroadlink = hexArr.slice(4);
  var normilized = normilizeArray(strippedBroadlink);
  var joined = normilized.join("");

  if(joined.indexOf(startHeader) == -1){
    throw new Error("cant find start header")
  }

  var codeStartIndex = joined.indexOf(startHeader) + startHeader.length;
  var code = joined.substr(codeStartIndex);
  var singleCode = code.substr(0, 66 * 4 );
  var singleSplitted = singleCode.match(/.{1,4}/g);
  var bitstream = reverse(singleSplitted.map(toBits).join("")); //reverse because code sent with LSB
  var encrypted = bitstream.substr(34)
  var fixed = bitstream.substr(0,34)

  // console.log(fixed.length + " " + encrypted.length)

  var rv = fixed.substr(0, 2);
  var buttons = fixed.substr(2, 4);
  var sn = fixed.substr(4, 28);

  $("#hex").val(hex);
  $("#singlehex").val(singleSplitted.join(" "));
  $("#fullbits").val(bitstream);
  $("#encpart").val(encrypted);
  $("#fixedpart").val(fixed);
  $("#rv").val(rv);
  $("#buttons").val(buttons);
  $("#sn").val(sn);

}

function toBits(byte) {
  if(byte == "0c18"){
    return "1";
  }
  if(byte == "180c"){
    return "0";
  }

  if(byte.substr(2, 2) == "00"){
    return "1";
  }

  throw new Error("cant decode " + byte)
}


function normilizeArray(arr) {
  return arr.map(normilizeByte)
}


function normilizeByte(byte) {
  if(is0c(byte)){
    return "0c";
  }else if(is18(byte)){
    return "18";
  }else if(is89(byte)){
    return "89";
  }

  else{
    return byte;
  }
}


function is0c(byte){
  var is = Array("0c", "0d", "0e", "0f", "0b", "0a", "09");
  return (is.indexOf(byte) > -1);
}

function is18(byte){
  var is = Array("19", "1a", "1b", "1c", "18", "17", "16");
  return (is.indexOf(byte) > -1);
}

function is89(byte){
  var is = Array("89", "8a", "8b", "8c", "88", "87", "86", "7c", "7d", "7e", "7b", "7a", "79");
  return (is.indexOf(byte) > -1);
}


function reverse(s){
  return s.split("").reverse().join("");
}
