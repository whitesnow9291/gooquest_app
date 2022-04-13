
const { ipcRenderer } = require('electron')
const { api_url } = require('./config.js')
const axios = require('axios')
var storeData = {}
window.addEventListener('DOMContentLoaded', () => {
   var $ = require('jquery')
   function updateUIByData() {
      $('#email_list_id').val(storeData.email_list_id)
      $('#csv_directory_text').text(storeData.csv_directory_path)
      $('#loading_spinner').hide();
   }
   $('#csv_directory').on('click', () => {
      ipcRenderer.send('changeCSVDirectory')
   })
   $('#add-to-list').on('click', () => {
      const email_list_id = $('#email_list_id').val()
      if (email_list_id.length < 10) {
         $('#success').hide();
         $('#error').show();
         $('#error').text('Invalid email list ID!')
         return
      }
      $('#loading_spinner').show();
      storeData.email_list_id = email_list_id
      const url = api_url + '/app/get_email_list?email_list_id=' + storeData.email_list_id;
      axios.get(url)
         .then(function (response) {
            // handle success
            $('#loading_spinner').hide();
            if (response.data.success) {
               $('#error').hide();
               $('#success').show();
               ipcRenderer.send('changeStoreData', storeData)
            } else {
               $('#error').show();
               $('#error').text(response.data.error)
            }
         })
         .catch(function (error) {
            // handle error
            $('#loading_spinner').hide();
            $('#error').show();
            $('#error').text('Server error!')
         })
   })
   ipcRenderer.send('getStoreData')
   ipcRenderer.on('changeStoreData', (event, arg) => {
      storeData = arg
      updateUIByData()
   })
   ipcRenderer.on('changeCSVDirectoryPath', (event, arg) => {
      storeData.csv_directory_path = arg
      updateUIByData()
   });
   $('#error').hide();
   $('#success').hide();
})

