var con = 1;
var RfStatus;
$(document).ready(function(){


  $("#savecode").click(function() {
    var button = $(this);
    button.prop("disabled", true);
    var codeType = $('#code_type').val().trim();
    var codeName = $('#codename').val().trim();
    var code = $('#data').val().trim();

    if (!codeType || !codeName || !code) {
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'error',
            title: 'Code Type, Code Name, and Code cannot be empty',
            showConfirmButton: false,
            timer: 3000
        });
        return;
    }



    var codeData = {
      CodeType: codeType,
      CodeName: codeName,
      Code: code
    };

    $.ajax({
      url: '/api/code',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(codeData),
      success: function (response) {
        console.log(response.success);
        if(response.success==1){
          Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'success',
            title: response.message,
            showConfirmButton: false,
            timer: 3000
        });
        $('#data').val('');
        $('#codename').val('');
        $('#message').text('');
        $('#extend').hide();
        }
        else{
          Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'error',
            title: 'Error creating code: ' + response.message,
            showConfirmButton: false,
            timer: 3000
        });
        }
        
      },
      error: function (xhr, status, error) {
        console.log(error);
      }
      
    });
    // // Disable the button
    // button.prop("disabled", true);

    // // Your click event logic here
    // console.log("This will be displayed only once.");

    // // Re-enable the button after 2-3 seconds (e.g., 2500 milliseconds)

    // $('#extend').hide();
    // button.prop("disabled", false);
    button.prop("disabled", false);
  });

  $("#rescan").click(function () {
    $("#scan").hide();
    $("#bdevices").html('');
    $("#loading").show();
    getDevices('autodiscover');
  });

  $('#load').click(function () {
    $("#scan").hide();
    $("#bdevices").html('');
    $("#loading").show();
    $.ajax(
      {
        url: 'devices/load',
        dataType: "json",
        success: function (data) {

          showDevices(data);
          localStorage.setItem('devices', JSON.stringify(data));


        },
        error: function (e) {

        }
      });

  });


  $('#save').click(function () {
    Table2Json();
  });

  if (localStorage.getItem('devices') == null)
    getDevices('autodiscover?freshscan=0');
  else
    showDevices(localStorage.getItem('devices'));

  $("#convert").click(function () {
    var hex = $("#hex").val();
    $("#base").val(hexToBase64(hex));

  });

  $("#learnir").click(function () {
    $("#progress").text("Waiting For Signal....");
    $("#scaning").show();
    $("#data-wrapper").hide();
    $("#data").val('');
    learnIr($("#device_type").val(), $("#device_ip").val(), $("#device_mac").val())
  });

  $("#learnrf").click(function () {
    $("#scaning").show();
    $("#data-wrapper").hide();
    $("#data").val('');
    RfStatus = setInterval(getRfStatus, 1000);
    learnrf($("#device_type").val(), $("#device_ip").val(), $("#device_mac").val())

  });

  $("#send").click(function () {
    $("#progress").text("Sending Command....");
    $("#scaning").show();
    var command = $("#data").val();
    sendcommand($("#device_type").val(), $("#device_ip").val(), $("#device_mac").val(), command)
  });

  $(document).on("click", ".actions", function (event) {
    var perifx = $(this).parent().attr('id');
    var device_name = $('#_name' + perifx).text();
    var device_type = $('#_type' + perifx).text();
    var device_ip = $('#_ip' + perifx).text();
    var device_mac = $('#_mac' + perifx).text();
    clearInterval(RfStatus);
    $("#scaning").hide();
    $("#device_name").val(device_name);
    $("#device_type").val(device_type);
    $("#device_ip").val(device_ip);
    $("#device_mac").val(device_mac);
    $("#modal-title").text(device_name + ' (' + device_ip + ')');
    $('#data').val('');
    $('#con').hide();
    $('#message').text('');

  });


  new ClipboardJS('#copydata');

  $('#sweeprf').click(function () {

    $.ajax(
      {
        url: 'rf/continue',
        dataType: "json",
        success: function (data) {
          $(this).hide();
        },
        error: function (e) {
          $(this).hide();
        }
      });

  });

  AutoPing();

});

function getDevices(url) {
  $.ajax(
    {
      url: url,
      dataType: "json",
      success: function (data) {
        localStorage.setItem('devices', JSON.stringify(data));
        showDevices(data);

      },
      error: function (e) {

      }
    });
  GetDeviceStatus();
}

function showDevices(data) {
  try {
    data = $.parseJSON(data);
  }
  catch (err) {
    getDevices();
  }
  i = 0;
  $.each(data, function (i, item) {
    var $tr = $('<tr>').append(
      $('<td id="_name_' + i + '" contenteditable="true">').text(item.name),
      $('<td id="_type_' + i + '">').text(item.type),
      $('<td id="_ip_' + i + '">').text(item.ip),
      $('<td id="_mac_' + i + '">').text(item.mac),
      $('<td id="_status_' + i + '" class="_no_json">'),
      $('<td id="_' + i + '" class="_no_json">').html('<button type="button" class="btn btn-primary  actions" data-toggle="modal" data-target="#modal-lg" title="Learn and Send IR/RF Codes">Actions</button>')

    );
    i++;
    $('#bdevices').append('<tr>' + $tr.wrap('<tr>').html() + '</tr>');
  });
  $("#loading").hide();
  $("#scan").show();
  GetDeviceStatus();
}

//IR Learn / Send

function learnIr(_type, _host, _mac) {
  $("#message").text('');
  $("#message").css('color', 'black');
  $.ajax(
    {

      url: 'ir/learn?type=' + _type + '&host=' + _host + '&mac=' + _mac,
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        if (data.success == 0) {
          $('#data').val(data.data);
          $("#message").text(data.message);
          $("#message").css('color', 'red');
        }
        else {
          $("#message").text(data.message);
          $("#message").css('color', 'green');
          $('#data').val(hexToBase64(data.data));
          $('#extend').show();
          $('#code_type').val(data.type);
        }
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
  $("#message").css('color', 'black').text('');
  _command = base64ToHex(_command);
  $.ajax(
    {
      url: 'command/send?type=' + _type + '&host=' + _host + '&mac=' + _mac + '&command=' + _command,
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        if (data.success == 0) {
          $('#data').val(data.data);
          $("#message").text(data.message);
          $("#message").css('color', 'red');
        }
        else {
          $("#message").text(data.message);
          $("#message").css('color', 'green');
          $('#data').val('');
        }
        $("#scaning").hide();
      },
      error: function (e) {

        $("#scaning").hide();
        $("#message").css('color', 'red');
        $("#message").text("Error sending Commad");
      }
    });

}

function learnrf(_type, _host, _mac) {
  $.ajax(
    {
      url: 'rf/learn?type=' + _type + '&host=' + _host + '&mac=' + _mac,
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        if (data.success == 0)
          $('#message').text(data.data);
        else {
          $('#data').val(hexToBase64(data.data));
          $('#message').text("RF Scan Completed Successfully");
          $('#code_type').val(data.type);
          $('#extend').show();
        }

        clearInterval(RfStatus);
        $("#scaning").hide();
        $("#con").hide();
        $("#data-wrapper").show();
      },
      error: function (e) {
        $('#data').val('Error occurred while scanning, please try again');
        clearInterval(RfStatus);
        $("#scaning").hide();
        $("#data-wrapper").show();
        $("#con").hide();
      }
    });

}

function getRfStatus() {
  $.ajax(
    {
      url: 'rf/status',
      dataType: "json",
      success: function (data) {
        data = $.parseJSON(data);
        $('#message').text(data._rf_sweep_message);

        if (data._rf_sweep_status == "True")
          $('#con').show();


      },
      error: function (e) {
        clearInterval(RfStatus);
        $('#message').text(data._rf_sweep_message);
      }
    });
}

function GetDeviceStatus() {
  $('td[id^="_ip_"]').each(function () {
    ip = $(this).text();
    status_id = '#_status_' + $(this).attr('id').match(/\d+/)[0];
    ping(ip, status_id);
  });
}

function ping(host, status_id) {

  $.ajax(
    {
      url: 'device/ping?host=' + host,
      success: function (data) {
        data = $.parseJSON(data);
        if (data.success == "1" && data.status == "online") {
          $(status_id).html("<span class='ok'>Online</span>");

        }
        else if (data.success == "1" && data.status == "offline") {
          $(status_id).html("<span class='error'>Offline</span>");

        }
        else {
          $(status_id).html("<span class='error'>Unknown</span>");
        }

      },
      error: function (e) {
        $(status_id).html("<span class='error'>Unknown</span>");
      }
    });

}

function AutoPing() {
  timer = setInterval(function () {
    GetDeviceStatus();
  }, 60000);
}




function Table2Json() {
  var devices = [];
  var $headers = $("._th_json");
  var $rows = $("#bdevices tr").each(function (index) {
    $cells = $(this).find("td:not(._no_json)");
    devices[index] = {};
    $cells.each(function (cellIndex) {

      devices[index][$($headers[cellIndex]).data('json')] = $(this).html();
    });
  });

  // Let's put this in the object like you want and convert to JSON (Note: jQuery will also do this for you on the Ajax request)
  var myObj = {};
  myObj.devices = devices;
  localStorage.setItem('devices', JSON.stringify(devices));
  $.ajax({
    type: "POST",
    url: '/devices/save',
    data: JSON.stringify(devices),
    success: function (data) {

    },
    error: function (data) {

    },
    dataType: 'json'
  });




}
