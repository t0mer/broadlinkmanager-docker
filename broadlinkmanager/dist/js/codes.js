$(document).ready(function () {
    var table = $('#codesTable').DataTable();

    // Load data into the table
    $.ajax({
        url: '/api/codes/', // Change this to your API endpoint
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            data.forEach(function (item) {
                table.row.add([
                    item.CodeName,
                    item.CodeType,
                    item.Code,
                    '<button class="edit">✏️</button><button class="save" style="display:none;">💾</button><button class="delete">❌</button>',
                    '<span style="display:none;">' + item.CodeId + '</span>'
                ]).draw(false);
            });
        },
        error: function (xhr, status, error) {
            Swal.fire({
                toast: true,
                position: 'top',
                customClass: {
                    toast: 'swal2-toast-top'
                },
                icon: 'error',
                title: 'Error loading data: ' + xhr.responseText,
                showConfirmButton: false,
                timer: 3000
            });
        }
    });

    // Handle edit button
    $('#codesTable').on('click', '.edit', function () {
        var row = $(this).closest('tr');
        row.find('td:not(:last-child)').each(function (index) {
            var cell = $(this);
            if (index < 3) { // Skip the last cell (actions)
                var content = cell.text();
                cell.html('<input type="text" value="' + content + '">');
            }
        });
        row.find('.edit').hide();
        row.find('.save').show();
    });

    // Handle save button
    $('#codesTable').on('click', '.save', function () {
        var row = $(this).closest('tr');
        var data = {
            CodeId: row.find('td:eq(4) span').text(),
            CodeName: row.find('td:eq(0) input').val(),
            CodeType: row.find('td:eq(1) input').val(),
            Code: row.find('td:eq(2) input').val()
        };

        $.ajax({
            url: '/api/code/' + data.CodeId, // Change this to your API endpoint
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                row.find('td:not(:last-child)').each(function (index) {
                    var cell = $(this);
                    if (index < 3) { // Skip the last cell (actions)
                        var input = cell.find('input');
                        cell.text(input.val());
                    }
                });
                row.find('.edit').show();
                row.find('.save').hide();
                Swal.fire({
                    toast: true,
                    position: 'top',
                    customClass: {
                        toast: 'swal2-toast-top'
                    },
                    icon: 'success',
                    title: 'Code updated successfully',
                    showConfirmButton: false,
                    timer: 3000
                });
            },
            error: function (xhr, status, error) {
                Swal.fire({
                    toast: true,
                    position: 'top',
                    customClass: {
                        toast: 'swal2-toast-top'
                    },
                    icon: 'error',
                    title: 'Error updating code: ' + xhr.responseText,
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        });
    });

    // Handle delete button
    $('#codesTable').on('click', '.delete', function () {
        var row = $(this).closest('tr');
        var codeId = row.find('td:eq(4) span').text();

        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/api/code/' + codeId, // Change this to your API endpoint
                    type: 'DELETE',
                    success: function (response) {
                        table.row(row).remove().draw(false);
                        Swal.fire({
                            toast: true,
                            position: 'top',
                            customClass: {
                                toast: 'swal2-toast-top'
                            },
                            icon: 'success',
                            title: 'Code deleted successfully',
                            showConfirmButton: false,
                            timer: 3000
                        });
                    },
                    error: function (xhr, status, error) {
                        Swal.fire({
                            toast: true,
                            position: 'top',
                            customClass: {
                                toast: 'swal2-toast-top'
                            },
                            icon: 'error',
                            title: 'Error deleting code: ' + xhr.responseText,
                            showConfirmButton: false,
                            timer: 3000
                        });
                    }
                });
            }
        });
    });
});