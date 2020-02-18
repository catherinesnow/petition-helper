let PH = {
  formatData: function(text) {
    let rows      = PH.getRows(text);
    let row_count = rows.length;
    let data      = {};
    
    // Use the first row to get the email and name information since we really
    // just want that data once but it exists in all the rows
    let row_data = PH.getCells(rows[0]);
    data.email   = row_data[1];
    data.name    = row_data[2];
    data.rows    = [];

    // This repeats getting the first row, but leaving for readability
    // Get the desired cells from all the cells pasted
    for (let i=0; i<row_count; i++) {
      let cells = PH.getCells(rows[i]);
      data.rows.push({
        date:   cells[0],
        images: cells[3]
      });
    }

    return data;
  },

  getRows: function(text) {
    let rows = text.split('\n');
    
    return rows;
  },

  getCells: function(row) {
    // Desired cells:
    // 0 Date
    // 3 Email
    // 5 Name
    // 10 Images (comma seperated if more than one)
    let all_cells     = row.split('\t');
    let desired_cells = [0,3,5,10];
    let cells         = [];
    
    for (let i=0; i<desired_cells.length; i++) {
      let value = all_cells[desired_cells[i]];
      
      if (desired_cells[i] == 10) {
        cells[i] = value.split(', ');
      } else {
        cells[i] = value;
      }
    }

    return cells;
  },

  createTable: function(table_data) {
    let table_html = '';
    let rows       = table_data.rows;

    // Put the name and email in easy-to-copy-from readonly fields
    $('#name').val(table_data.name);
    $('#email').val(table_data.email);
    
    // Build out the preview HTML table for each row
    for (let i=0; i<rows.length; i++) {
      let row    = rows[i];
      let images = row.images;

      // If a row contains a comma seperated list of images, we want to repeat
      // each image on its own row with the same data from the original row
      // e.g. date | name | email | img_n <- repeat for each img   
      for (let j=0; j<images.length; j++) {
        let url      = new URL(images[j]);
        // Deconstruct the drive link in order to get the image url for preview
        // But also save the original drive link to show in the message table
        let image_id = url.searchParams.get('id');

        table_html += '<tr>';
        table_html += '<td class="date">' + row.date + '</td>';
        table_html += '<td class="image">';
        table_html += '<img src="https://docs.google.com/uc?id=' + image_id;
        table_html += '" data-doc="' + images[j] + '">';
        table_html += '</td>';
        table_html += '<td class="notes"><textarea></textarea></td>';
        table_html += '</tr>';
      }
    }

    $('#data').html(table_html);

    $('img').each(function(i, elem) {
      let $elem = $(elem);

      let image = new Image();
      image.src = $elem.attr('src');
      image.onload = function() {
        // Rotate the image to the correct orientation
        if (image.naturalWidth > image.naturalHeight) {
          $elem.addClass('rotate');
        }
      }
    });
  },

  createMessage: function() {
    // Clone HTML preview table, update img to drive link, & preserve line breaks
    let $message = $('#data').clone().attr('id', 'message');
  
    $message.find('tr').each(function(i, row) {
      let $row  = $(row);
      let $img  = $row.find('img');
      let doc   = $img.data('doc');
      let $text = $row.find('textarea');
      let text = $text.val().replace(/\r\n|\r|\n/g,"</br>");
      text     = text ? text: 'No changes';

      $img.replaceWith(doc);
      $text.replaceWith(text);
    })

    $message.appendTo('body');
  },

  bindEvents: function() {
    // On paste
    $('body').on('paste', '#paste', function(e) {
      let $this = $(this);
      
      $.each(e.originalEvent.clipboardData.items, function(i, v) {
        if (v.type === 'text/plain') {
          v.getAsString(function(text) {
            text = text.trim('\r\n');
            let table_data = PH.formatData(text);
  
            PH.createTable(table_data);
          });
        }
      });
    });
  
    // Expand image
    $('#data').on('click', 'img', function(e) {
      let $this = $(this);
  
      $this.closest('tr').toggleClass('expanded');
    });
  
    // Pre-filled change request dropdown
    $('#change-requests select').on('change', function() {
      let $this   = $(this);
      
      if ($this.val()) {
        let $target = $('.expanded .notes textarea');
        let value   = $target.val();
        value      += value ? "\n" : '';
        value      += $this.find('option:selected').text();
    
        $target.val(value);
      }
    });
  
    // Create message table
    $('#create-message button').on('click', function() {
      PH.createMessage();
    });

    // Show/hide sample data
    $('#show-sample').on('click', function() {
      $('#paste-sample').toggleClass('active');
    });
  },

  start: function() {
    PH.bindEvents();
  }
};

$(function() {
  PH.start();
});
