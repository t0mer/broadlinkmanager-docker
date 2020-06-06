var con = 1;
var RfStatus;
$(document).ready(function () {

  $("#rescan").click(function () {
    $("#scan").hide();
    $("#bdevices").html('');
    $("#loading").show();
    getDevices();
  });

  if (localStorage.getItem('devices') == null)
    getDevices();
  else
    showDevices(localStorage.getItem('devices'));

  $("#convert").click(function () {
    var hex = $("#hex").val();
    $("#base").val(hexToBase64(hex));

  });

  $("#learnir").click(function () {
    $("#scaning").show();
    $("#data-wrapper").hide();
    $("#data").val('');
    learnIr($("#device_type").val(), $("#device_ip").val(), $("#device_mac").val())
  });

  $("#learnrf").click(function () {
    RfStatus = setInterval(getRfStatus, 1000);
  });


  $("#send").click(function () {
    var command = $("#data").val();
    sendcommand($("#device_type").val(), $("#device_ip").val(), $("#device_mac").val(), command)
  });



  $(document).on("click", ".actions", function (event) {
    // alert($(this).parent().attr('id'));
    var perifx = $(this).parent().attr('id');
    var device_name = $('#_name' + perifx).text();
    var device_type = $('#_type' + perifx).text();
    var device_ip = $('#_ip' + perifx).text();
    var device_mac = $('#_mac' + perifx).text();
    $("#scaning").hide();
    $("#device_name").val(device_name);
    $("#device_type").val(device_type);
    $("#device_ip").val(device_ip);
    $("#device_mac").val(device_mac);
    $("#modal-title").text(device_name + ' (' + device_ip + ')');
    $('#data').val('');
  });


  new ClipboardJS('#copydata');

});

function getDevices() {
  $.ajax(
    {
      url: '/discover',
      dataType: "json",
      success: function (data) {
        localStorage.setItem('devices', data)
        showDevices(data);

      },
      error: function (e) {

      }
    });
}


function showDevices(data) {
  data = $.parseJSON(data);
  i = 0;
  $.each(data, function (i, item) {
    var $tr = $('<tr>').append(
      $('<td id="_name_' + i + '">').text(item.name),
      $('<td id="_type_' + i + '">').text(item.type),
      $('<td id="_ip_' + i + '">').text(item.ip),
      $('<td id="_mac_' + i + '">').text(item.mac),
      $('<td id="_' + i + '">').html('<button type="button" class="btn btn-primary  actions" data-toggle="modal" data-target="#modal-lg" title="Learn and Send IR/RF Codes">Actions</button>')

    );
    i++;
    $('#bdevices').append('<tr>' + $tr.wrap('<tr>').html() + '</tr>');
  });
  $("#loading").hide();
  $("#scan").show();
}

//IR Learn / Send

function learnIr(_type, _host, _mac) {

  $.ajax(
    {
      url: 'ir/learn?type=' + _type + '&host=' + _host + '&mac=' + _mac,
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        if (data.data == "No Data Recived")
          $('#data').val(data.data);
        else
          $('#data').val(hexToBase64(data.data));

        $("#scaning").hide();
        $("#data-wrapper").show();
      },
      error: function (e) {
        $('#data').val('Error occurred while scanning, please try again');
        $("#scaning").hide();
        $("#data-wrapper").show();
      }
    });

}

function sendcommand(_type, _host, _mac, _command) {
  _command = base64ToHex(_command);
  $.ajax(
    {
      url: 'command/send?type=' + _type + '&host=' + _host + '&mac=' + _mac + '&command=' + _command,
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        alert(data.data);
      },
      error: function (e) {
        alert(err);
      }
    });

}



function getRfStatus() {
  $.ajax(
    {
      url: '/rf/status',
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        console.log(data);
      },
      error: function (e) {
        clearInterval(RfStatus);
      }
    });
}

