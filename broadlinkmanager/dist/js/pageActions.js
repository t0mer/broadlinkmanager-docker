window.onload = function() {
  showRandomCodeTab();
};

function showRandomCodeTab() {
  hideAll();
  $('#random-code-section').show();
  $('#tab1').addClass('active');
};


function showLivoloTab() {
    hideAll();
    $('#livolo-section').show();
    $('#tab2').addClass('active');
};

function showEnergenieTab() {
  hideAll();
  $('#energenie-section').show();
  generateEnergenie();
  $('#tab3').addClass('active');
};

function showRepeatsTab() {
  hideAll();
  $('#repeats-section').show();
  $('#tab4').addClass('active');
};

function hideAll() {
    $('#repeats-section').hide();
    $('#random-code-section').hide();
    $('#energenie-section').hide();
    $('#livolo-section').hide();
    $('#tab1, #tab2, #tab3, #tab4').removeClass('active');
}